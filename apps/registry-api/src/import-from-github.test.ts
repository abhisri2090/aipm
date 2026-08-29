import { afterEach, describe, expect, it, vi } from "vitest";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import * as githubImport from "./import-from-github.js";
import {
  buildGitHubTreeUrl,
  buildPackageName,
  computeContentHash,
  decideGitHubImportMode,
  extractFilesFromGitHubTarball,
  folderBlobRelativePath,
  nextPatchVersion,
  parseGitHubFolderUrl,
  resolveAgentDescription,
  resolveGitHubSkillImport,
  resolveImportVersion,
  toGitHubTreeUrl,
  truncateDescription,
  writeImportedFilesToDirectory,
} from "./import-from-github.js";

const execFileAsync = promisify(execFile);

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

    expect(parseGitHubFolderUrl("https://github.com/obra/superpowers")).toEqual({
      owner: "obra",
      repo: "superpowers",
      branch: "",
      path: "",
    });
    expect(parseGitHubFolderUrl("https://github.com/obra/superpowers.git")).toEqual({
      owner: "obra",
      repo: "superpowers",
      branch: "",
      path: "",
    });
    expect(parseGitHubFolderUrl("https://github.com/obra/superpowers/")).toEqual({
      owner: "obra",
      repo: "superpowers",
      branch: "",
      path: "",
    });
    expect(parseGitHubFolderUrl("https://github.com/obra/superpowers?tab=readme-ov-file")).toEqual({
      owner: "obra",
      repo: "superpowers",
      branch: "",
      path: "",
    });
    expect(parseGitHubFolderUrl("https://github.com/obra/superpowers/tree/main")).toEqual({
      owner: "obra",
      repo: "superpowers",
      branch: "main",
      path: "",
    });
  });

  it("builds tree urls and package names for repo-root imports", () => {
    expect(
      toGitHubTreeUrl({ owner: "obra", repo: "superpowers", branch: "main", path: "" }),
    ).toBe("https://github.com/obra/superpowers/tree/main");
    expect(
      toGitHubTreeUrl({
        owner: "obra",
        repo: "superpowers",
        branch: "main",
        path: "skills",
      }),
    ).toBe("https://github.com/obra/superpowers/tree/main/skills");
    expect(buildPackageName("obra", "superpowers")).toBe("@obra/superpowers");
  });

  it("treats a skills/ folder without SKILL.md as a collection", () => {
    expect(
      decideGitHubImportMode([
        { name: "README.md", type: "file" },
        { name: "skills", type: "dir" },
        { name: "docs", type: "dir" },
      ]),
    ).toBe("peek-skills");
    expect(
      decideGitHubImportMode([
        { name: "brainstorming", type: "dir" },
        { name: "systematic-debugging", type: "dir" },
      ]),
    ).toBe("collection");
    expect(
      decideGitHubImportMode([
        { name: "SKILL.md", type: "file" },
        { name: "scripts", type: "dir" },
      ]),
    ).toBe("skill");
    expect(decideGitHubImportMode([{ name: "README.md", type: "file" }])).toBe("skill");
  });

  it("maps git tree blobs onto the imported folder", () => {
    expect(folderBlobRelativePath("skills/brainstorming/SKILL.md", "skills/brainstorming")).toBe(
      "SKILL.md",
    );
    expect(folderBlobRelativePath("README.md", "")).toBe("README.md");
    expect(folderBlobRelativePath("docs/guide.md", "skills")).toBeNull();
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
        "SKILL.md": Buffer.from("# Skill", "utf8"),
        "templates/generator_template.js": Buffer.from("export default {};", "utf8"),
      });
      await expect(access(join(tempDir, "templates/generator_template.js"))).resolves.toBeUndefined();
      await expect(readFile(join(tempDir, "templates/generator_template.js"), "utf8")).resolves.toBe(
        "export default {};",
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("extracts a skill folder from a GitHub-style tarball and keeps binary bytes", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-gh-tar-"));
    try {
      const repoRoot = join(root, "anthropics-skills-abc123");
      const skillDir = join(repoRoot, "skills/canvas-design/canvas-fonts");
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(repoRoot, "skills/canvas-design/SKILL.md"), "# Canvas\n", "utf8");
      const fontBytes = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);
      await writeFile(join(skillDir, "Demo.ttf"), fontBytes);
      const tgzPath = join(root, "repo.tgz");
      await execFileAsync("tar", ["-czf", tgzPath, "-C", root, "anthropics-skills-abc123"]);
      const tarball = await readFile(tgzPath);

      const files = await extractFilesFromGitHubTarball(tarball, "skills/canvas-design");
      expect(Object.keys(files).sort()).toEqual(["SKILL.md", "canvas-fonts/Demo.ttf"]);
      expect(files["SKILL.md"]!.toString("utf8")).toBe("# Canvas\n");
      expect(files["canvas-fonts/Demo.ttf"]).toEqual(fontBytes);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("fetchGitHubFolder", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads one repo tarball instead of one request per blob", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-gh-fetch-"));
    try {
      const repoRoot = join(root, "anthropics-skills-deadbeef");
      await mkdir(join(repoRoot, "skills/canvas-design"), { recursive: true });
      await writeFile(
        join(repoRoot, "skills/canvas-design/SKILL.md"),
        "---\ndescription: Art\n---\n# Art\n",
        "utf8",
      );
      const tgzPath = join(root, "repo.tgz");
      await execFileAsync("tar", ["-czf", tgzPath, "-C", root, "anthropics-skills-deadbeef"]);
      const tarball = await readFile(tgzPath);

      const urls: string[] = [];
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);
        urls.push(url);
        if (url.includes("/git/ref/heads/main")) {
          return new Response(
            JSON.stringify({ object: { sha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef" } }),
            { status: 200 },
          );
        }
        if (url.includes("codeload.github.com") && url.includes("/tar.gz/")) {
          return new Response(tarball, { status: 200 });
        }
        return new Response("unexpected", { status: 500 });
      });

      const result = await githubImport.fetchGitHubFolder({
        owner: "anthropics",
        repo: "skills",
        branch: "main",
        path: "skills/canvas-design",
      });

      expect(result.commitSha).toBe("deadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
      expect(result.files["SKILL.md"]!.toString("utf8")).toContain("# Art");
      expect(urls.filter((url) => url.includes("/git/blobs/"))).toEqual([]);
      expect(urls.some((url) => url.includes("codeload.github.com"))).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
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

describe("resolveGitHubSkillImport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves a repo-root skill collection to the skills folder", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/repos/obra/superpowers")) {
        return new Response(JSON.stringify({ default_branch: "main" }), { status: 200 });
      }
      if (url.includes("/repos/obra/superpowers/contents?") || url.endsWith("/contents")) {
        return new Response(
          JSON.stringify([
            { name: "README.md", path: "README.md", type: "file" },
            { name: "skills", path: "skills", type: "dir" },
          ]),
          { status: 200 },
        );
      }
      if (url.includes("/repos/obra/superpowers/contents/skills")) {
        return new Response(
          JSON.stringify([
            { name: "brainstorming", path: "skills/brainstorming", type: "dir" },
            { name: "systematic-debugging", path: "skills/systematic-debugging", type: "dir" },
          ]),
          { status: 200 },
        );
      }
      return new Response("not found", { status: 404 });
    });

    await expect(resolveGitHubSkillImport("https://github.com/obra/superpowers")).resolves.toEqual({
      mode: "collection",
      sourceUrl: "https://github.com/obra/superpowers/tree/main/skills",
      ref: {
        owner: "obra",
        repo: "superpowers",
        branch: "main",
        path: "skills",
      },
    });
  });

  it("throws a collection error instead of packing a skills/ repo as one skill", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/repos/obra/superpowers")) {
        return new Response(JSON.stringify({ default_branch: "main" }), { status: 200 });
      }
      if (url.includes("/repos/obra/superpowers/contents?") || url.endsWith("/contents")) {
        return new Response(
          JSON.stringify([
            { name: "README.md", path: "README.md", type: "file" },
            { name: "skills", path: "skills", type: "dir" },
          ]),
          { status: 200 },
        );
      }
      if (url.includes("/repos/obra/superpowers/contents/skills")) {
        return new Response(
          JSON.stringify([
            { name: "brainstorming", path: "skills/brainstorming", type: "dir" },
            { name: "systematic-debugging", path: "skills/systematic-debugging", type: "dir" },
          ]),
          { status: 200 },
        );
      }
      return new Response("not found", { status: 404 });
    });

    await expect(
      githubImport.importSkillFromGitHubUrl({
        pool: {} as never,
        metadata: {} as never,
        storage: {} as never,
        sourceUrl: "https://github.com/obra/superpowers",
      }),
    ).rejects.toMatchObject({
      name: "GitHubSkillCollectionError",
      sourceUrl: "https://github.com/obra/superpowers/tree/main/skills",
      owner: "obra",
    });
  });

  it("resolves a repo-root SKILL.md as a single skill", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/repos/owner/one-skill")) {
        return new Response(JSON.stringify({ default_branch: "main" }), { status: 200 });
      }
      if (url.includes("/repos/owner/one-skill/contents")) {
        return new Response(
          JSON.stringify([{ name: "SKILL.md", path: "SKILL.md", type: "file" }]),
          { status: 200 },
        );
      }
      return new Response("not found", { status: 404 });
    });

    await expect(resolveGitHubSkillImport("https://github.com/owner/one-skill")).resolves.toEqual({
      mode: "skill",
      sourceUrl: "https://github.com/owner/one-skill/tree/main",
      ref: {
        owner: "owner",
        repo: "one-skill",
        branch: "main",
        path: "",
      },
    });
  });
});
