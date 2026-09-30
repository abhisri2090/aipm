import { lstat, mkdtemp, readFile, readlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detachSkillShortcuts, installSharedSkill } from "./install-shared.js";

describe("installSharedSkill", () => {
  it("writes .ai/skills/<skill>/SKILL.md and relative dir links for each tool", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-shared-"));
    const result = await installSharedSkill({
      projectRoot: root,
      packageName: "@team/review-helper",
      tools: ["cursor", "claude", "codex"],
      skillMarkdown: "# hello\n",
      supportingFiles: [{ path: "references/guide.md", content: Buffer.from("# Guide\n") }],
    });

    const canonical = join(root, ".ai", "skills", "review-helper", "SKILL.md");
    const guide = join(root, ".ai", "skills", "review-helper", "references", "guide.md");
    expect(await readFile(canonical, "utf8")).toBe("# hello\n");
    expect(await readFile(guide, "utf8")).toBe("# Guide\n");
    expect(result.files).toEqual([canonical, guide]);

    for (const link of [
      join(root, ".cursor", "skills", "review-helper"),
      join(root, ".claude", "skills", "review-helper"),
      join(root, ".agents", "skills", "review-helper"),
    ]) {
      const info = await lstat(link);
      expect(info.isSymbolicLink()).toBe(true);
      expect(await readlink(link)).toBe("../../.ai/skills/review-helper");
      expect(Object.values(result.links)).toContain(link);
    }
  });

  it("detaches a tool shortcut without deleting the .ai skill", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-shared-"));
    await installSharedSkill({
      projectRoot: root,
      packageName: "@team/review-helper",
      tools: ["cursor"],
      skillMarkdown: "# hello\n",
    });
    await detachSkillShortcuts(root, "@team/review-helper", ["cursor"]);
    const canonical = join(root, ".ai", "skills", "review-helper", "SKILL.md");
    await expect(lstat(join(root, ".cursor", "skills", "review-helper"))).rejects.toThrow();
    expect(await readFile(canonical, "utf8")).toBe("# hello\n");
  });
});
