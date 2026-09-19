import { beforeEach, describe, expect, it, vi } from "vitest";

const listGitHubSubfolders = vi.fn();
const importSkillFromGitHubUrl = vi.fn();
const githubRequest = vi.fn();
const setPackageGithubStars = vi.fn();

vi.mock("./db.js", () => ({
  setPackageGithubStars: (...args: unknown[]) => setPackageGithubStars(...args),
}));

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
  githubRequest: (...args: unknown[]) => githubRequest(...args),
}));

import { bulkImportSkillsFromGitHubFolder } from "./bulk-import-from-github.js";

describe("bulkImportSkillsFromGitHubFolder", () => {
  beforeEach(() => {
    listGitHubSubfolders.mockReset();
    importSkillFromGitHubUrl.mockReset();
    githubRequest.mockReset();
    setPackageGithubStars.mockReset();
    githubRequest.mockResolvedValue({ stargazers_count: 42 });
    setPackageGithubStars.mockResolvedValue(true);
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
        orgName: "my-org",
      }),
    ).resolves.toMatchObject({
      parentUrl: "https://github.com/anthropics/skills/tree/main/skills",
      orgName: "my-org",
      subfolders: ["alpha-skill", "beta-skill"],
      summary: { published: 1, skipped: 1, failed: 0 },
    });

    expect(githubRequest).toHaveBeenCalledTimes(1);
    expect(githubRequest).toHaveBeenCalledWith("/repos/anthropics/skills", undefined);
    expect(setPackageGithubStars).toHaveBeenCalledWith({}, "@anthropics/alpha-skill", 42);
    expect(importSkillFromGitHubUrl).toHaveBeenCalledWith(
      expect.objectContaining({ orgName: "my-org" }),
    );
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
        orgName: "my-org",
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
