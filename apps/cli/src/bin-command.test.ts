import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliPath = resolve(dirname(fileURLToPath(import.meta.url)), "../dist/bin.cjs");

async function tempWorkspace(): Promise<string> {
  return mkdtemp(join(tmpdir(), "aipm-cli-command-"));
}

async function runCli(cwd: string, args: string[]): Promise<{ stderr: string; stdout: string }> {
  return execFileAsync(process.execPath, [cliPath, ...args], { cwd });
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

describe("CLI publish commands", () => {
  it("initializes a project non-interactively with an explicit target", async () => {
    const root = await tempWorkspace();

    const result = await runCli(root, [
      "init",
      "--registry",
      "https://api.example.test",
      "--target",
      "cursor",
    ]);

    const config = await readJson(join(root, "aipm.package.json"));
    expect(config).toMatchObject({
      schemaVersion: "0.1",
      registry: "https://api.example.test",
      preferredTools: ["cursor"],
      packages: {},
    });
    expect(result.stdout).toContain("Created aipm.package.json");
  });

  it("rejects invalid init targets", async () => {
    const root = await tempWorkspace();

    await expect(runCli(root, ["init", "--target", "vscode"])).rejects.toMatchObject({
      stderr: expect.stringContaining('--target must be "cursor", "claude", or "*"'),
    });
  });

  it("prints website package links after direct publish", async () => {
    const root = await tempWorkspace();
    const skillRoot = join(root, "url-check");
    await mkdir(skillRoot);
    await writeFile(join(skillRoot, "SKILL.md"), "# URL check\n");
    await writeFile(
      join(skillRoot, "aipm.manifest.json"),
      JSON.stringify({
        schemaVersion: "0.1",
        name: "@team/url-check",
        version: "2.0.0",
        type: "skill",
        description: "URL check skill",
        entry: "SKILL.md",
        targets: ["cursor"],
      }),
    );

    const server = createServer((request, response) => {
      expect(request.url).toBe(`/v1/packages/${encodeURIComponent("@team/url-check")}/versions`);
      response.writeHead(201, { "content-type": "application/json" });
      response.end(JSON.stringify({ name: "@team/url-check", version: "2.0.0", integrity: "sha256-test" }));
    });

    await new Promise<void>((resolveServer) => server.listen(0, "127.0.0.1", resolveServer));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected test server port");

    try {
      const result = await runCli(root, [
        "publish",
        skillRoot,
        "--registry",
        `http://127.0.0.1:${address.port}`,
        "--token",
        "test-token",
      ]);

      expect(result.stdout).toContain("View: https://aipm-registry.com/packages/team/url-check/2.0.0");
      expect(result.stdout).toContain("Install: aipm add @team/url-check@2.0.0 --target cursor --ci");
    } finally {
      await new Promise<void>((resolveClose, rejectClose) =>
        server.close((error) => (error ? rejectClose(error) : resolveClose())),
      );
    }
  });

  it("creates a skill-named package folder by default", async () => {
    const root = await tempWorkspace();

    const result = await runCli(root, [
      "publish",
      "init",
      "--name",
      "@team/review-helper",
      "--version",
      "1.2.3",
      "--description",
      "Review helper skill",
      "--targets",
      "cursor,claude",
    ]);

    const skillRoot = join(root, "review-helper");
    const manifest = await readJson(join(skillRoot, "aipm.manifest.json"));
    await expect(stat(join(skillRoot, "SKILL.md"))).resolves.toMatchObject({ size: expect.any(Number) });
    await expect(stat(join(skillRoot, ".aipmignore"))).resolves.toMatchObject({ size: expect.any(Number) });
    await expect(stat(join(skillRoot, ".aipm"))).resolves.toMatchObject({ size: expect.any(Number) });

    expect(manifest).toMatchObject({
      name: "@team/review-helper",
      version: "1.2.3",
      description: "Review helper skill",
      entry: "SKILL.md",
      targets: ["cursor", "claude"],
      usage: expect.stringContaining("Review helper skill"),
      tags: ["ai-skill"],
      categories: ["AI workflow"],
      examples: [expect.objectContaining({ title: "Use this skill in a project" })],
      releaseNotes: "Initial release.",
    });
    expect(result.stdout).toContain("Created @team/review-helper skill folder:");
    expect(result.stdout).toContain("Next: Run cd review-helper");
    await expect(stat(join(root, "aipm.manifest.json"))).rejects.toThrow();
  });

  it("creates starter skill content from a template", async () => {
    const root = await tempWorkspace();

    await runCli(root, [
      "publish",
      "init",
      "--name",
      "@team/pr-reviewer",
      "--template",
      "code-review",
    ]);

    const skill = await readFile(join(root, "pr-reviewer", "SKILL.md"), "utf8");
    expect(skill).toContain("Use this skill to review code changes");
    expect(skill).toContain("Return findings first, ordered by severity");
  });

  it("rejects unknown starter templates", async () => {
    const root = await tempWorkspace();

    await expect(
      runCli(root, [
        "publish",
        "init",
        "--name",
        "@team/bad-template",
        "--template",
        "unknown",
      ]),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("Unknown template"),
    });
  });

  it("imports an existing AI-tool skill into a package folder", async () => {
    const root = await tempWorkspace();
    const source = join(root, "source-skill");
    await mkdir(source);
    await writeFile(join(source, "SKILL.md"), "# Existing skill\n\nUse this project context.\n");
    await writeFile(join(source, "notes.md"), "# Notes\n");

    const result = await runCli(root, [
      "publish",
      "import",
      source,
      "--name",
      "@team/existing-helper",
      "--description",
      "Imported helper skill",
    ]);

    const skillRoot = join(root, "existing-helper");
    const manifest = await readJson(join(skillRoot, "aipm.manifest.json"));
    const skill = await readFile(join(skillRoot, "SKILL.md"), "utf8");
    const notes = await readFile(join(skillRoot, "notes.md"), "utf8");

    expect(manifest).toMatchObject({
      name: "@team/existing-helper",
      description: "Imported helper skill",
      entry: "SKILL.md",
      targets: ["cursor"],
      usage: expect.stringContaining("Imported helper skill"),
      tags: ["ai-skill"],
      categories: ["AI workflow"],
    });
    expect(skill).toContain("Existing skill");
    expect(notes).toContain("Notes");
    expect(result.stdout).toContain("Copied");
    expect(result.stdout).toContain("Next: Run cd existing-helper");
  });
});
