import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { extractManifestFromTarball, listTarballFiles, readTarballFile, validatePackageFilePath, validateTarballEntries } from "./publish.js";

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

  it("rejects manifests whose install files are missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aipm-skill-"));
    tempDirs.push(dir);
    await writeFile(join(dir, "SKILL.md"), "Skill body\n");
    await writeFile(
      join(dir, "aipm.manifest.json"),
      JSON.stringify({
        schemaVersion: "0.1",
        name: "@team/test-skill",
        version: "1.0.0",
        type: "skill",
        description: "Test skill",
        entry: "SKILL.md",
        targets: ["cursor"],
        install: {
          helperFiles: [{ from: "setup/SETUP_PROMPT.md", to: "SETUP_PROMPT.md" }],
          postInstall: { mode: "manual_prompt", promptFile: "SETUP_PROMPT.md" },
        },
      }),
    );
    const { stdout } = await execFileAsync("tar", ["-czf", "-", "-C", dir, "."], {
      encoding: "buffer",
    });
    const tarball = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);

    await expect(extractManifestFromTarball(tarball)).rejects.toThrow(
      "Manifest install file not found: setup/SETUP_PROMPT.md",
    );
  });
});

describe("validatePackageFilePath", () => {
  it("rejects path traversal", () => {
    expect(() => validatePackageFilePath("../secret")).toThrow("Unsafe file path");
  });

  it("normalizes leading ./", () => {
    expect(validatePackageFilePath("./SKILL.md")).toBe("SKILL.md");
  });
});

describe("listTarballFiles", () => {
  it("lists files with sizes", async () => {
    const tarball = await createSkillTarball();
    const files = await listTarballFiles(tarball);
    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "SKILL.md" }),
        expect.objectContaining({ path: "aipm.manifest.json" }),
      ]),
    );
  });
});

describe("readTarballFile", () => {
  it("reads entry file content", async () => {
    const tarball = await createSkillTarball();
    const file = await readTarballFile(tarball, "SKILL.md");
    expect(file.binary).toBe(false);
    expect(file.content).toBe("Skill body\n");
  });

  it("rejects missing files", async () => {
    const tarball = await createSkillTarball();
    await expect(readTarballFile(tarball, "missing.md")).rejects.toThrow("File not found");
  });

  it("rejects unsafe paths", async () => {
    const tarball = await createSkillTarball();
    await expect(readTarballFile(tarball, "../secret")).rejects.toThrow("Unsafe file path");
  });
});
