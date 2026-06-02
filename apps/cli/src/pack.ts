import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { copyStagedFiles } from "./publish-state.js";

const execFileAsync = promisify(execFile);

export async function packDirectory(dir: string): Promise<Buffer> {
  const { stdout } = await execFileAsync("tar", ["-czf", "-", "-C", dir, "."], {
    maxBuffer: 50 * 1024 * 1024,
    encoding: "buffer",
  });
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

export async function packStagedFiles(root: string): Promise<Buffer> {
  const tempDir = await mkdtemp(join(tmpdir(), "aipm-publish-stage-"));
  try {
    await copyStagedFiles(root, tempDir);
    return packDirectory(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function unpackTarballToBuffer(tarball: Buffer, entry: string): Promise<string> {
  const { mkdtemp, rm, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const tempDir = await mkdtemp(join(tmpdir(), "aipm-install-"));
  const tgzPath = join(tempDir, "pkg.tgz");
  try {
    await writeFile(tgzPath, tarball);
    await execFileAsync("tar", ["-xzf", tgzPath, "-C", tempDir]);
    return readFile(join(tempDir, entry), "utf8");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
