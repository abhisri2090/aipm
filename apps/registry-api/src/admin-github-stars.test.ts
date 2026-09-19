import { beforeEach, describe, expect, it, vi } from "vitest";

const listPackagesForGithubStarsSync = vi.fn();
const setPackageGithubStarsForNames = vi.fn();
const githubRequest = vi.fn();
const parseGitHubFolderUrl = vi.fn();

vi.mock("./db.js", () => ({
  listPackagesForGithubStarsSync: (...args: unknown[]) => listPackagesForGithubStarsSync(...args),
  setPackageGithubStarsForNames: (...args: unknown[]) => setPackageGithubStarsForNames(...args),
}));

vi.mock("./import-from-github.js", () => ({
  githubRequest: (...args: unknown[]) => githubRequest(...args),
  parseGitHubFolderUrl: (...args: unknown[]) => parseGitHubFolderUrl(...args),
}));

import { syncGithubStarsForPackages } from "./admin-github-stars.js";

describe("syncGithubStarsForPackages", () => {
  beforeEach(() => {
    listPackagesForGithubStarsSync.mockReset();
    setPackageGithubStarsForNames.mockReset();
    githubRequest.mockReset();
    parseGitHubFolderUrl.mockReset();
  });

  it("dedupes by repo and updates all packages from that repo", async () => {
    listPackagesForGithubStarsSync.mockResolvedValue([
      { name: "@org/a", source_url: "https://github.com/acme/skills/tree/main/a" },
      { name: "@org/b", source_url: "https://github.com/acme/skills/tree/main/b" },
      { name: "@org/c", source_url: "https://github.com/other/solo" },
    ]);
    parseGitHubFolderUrl.mockImplementation((url: string) => {
      if (url.includes("acme/skills")) {
        return { owner: "acme", repo: "skills", branch: "main", path: "x" };
      }
      return { owner: "other", repo: "solo", branch: "main", path: "" };
    });
    githubRequest
      .mockResolvedValueOnce({ stargazers_count: 100 })
      .mockResolvedValueOnce({ stargazers_count: 5 });
    setPackageGithubStarsForNames.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    await expect(
      syncGithubStarsForPackages({ pool: {} as never, mode: "fill-missing" }),
    ).resolves.toEqual({
      updated: 3,
      reposFetched: 2,
      errors: [],
    });

    expect(githubRequest).toHaveBeenCalledTimes(2);
    expect(setPackageGithubStarsForNames).toHaveBeenCalledWith({}, ["@org/a", "@org/b"], 100);
    expect(setPackageGithubStarsForNames).toHaveBeenCalledWith({}, ["@org/c"], 5);
  });

  it("stops further fetches on rate limit and returns partial results", async () => {
    listPackagesForGithubStarsSync.mockResolvedValue([
      { name: "@org/a", source_url: "https://github.com/acme/one" },
      { name: "@org/b", source_url: "https://github.com/acme/two" },
    ]);
    parseGitHubFolderUrl
      .mockReturnValueOnce({ owner: "acme", repo: "one", branch: "main", path: "" })
      .mockReturnValueOnce({ owner: "acme", repo: "two", branch: "main", path: "" });
    githubRequest
      .mockResolvedValueOnce({ stargazers_count: 10 })
      .mockRejectedValueOnce(new Error("GitHub API /repos/acme/two failed: 429"));
    setPackageGithubStarsForNames.mockResolvedValueOnce(1);

    await expect(
      syncGithubStarsForPackages({ pool: {} as never, mode: "refresh-all" }),
    ).resolves.toEqual({
      updated: 1,
      reposFetched: 1,
      errors: [{ repo: "acme/two", message: "GitHub API /repos/acme/two failed: 429" }],
    });

    expect(githubRequest).toHaveBeenCalledTimes(2);
  });
});
