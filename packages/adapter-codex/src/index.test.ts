import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { codexSkillAdapter } from "./index.js";

describe("CodexSkillAdapter", () => {
  it("writes SKILL.md under .agents/skills/<short>", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-codex-"));
    const result = await codexSkillAdapter.installSkill({
      packageName: "@team/review-helper",
      version: "1.0.0",
      skillMarkdown: "# Review helper\n",
      projectRoot: root,
    });
    const expected = join(root, ".agents", "skills", "review-helper", "SKILL.md");
    expect(result.writtenPaths).toEqual([expected]);
    expect(await readFile(expected, "utf8")).toBe("# Review helper\n");
  });
});
