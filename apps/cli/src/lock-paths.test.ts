import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { fromLockfilePath, relativizeLockfile, toLockfilePath } from "./lock-paths.js";
import type { Lockfile } from "@aipm-registry/schemas";

describe("lockfile paths", () => {
  it("stores skill and helper paths relative to the project root", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-lock-paths-"));
    const skill = join(root, ".cursor", "skills", "seo-audit", "SKILL.md");
    const helper = join(root, ".aipm", "helpers", "team__pkg", "1.0.0", "SETUP_PROMPT.md");

    expect(toLockfilePath(root, skill)).toBe(".cursor/skills/seo-audit/SKILL.md");
    expect(toLockfilePath(root, helper)).toBe(".aipm/helpers/team__pkg/1.0.0/SETUP_PROMPT.md");
    expect(fromLockfilePath(root, ".cursor/skills/seo-audit/SKILL.md")).toBe(skill);
    expect(fromLockfilePath(root, skill)).toBe(skill);
  });

  it("relativizes every stored lockfile path field", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-lock-rel-"));
    const lock: Lockfile = {
      schemaVersion: "0.1",
      packages: {
        "@team/free-skill": {
          version: "1.0.0",
          integrity: "sha256-test",
          registry: "https://api.aipm-registry.com",
          resolvedTools: ["cursor"],
          installed: { cursor: [join(root, ".cursor", "skills", "free-skill", "SKILL.md")] },
          shared: {
            root: join(root, ".ai", "skills", "free-skill"),
            files: [join(root, ".ai", "skills", "free-skill", "SKILL.md")],
          },
          installedAssets: {
            main: [join(root, "debug-log-server", "server.js")],
            helper: [join(root, ".aipm", "helpers", "team__free-skill", "1.0.0", "SETUP_PROMPT.md")],
          },
          postInstall: {
            mode: "manual_prompt",
            status: "pending",
            promptFile: join(root, ".aipm", "helpers", "team__free-skill", "1.0.0", "SETUP_PROMPT.md"),
            cleanup: "manual",
          },
        },
      },
      prompts: {
        "brain-dump": {
          id: "p1",
          url: "https://www.aipm-registry.com/prompts/aipm/brain-dump",
          publisher: "aipm",
          slug: "brain-dump",
          contentHash: "abc",
          updatedAt: "2026-01-01T00:00:00.000Z",
          installedPath: join(root, ".aipm", "prompts", "aipm--brain-dump.md"),
        },
      },
    };

    expect(relativizeLockfile(root, lock)).toMatchObject({
      packages: {
        "@team/free-skill": {
          installed: { cursor: [".cursor/skills/free-skill/SKILL.md"] },
          shared: {
            root: ".ai/skills/free-skill",
            files: [".ai/skills/free-skill/SKILL.md"],
          },
          installedAssets: {
            main: ["debug-log-server/server.js"],
            helper: [".aipm/helpers/team__free-skill/1.0.0/SETUP_PROMPT.md"],
          },
          postInstall: { promptFile: ".aipm/helpers/team__free-skill/1.0.0/SETUP_PROMPT.md" },
        },
      },
      prompts: {
        "brain-dump": { installedPath: ".aipm/prompts/aipm--brain-dump.md" },
      },
    });
  });
});
