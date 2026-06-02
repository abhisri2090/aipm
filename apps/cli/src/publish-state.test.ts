import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addPublishFiles,
  readPublishState,
  removePublishFiles,
  resetPublishState,
  statusPublishState,
  validatePublishState,
} from "./publish-state.js";

async function createSkillFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "aipm-cli-publish-"));
  await writeFile(
    join(root, "aipm.manifest.json"),
    JSON.stringify(
      {
        schemaVersion: "0.1",
        name: "@team/test-skill",
        version: "1.0.0",
        type: "skill",
        description: "Test skill",
        entry: "SKILL.md",
        targets: ["cursor"],
        license: "Apache-2.0",
      },
      null,
      2,
    ),
  );
  await writeFile(join(root, "SKILL.md"), "# Test skill\n");
  await writeFile(join(root, ".env"), "SECRET=value\n");
  return root;
}

describe("publish state", () => {
  it("stages publish files and excludes sensitive files", async () => {
    const root = await createSkillFixture();
    const state = await addPublishFiles(root, ["."]);

    expect(state.files.map((entry) => entry.path).sort()).toEqual([
      "SKILL.md",
      "aipm.manifest.json",
    ]);
    await expect(validatePublishState(root)).resolves.toMatchObject({
      manifest: { name: "@team/test-skill" },
    });
  });

  it("tracks changed staged files", async () => {
    const root = await createSkillFixture();
    await addPublishFiles(root, ["."]);
    await writeFile(join(root, "SKILL.md"), "# Changed\n");

    const rows = await statusPublishState(root);
    expect(rows.find((row) => row.path === "SKILL.md")?.changed).toBe(true);
    await expect(validatePublishState(root)).rejects.toThrow(/changed after add/);
  });

  it("honors .aipmignore patterns", async () => {
    const root = await createSkillFixture();
    await writeFile(join(root, ".aipmignore"), "notes/\n*.tmp\n", "utf8");
    await mkdir(join(root, "notes"));
    await writeFile(join(root, "notes", "draft.md"), "draft\n", "utf8");
    await writeFile(join(root, "scratch.tmp"), "temporary\n", "utf8");

    const state = await addPublishFiles(root, ["."]);

    expect(state.files.some((entry) => entry.path === "notes/draft.md")).toBe(false);
    expect(state.files.some((entry) => entry.path === "scratch.tmp")).toBe(false);
  });

  it("rejects files that look like secrets", async () => {
    const root = await createSkillFixture();
    await writeFile(join(root, "SKILL.md"), "DefaultEndpointsProtocol=https;AccountKey=abc\n");
    await addPublishFiles(root, ["."]);

    await expect(validatePublishState(root)).rejects.toThrow(/looks like it contains a secret/);
  });

  it("removes and resets staged files", async () => {
    const root = await createSkillFixture();
    await addPublishFiles(root, ["."]);
    await removePublishFiles(root, ["SKILL.md"]);

    expect((await readPublishState(root)).files.map((entry) => entry.path)).toEqual([
      "aipm.manifest.json",
    ]);
    await resetPublishState(root);
    await expect(readFile(join(root, ".aipm", "publish-state.json"), "utf8")).rejects.toThrow();
  });
});
