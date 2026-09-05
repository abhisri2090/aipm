import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { installSkillPackage } from "./install-skill.js";
import type { PackageManifest } from "@aipm-registry/schemas";

const manifest: PackageManifest = {
  schemaVersion: "0.1",
  name: "@team/review-helper",
  version: "1.0.0",
  type: "skill",
  description: "test",
  entry: "SKILL.md",
  targets: ["codex"],
};

describe("installSkillPackage", () => {
  it("installs to .agents/skills for codex", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-install-"));
    const result = await installSkillPackage({
      projectRoot: root,
      manifest,
      skillMarkdown: "# hello\n",
      explicitTarget: "codex",
    });
    const path = join(root, ".agents", "skills", "review-helper", "SKILL.md");
    expect(result.resolvedTools).toEqual(["codex"]);
    expect(result.installed.codex).toEqual([path]);
    expect(await readFile(path, "utf8")).toBe("# hello\n");
  });

  it("keeps cursor path shape", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-install-"));
    const cursorManifest: PackageManifest = { ...manifest, targets: ["cursor"] };
    const result = await installSkillPackage({
      projectRoot: root,
      manifest: cursorManifest,
      skillMarkdown: "# c\n",
      explicitTarget: "cursor",
    });
    const path = join(root, ".cursor", "aipm", "skills", "review-helper.md");
    expect(result.installed.cursor).toEqual([path]);
  });
});
