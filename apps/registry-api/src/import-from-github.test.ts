import { describe, expect, it } from "vitest";
import {
  buildPackageName,
  computeContentHash,
  nextPatchVersion,
  parseGitHubFolderUrl,
  resolveImportVersion,
  resolveUsage,
} from "./import-from-github.js";

describe("import-from-github helpers", () => {
  it("parses github folder urls", () => {
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

  it("builds package names from owner and folder", () => {
    expect(buildPackageName("mattpocock", "grill-me")).toBe("@mattpocock/grill-me");
  });

  it("skips unchanged imports and bumps patch versions", () => {
    expect(
      resolveImportVersion({
        latestVersion: "1.0.0",
        latestContentHash: "abc",
        contentHash: "abc",
      }).action,
    ).toBe("skip");
    expect(nextPatchVersion("1.0.0")).toBe("1.0.1");
    expect(
      resolveImportVersion({
        latestVersion: "1.0.0",
        latestContentHash: "abc",
        contentHash: "def",
      }),
    ).toMatchObject({ action: "publish", version: "1.0.1" });
  });

  it("hashes folder contents deterministically", () => {
    const hashA = computeContentHash({ "SKILL.md": "hello", LICENSE: "Apache" });
    const hashB = computeContentHash({ LICENSE: "Apache", "SKILL.md": "hello" });
    expect(hashA).toBe(hashB);
  });

  it("prefers usage frontmatter and falls back to the first skill paragraph", () => {
    expect(
      resolveUsage({
        frontmatter: { usage: "Ask the assistant to grill your plan." },
        entryContent: "# Grill me\n\nOther text.",
      }),
    ).toBe("Ask the assistant to grill your plan.");

    expect(
      resolveUsage({
        frontmatter: {},
        entryContent: "---\ndescription: Grill me\n---\n# Grill me\n\nStress-test your idea before you build it.",
      }),
    ).toBe("Stress-test your idea before you build it.");
  });
});
