import { afterEach, describe, expect, it, vi } from "vitest";
import * as githubImport from "./import-from-github.js";
import {
  buildGitHubTreeUrl,
  buildPackageName,
  computeContentHash,
  nextPatchVersion,
  parseGitHubFolderUrl,
  resolveAgentDescription,
  resolveImportVersion,
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

    expect(
      parseGitHubFolderUrl(
        "https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md",
      ),
    ).toEqual({
      owner: "anthropics",
      repo: "skills",
      branch: "main",
      path: "skills/frontend-design",
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

  it("extracts the skill body as agent description", () => {
    expect(
      resolveAgentDescription(
        "---\ndescription: Grill me\n---\n# Grill me\n\nStress-test your idea before you build it.\n\nAsk follow-up questions.",
      ),
    ).toBe(
      "# Grill me\n\nStress-test your idea before you build it.\n\nAsk follow-up questions.",
    );

    expect(resolveAgentDescription("---\ndescription: Empty\n---\n")).toBeUndefined();
  });

  it("builds child github tree urls", () => {
    expect(
      buildGitHubTreeUrl(
        {
          owner: "anthropics",
          repo: "skills",
          branch: "main",
          path: "skills",
        },
        "frontend-design",
      ),
    ).toBe("https://github.com/anthropics/skills/tree/main/skills/frontend-design");
  });
});

describe("listGitHubSubfolders", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns sorted immediate subfolder names", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { name: "beta-skill", path: "skills/beta-skill", type: "dir" },
          { name: "alpha-skill", path: "skills/alpha-skill", type: "dir" },
          { name: "README.md", path: "skills/README.md", type: "file" },
        ]),
        { status: 200 },
      ),
    );

    await expect(
      githubImport.listGitHubSubfolders({
        owner: "anthropics",
        repo: "skills",
        branch: "main",
        path: "skills",
      }),
    ).resolves.toEqual(["alpha-skill", "beta-skill"]);
  });

  it("rejects file urls", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ name: "SKILL.md", path: "skills/foo/SKILL.md", type: "file" }), {
        status: 200,
      }),
    );

    await expect(
      githubImport.listGitHubSubfolders({
        owner: "anthropics",
        repo: "skills",
        branch: "main",
        path: "skills/foo",
      }),
    ).rejects.toThrow("URL points to a file, not a folder");
  });

  it("rejects folders with no subdirectories", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ name: "SKILL.md", path: "skills/foo/SKILL.md", type: "file" }]), {
        status: 200,
      }),
    );

    await expect(
      githubImport.listGitHubSubfolders({
        owner: "anthropics",
        repo: "skills",
        branch: "main",
        path: "skills/foo",
      }),
    ).rejects.toThrow("No subfolders found");
  });
});
