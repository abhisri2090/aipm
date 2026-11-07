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
  assertSkillNotImported,
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

  it("parses folded block scalar (>)", () => {
    const frontmatter = parseFrontmatter(`---
name: my-skill
description: >
  This is a multi-line
  description that gets folded.
---
# Content`);
    expect(frontmatter.name).toBe("my-skill");
    expect(frontmatter.description).toBe("This is a multi-line description that gets folded.\n");
  });

  it("parses literal block scalar (|)", () => {
    const frontmatter = parseFrontmatter(`---
name: my-skill
description: |
  Line one.
  Line two.
---
# Content`);
    expect(frontmatter.name).toBe("my-skill");
    expect(frontmatter.description).toBe("Line one.\nLine two.\n");
  });

  it("parses folded block scalar with chomping (>-)", () => {
    const frontmatter = parseFrontmatter(`---
name: my-skill
description: >-
  Multi-line folded
  without trailing newline.
---
# Content`);
    expect(frontmatter.description).toBe("Multi-line folded without trailing newline.");
  });

  it("parses literal block scalar with chomping (|-)", () => {
    const frontmatter = parseFrontmatter(`---
name: my-skill
description: |-
  Line one.
  Line two.
---
# Content`);
    expect(frontmatter.description).toBe("Line one.\nLine two.");
  });

  it("parses quoted values", () => {
    const frontmatter = parseFrontmatter(`---
name: "my-skill"
description: 'A skill with: colons'
---
# Content`);
    expect(frontmatter.name).toBe("my-skill");
    expect(frontmatter.description).toBe("A skill with: colons");
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

  it("rejects import when the skill already exists", () => {
    expect(() => assertSkillNotImported("@mattpocock/grill-me", "1.0.0")).toThrow(
      "Skill already exists: @mattpocock/grill-me@1.0.0",
    );
    expect(() => assertSkillNotImported("@mattpocock/grill-me", null)).not.toThrow();
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
