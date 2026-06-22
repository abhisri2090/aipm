import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PackageManifestSchema } from "@aipm-registry/schemas";

const execFileAsync = promisify(execFile);
const MAX_TARBALL_BYTES = 50 * 1024 * 1024;
export const MAX_PACKAGE_FILE_BYTES = 512 * 1024;

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
    const fileEntries = new Set(
      entries
        .map((entry) => normalizeTarEntry(entry))
        .filter((entry) => entry && !entry.endsWith("/")),
    );
    if (!fileEntries.has(path)) {
      throw new PackageFileNotFoundError(`File not found: ${path}`);
    }
    const { stdout } = await execFileAsync("tar", ["-xOzf", tgzPath, path], {
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
    return { manifest, integrity };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
