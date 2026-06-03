import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
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
    });
    expect(skill).toContain("Existing skill");
    expect(notes).toContain("Notes");
    expect(result.stdout).toContain("Copied");
    expect(result.stdout).toContain("Next: Run cd existing-helper");
  });
});
