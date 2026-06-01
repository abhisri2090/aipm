import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { extractManifestFromTarball, validateTarballEntries } from "./publish.js";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createSkillTarball(options: { entry?: string } = {}): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "aipm-skill-"));
  tempDirs.push(dir);
  const entry = options.entry ?? "SKILL.md";
  await writeFile(join(dir, "SKILL.md"), "Skill body\n");
  await writeFile(
    join(dir, "aipm.manifest.json"),
    JSON.stringify({
      schemaVersion: "0.1",
      name: "@team/test-skill",
      version: "1.0.0",
      type: "skill",
      description: "Test skill",
      entry,
      targets: ["cursor"],
    }),
  );
  const { stdout } = await execFileAsync("tar", ["-czf", "-", "-C", dir, "."], {
    encoding: "buffer",
  });
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

describe("validateTarballEntries", () => {
  it("rejects unsafe parent traversal entries", () => {
    expect(() => validateTarballEntries(["./aipm.manifest.json", "../secret"])).toThrow(
      "Unsafe tar entry",
    );
  });

  it("requires exactly one manifest", () => {
    expect(() => validateTarballEntries(["./SKILL.md"])).toThrow(
      "exactly one aipm.manifest.json",
    );
  });
});

describe("extractManifestFromTarball", () => {
  it("extracts a valid manifest", async () => {
    const tarball = await createSkillTarball();
    await expect(extractManifestFromTarball(tarball)).resolves.toMatchObject({
      manifest: {
        name: "@team/test-skill",
        version: "1.0.0",
      },
    });
  });

  it("rejects manifests whose entry file is missing", async () => {
    const tarball = await createSkillTarball({ entry: "missing.md" });
    await expect(extractManifestFromTarball(tarball)).rejects.toThrow("Manifest entry not found");
  });
});
