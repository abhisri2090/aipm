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
