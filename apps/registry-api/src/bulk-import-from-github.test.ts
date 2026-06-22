import { beforeEach, describe, expect, it, vi } from "vitest";

const listGitHubSubfolders = vi.fn();
const importSkillFromGitHubUrl = vi.fn();

vi.mock("./import-from-github.js", () => ({
  parseGitHubFolderUrl: vi.fn(() => ({
    owner: "anthropics",
    repo: "skills",
    branch: "main",
    path: "skills",
  })),
  buildGitHubTreeUrl: vi.fn((_ref, subfolder: string) =>
    `https://github.com/anthropics/skills/tree/main/skills/${subfolder}`,
  ),
  listGitHubSubfolders: (...args: unknown[]) => listGitHubSubfolders(...args),
  importSkillFromGitHubUrl: (...args: unknown[]) => importSkillFromGitHubUrl(...args),
}));

import { bulkImportSkillsFromGitHubFolder } from "./bulk-import-from-github.js";

describe("bulkImportSkillsFromGitHubFolder", () => {
  beforeEach(() => {
    listGitHubSubfolders.mockReset();
    importSkillFromGitHubUrl.mockReset();
  });

  it("imports each subfolder and summarizes results", async () => {
    listGitHubSubfolders.mockResolvedValue(["alpha-skill", "beta-skill"]);
    importSkillFromGitHubUrl
      .mockResolvedValueOnce({
        action: "published",
        sourceUrl: "https://github.com/anthropics/skills/tree/main/skills/alpha-skill",
        packageName: "@anthropics/alpha-skill",
        version: "1.0.0",
        contentHash: "hash-a",
        integrity: "sha256-a",
        userId: "user-a",
      })
      .mockResolvedValueOnce({
        action: "skipped",
        sourceUrl: "https://github.com/anthropics/skills/tree/main/skills/beta-skill",
        packageName: "@anthropics/beta-skill",
        version: "1.0.1",
        contentHash: "hash-b",
      });

    await expect(
      bulkImportSkillsFromGitHubFolder({
        pool: {} as never,
        metadata: {} as never,
        storage: {} as never,
        sourceUrl: "https://github.com/anthropics/skills/tree/main/skills",
      }),
    ).resolves.toMatchObject({
      parentUrl: "https://github.com/anthropics/skills/tree/main/skills",
      subfolders: ["alpha-skill", "beta-skill"],
      summary: { published: 1, skipped: 1, failed: 0 },
    });
  });

  it("aborts on first failure and returns partial results", async () => {
    listGitHubSubfolders.mockResolvedValue(["alpha-skill", "beta-skill"]);
    importSkillFromGitHubUrl
      .mockResolvedValueOnce({
        action: "published",
        sourceUrl: "https://github.com/anthropics/skills/tree/main/skills/alpha-skill",
        packageName: "@anthropics/alpha-skill",
        version: "1.0.0",
        contentHash: "hash-a",
        integrity: "sha256-a",
        userId: "user-a",
      })
      .mockRejectedValueOnce(new Error("Could not find SKILL.md or README.md in folder"));

    await expect(
      bulkImportSkillsFromGitHubFolder({
        pool: {} as never,
        metadata: {} as never,
        storage: {} as never,
        sourceUrl: "https://github.com/anthropics/skills/tree/main/skills",
      }),
    ).resolves.toMatchObject({
      summary: { published: 1, skipped: 0, failed: 1 },
      aborted: {
        subfolder: "beta-skill",
        error: "Could not find SKILL.md or README.md in folder",
      },
      results: [{ subfolder: "alpha-skill", action: "published" }],
    });
  });
});
