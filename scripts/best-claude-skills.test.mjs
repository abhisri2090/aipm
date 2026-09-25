import { describe, expect, it } from "vitest";
import { rankBestClaudeSkills, sourceRepoOf } from "../apps/web/lib/best-claude-skills";

const skill = (name, overrides = {}) => ({
  name,
  version: "1.0.0",
  description: `${name} does one useful job well`,
  type: "skill",
  targets: ["*"],
  license: "MIT",
  integrity: "sha256-x",
  sizeBytes: 1,
  createdAt: "2026-09-01T00:00:00Z",
  installCount: 0,
  githubStars: null,
  publisher: { org: { slug: "org", name: "Org" }, user: { githubLogin: "org", name: null, avatarUrl: null } },
  import: { imported: true, sourceUrl: null },
  scan: { status: "clean", scannedAt: null, scannerVersion: null, checksPerformed: [], findings: [] },
  ...overrides,
});

describe("best Claude skills ranking", () => {
  it("parses GitHub source repositories from tree URLs", () => {
    expect(
      sourceRepoOf({ import: { imported: true, sourceUrl: "https://github.com/anthropics/skills/tree/main/skills/pdf" } }),
    ).toEqual({ slug: "anthropics/skills", url: "https://github.com/anthropics/skills" });
    expect(sourceRepoOf({ sourceUrl: "https://gitlab.com/a/b" })).toBeNull();
    expect(sourceRepoOf({ sourceUrl: null })).toBeNull();
  });

  it("ranks only real installs, excludes flagged and non-Claude skills, and groups repos by stars", () => {
    const repoA = { imported: true, sourceUrl: "https://github.com/a/skills/tree/main/x" };
    const repoB = { imported: true, sourceUrl: "https://github.com/b/skills/tree/main/y" };
    const data = rankBestClaudeSkills([
      skill("@a/one", { installCount: 2, githubStars: 100, import: repoA }),
      skill("@a/two", { installCount: 5, githubStars: 100, import: repoA }),
      skill("@b/three", { installCount: 0, githubStars: 900, import: repoB }),
      skill("@b/flagged", {
        installCount: 50,
        githubStars: 900,
        import: repoB,
        scan: { status: "flagged", scannedAt: null, scannerVersion: null, checksPerformed: [], findings: [] },
      }),
      skill("@c/cursor-only", { installCount: 40, targets: ["cursor"] }),
      skill("@d/no-source", { installCount: 1 }),
      skill("@a/broken", { description: ">", githubStars: 100, import: repoA }),
    ]);

    expect(data.mostInstalled.map((pkg) => pkg.name)).toEqual(["@a/two", "@a/one", "@d/no-source"]);
    expect(data.flaggedExcluded).toBe(1);
    expect(data.eligibleCount).toBe(5);
    expect(data.repos.map((repo) => repo.repo.slug)).toEqual(["b/skills", "a/skills"]);
    expect(data.repos[1].skills.map((pkg) => pkg.name)).toEqual(["@a/two", "@a/one"]);
    expect(data.repos[1].totalInstalls).toBe(7);
  });
});
