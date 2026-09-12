import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PackageManifestSchema } from "@aipm-registry/schemas";
import { errorScanResult, scanFiles, type ScanResult } from "./security-scan.js";

const execFileAsync = promisify(execFile);
const MAX_TARBALL_BYTES = 50 * 1024 * 1024;
export const MAX_PACKAGE_FILE_BYTES = 512 * 1024;
const MAX_SCANNED_FILES = 200;
const MAX_SCANNED_BYTES_TOTAL = 5 * 1024 * 1024;

export class PackageFileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackageFileNotFoundError";
  }
}

export class PackageFileTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackageFileTooLargeError";
  }
}

function normalizeTarEntry(entry: string): string {
  return entry.replace(/^\.\//, "");
}

export async function listTarballEntries(tarballPath: string): Promise<string[]> {
  const { stdout } = await execFileAsync("tar", ["-tzf", tarballPath], {
    maxBuffer: 1024 * 1024,
  });
  return stdout
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function validateTarballEntries(entries: string[]): void {
  let manifestCount = 0;

  for (const entry of entries) {
    const normalized = normalizeTarEntry(entry);
    if (!normalized || normalized === ".") continue;
    if (
      normalized.startsWith("/") ||
      normalized === ".." ||
      normalized.startsWith("../") ||
      normalized.includes("/../")
    ) {
      throw new Error(`Unsafe tar entry: ${entry}`);
    }
    if (normalized === "aipm.manifest.json") manifestCount += 1;
  }

  if (manifestCount !== 1) {
    throw new Error("Package must contain exactly one aipm.manifest.json");
  }
}

export function validatePackageFilePath(path: string): string {
  const normalized = normalizeTarEntry(path.trim());
  if (!normalized || normalized === ".") {
    throw new Error("Invalid file path");
  }
  if (
    normalized.startsWith("/") ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.includes("/../")
  ) {
    throw new Error(`Unsafe file path: ${path}`);
  }
  return normalized;
}

function installReferencedFiles(manifest: ReturnType<typeof PackageManifestSchema.parse>): string[] {
  const install = manifest.install;
  if (!install) return [];
  return [
    ...(install.mainFiles ?? []).map((file) => file.from),
    ...(install.helperFiles ?? []).map((file) => file.from),
  ];
}

async function writeTarballToTemp(tarball: Buffer): Promise<{ tempDir: string; tgzPath: string }> {
  if (tarball.length > MAX_TARBALL_BYTES) {
    throw new Error("Package tarball exceeds 50 MB limit");
  }
  const tempDir = await mkdtemp(join(tmpdir(), "aipm-files-"));
  const tgzPath = join(tempDir, "package.tgz");
  const { writeFile } = await import("node:fs/promises");
  await writeFile(tgzPath, tarball);
  return { tempDir, tgzPath };
}

export async function listTarballFiles(tarball: Buffer): Promise<{ path: string; sizeBytes: number }[]> {
  const { tempDir, tgzPath } = await writeTarballToTemp(tarball);
  try {
    const entries = await listTarballEntries(tgzPath);
    validateTarballEntries(entries);
    await execFileAsync("tar", ["-xzf", tgzPath, "-C", tempDir]);
    const files: { path: string; sizeBytes: number }[] = [];
    for (const entry of entries) {
      const normalized = normalizeTarEntry(entry);
      if (!normalized || normalized.endsWith("/")) continue;
      const fileStat = await stat(join(tempDir, normalized)).catch(() => null);
      if (fileStat?.isFile()) {
        files.push({ path: normalized, sizeBytes: fileStat.size });
      }
    }
    return files.sort((left, right) => left.path.localeCompare(right.path));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function readTarballFile(
  tarball: Buffer,
  filePath: string,
): Promise<{ content: string; sizeBytes: number; binary: boolean }> {
  const path = validatePackageFilePath(filePath);
  const { tempDir, tgzPath } = await writeTarballToTemp(tarball);
  try {
    const entries = await listTarballEntries(tgzPath);
    validateTarballEntries(entries);
    const fileEntries = new Map(
      entries
        .map((entry) => [normalizeTarEntry(entry), entry] as const)
        .filter(([normalized]) => normalized && !normalized.endsWith("/")),
    );
    const tarEntry = fileEntries.get(path);
    if (!tarEntry) {
      throw new PackageFileNotFoundError(`File not found: ${path}`);
    }
    const { stdout } = await execFileAsync("tar", ["-xOzf", tgzPath, tarEntry], {
      encoding: "buffer",
      maxBuffer: MAX_PACKAGE_FILE_BYTES + 1,
    });
    const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
    const sizeBytes = buffer.length;
    if (buffer.includes(0)) {
      return { content: "", sizeBytes, binary: true };
    }
    if (sizeBytes > MAX_PACKAGE_FILE_BYTES) {
      throw new PackageFileTooLargeError(`File exceeds ${MAX_PACKAGE_FILE_BYTES} byte limit: ${path}`);
    }
    return { content: buffer.toString("utf8"), sizeBytes, binary: false };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function manifestScanFields(
  manifest: ReturnType<typeof PackageManifestSchema.parse>,
): { path: string; content: string }[] {
  const fields: { path: string; content: string }[] = [
    { path: "aipm.manifest.json#description", content: manifest.description },
  ];
  if (manifest.usage) fields.push({ path: "aipm.manifest.json#usage", content: manifest.usage });
  if (manifest.agentDescription) {
    fields.push({ path: "aipm.manifest.json#agentDescription", content: manifest.agentDescription });
  }
  if (manifest.releaseNotes) {
    fields.push({ path: "aipm.manifest.json#releaseNotes", content: manifest.releaseNotes });
  }
  for (const [index, example] of (manifest.examples ?? []).entries()) {
    fields.push({ path: `aipm.manifest.json#examples[${index}]`, content: example.prompt });
  }
  return fields;
}

/**
 * Runs the automated security scan (see security-scan.ts) over every text file in a published
 * tarball plus the manifest's free-text fields. Never throws: scan failures degrade to an
 * "error" status rather than blocking publish.
 */
export async function scanPackageTarball(
  tarball: Buffer,
  manifest: ReturnType<typeof PackageManifestSchema.parse>,
): Promise<ScanResult> {
  try {
    const entries = await listTarballFiles(tarball);
    const files: { path: string; content: string }[] = [...manifestScanFields(manifest)];
    let scannedBytes = 0;
    for (const entry of entries.slice(0, MAX_SCANNED_FILES)) {
      if (scannedBytes >= MAX_SCANNED_BYTES_TOTAL) break;
      if (entry.sizeBytes > MAX_PACKAGE_FILE_BYTES) continue;
      try {
        const file = await readTarballFile(tarball, entry.path);
        if (file.binary) continue;
        scannedBytes += file.sizeBytes;
        files.push({ path: entry.path, content: file.content });
      } catch {
        // Unreadable individual file; skip rather than fail the whole scan.
      }
    }
    return scanFiles(files);
  } catch {
    return errorScanResult();
  }
}

export async function extractManifestFromTarball(
  tarball: Buffer,
): Promise<{ manifest: ReturnType<typeof PackageManifestSchema.parse>; integrity: string }> {
  if (tarball.length > MAX_TARBALL_BYTES) {
    throw new Error("Package tarball exceeds 50 MB limit");
  }

  const integrity =
    "sha256-" + createHash("sha256").update(tarball).digest("base64");

  const tempDir = await mkdtemp(join(tmpdir(), "aipm-publish-"));
  const tgzPath = join(tempDir, "package.tgz");
  try {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(tgzPath, tarball);
    validateTarballEntries(await listTarballEntries(tgzPath));
    await execFileAsync("tar", ["-xzf", tgzPath, "-C", tempDir]);
    const manifestPath = join(tempDir, "aipm.manifest.json");
    const raw = await readFile(manifestPath, "utf8");
    const manifest = PackageManifestSchema.parse(JSON.parse(raw));
    const entryStat = await stat(join(tempDir, manifest.entry)).catch(() => null);
    if (!entryStat?.isFile()) {
      throw new Error(`Manifest entry not found: ${manifest.entry}`);
    }
    for (const file of installReferencedFiles(manifest)) {
      const fileStat = await stat(join(tempDir, file)).catch(() => null);
      if (!fileStat?.isFile()) {
        throw new Error(`Manifest install file not found: ${file}`);
      }
    }
    return { manifest, integrity };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
