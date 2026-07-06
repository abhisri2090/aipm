import { afterEach, describe, expect, it, vi } from "vitest";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as githubImport from "./import-from-github.js";
import {
  buildGitHubTreeUrl,
  buildPackageName,
  computeContentHash,
  nextPatchVersion,
  parseGitHubFolderUrl,
  resolveAgentDescription,
  resolveImportVersion,
  truncateDescription,
  writeImportedFilesToDirectory,
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
    expect(buildPackageName("my-org", "frontend-design")).toBe("@my-org/frontend-design");
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

  it("truncates descriptions to the manifest limit", () => {
    const long = "a".repeat(300);
    expect(truncateDescription(long).length).toBe(240);
    expect(truncateDescription(long).endsWith("...")).toBe(true);
    expect(truncateDescription("short")).toBe("short");
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

  it("hashes folder contents deterministically", () => {
    const hashA = computeContentHash({ "SKILL.md": "hello", LICENSE: "Apache" });
    const hashB = computeContentHash({ LICENSE: "Apache", "SKILL.md": "hello" });
    expect(hashA).toBe(hashB);
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

  it("writes nested skill files to a temp directory", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "aipm-import-test-"));
    try {
      await writeImportedFilesToDirectory(tempDir, {
        "SKILL.md": "# Skill",
        "templates/generator_template.js": "export default {};",
      });
      await expect(access(join(tempDir, "templates/generator_template.js"))).resolves.toBeUndefined();
      await expect(readFile(join(tempDir, "templates/generator_template.js"), "utf8")).resolves.toBe(
        "export default {};",
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
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
