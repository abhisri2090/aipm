import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PackageManifestSchema } from "@aipm/schemas";

const execFileAsync = promisify(execFile);

export async function extractManifestFromTarball(
  tarball: Buffer,
): Promise<{ manifest: ReturnType<typeof PackageManifestSchema.parse>; integrity: string }> {
  const integrity =
    "sha256-" + createHash("sha256").update(tarball).digest("base64");

  const tempDir = await mkdtemp(join(tmpdir(), "aipm-publish-"));
  const tgzPath = join(tempDir, "package.tgz");
  try {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(tgzPath, tarball);
    await execFileAsync("tar", ["-xzf", tgzPath, "-C", tempDir]);
    const manifestPath = join(tempDir, "aipm.manifest.json");
    const raw = await readFile(manifestPath, "utf8");
    const manifest = PackageManifestSchema.parse(JSON.parse(raw));
    return { manifest, integrity };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
