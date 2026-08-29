import { describe, expect, it } from "vitest";
import {
  buildPackageName,
  computeContentHash,
  nextPatchVersion,
  normalizeOrgSlug,
  normalizeSkillSlug,
  parseFrontmatter,
  parseGitHubFolderUrl,
  resolveDescription,
  resolveImportVersion,
  truncateDescription,
} from "./import-skill-lib.mjs";

describe("parseGitHubFolderUrl", () => {
  it("parses a github tree folder url", () => {
    expect(
      parseGitHubFolderUrl(
        "https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me",
      ),
    ).toEqual({
      owner: "mattpocock",
      repo: "skills",
      branch: "main",
      path: "skills/productivity/grill-me",
    });
  });

  it("parses a github blob folder url", () => {
    expect(
      parseGitHubFolderUrl(
        "https://github.com/anthropics/skills/blob/main/skills/frontend-design",
      ),
    ).toEqual({
      owner: "anthropics",
      repo: "skills",
      branch: "main",
      path: "skills/frontend-design",
    });
  });

  it("parses a github repo url", () => {
    expect(parseGitHubFolderUrl("https://github.com/obra/superpowers")).toEqual({
      owner: "obra",
      repo: "superpowers",
      branch: "",
      path: "",
    });
  });
});

describe("slug normalization", () => {
  it("normalizes org and skill slugs", () => {
    expect(normalizeOrgSlug("MattPocock")).toBe("mattpocock");
    expect(normalizeSkillSlug("Grill Me!")).toBe("grill-me");
    expect(buildPackageName("MattPocock", "Grill Me")).toBe("@mattpocock/grill-me");
  });
});

describe("frontmatter + version logic", () => {
  it("parses description from frontmatter", () => {
    const frontmatter = parseFrontmatter(`---\nname: grill-me\ndescription: Stress test a plan\n---\n# Grill me`);
    expect(
      resolveDescription({ frontmatter, readmeContent: null, fallbackName: "grill-me" }),
    ).toBe("Stress test a plan");
  });

  it("bumps version when content hash changes", () => {
    expect(nextPatchVersion("1.0.0")).toBe("1.0.1");
    expect(
      resolveImportVersion({
        latestVersion: "1.0.0",
        latestContentHash: "abc",
        contentHash: "abc",
      }).action,
    ).toBe("skip");
    expect(
      resolveImportVersion({
        latestVersion: "1.0.0",
        latestContentHash: "abc",
        contentHash: "def",
      }),
    ).toEqual({ action: "publish", version: "1.0.1" });
  });

  it("hashes folder contents deterministically", () => {
    const hashA = computeContentHash({ "SKILL.md": "hello", LICENSE: "Apache" });
    const hashB = computeContentHash({ LICENSE: "Apache", "SKILL.md": "hello" });
    expect(hashA).toBe(hashB);
  });

  it("truncates long descriptions", () => {
    const long = "a".repeat(300);
    expect(truncateDescription(long).length).toBe(240);
  });
});
