import { mkdtemp, readFile, stat } from "node:fs/promises";
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
      supportingFiles: [
        { path: "references/guide.md", content: Buffer.from("# Guide\n") },
        { path: "LICENSE", content: Buffer.from("Apache License\n") },
      ],
      explicitTarget: "codex",
    });
    const path = join(root, ".agents", "skills", "review-helper", "SKILL.md");
    const guidePath = join(root, ".agents", "skills", "review-helper", "references", "guide.md");
    const licensePath = join(root, ".agents", "skills", "review-helper", "LICENSE");
    expect(result.resolvedTools).toEqual(["codex"]);
    expect(result.installed.codex).toEqual([path, guidePath, licensePath]);
    expect(await readFile(path, "utf8")).toBe("# hello\n");
    expect(await readFile(guidePath, "utf8")).toBe("# Guide\n");
    expect(await readFile(licensePath, "utf8")).toBe("Apache License\n");
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

  it("installs Claude skills in Claude Code's native project directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-install-"));
    const claudeManifest: PackageManifest = { ...manifest, targets: ["claude"] };
    const result = await installSkillPackage({
      projectRoot: root,
      manifest: claudeManifest,
      skillMarkdown: "# Claude skill\n",
      supportingFiles: [{ path: "scripts/run.sh", content: Buffer.from("#!/bin/sh\n"), mode: 0o755 }],
      explicitTarget: "claude",
    });
    const path = join(root, ".claude", "skills", "review-helper", "SKILL.md");
    const scriptPath = join(root, ".claude", "skills", "review-helper", "scripts", "run.sh");
    expect(result.installed.claude).toEqual([path, scriptPath]);
    expect(await readFile(path, "utf8")).toBe("# Claude skill\n");
    expect(await readFile(scriptPath, "utf8")).toBe("#!/bin/sh\n");
    expect((await stat(scriptPath)).mode & 0o111).toBe(0o111);
  });

  it("rejects supporting files that can overwrite the skill entry", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-install-"));
    await expect(installSkillPackage({
      projectRoot: root,
      manifest,
      skillMarkdown: "# hello\n",
      supportingFiles: [{ path: "skill.md", content: Buffer.from("overwrite") }],
      explicitTarget: "codex",
    })).rejects.toThrow(/Unsafe or duplicate skill supporting file path/);
  });
});
