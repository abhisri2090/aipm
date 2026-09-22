import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  discoverUntrackedPackagePaths,
  removeUntrackedPackage,
  resolveNoInitMode,
} from "./no-init.js";

vi.mock("./prompt.js", () => ({
  promptForNoInitConflict: vi.fn(async () => "no-init"),
}));

import { promptForNoInitConflict } from "./prompt.js";

async function tempRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "aipm-no-init-"));
}

describe("resolveNoInitMode", () => {
  it("returns false when --no-init was not requested", async () => {
    await expect(
      resolveNoInitMode({ requested: false, projectExists: true, ci: true }),
    ).resolves.toBe(false);
  });

  it("returns true when --no-init and no project config", async () => {
    await expect(
      resolveNoInitMode({ requested: true, projectExists: false }),
    ).resolves.toBe(true);
  });

  it("fails fast in CI when project already exists", async () => {
    await expect(
      resolveNoInitMode({ requested: true, projectExists: true, ci: true }),
    ).rejects.toThrow(/already initialized/);
  });

  it("prompts interactively when project exists outside CI", async () => {
    vi.mocked(promptForNoInitConflict).mockResolvedValueOnce("tracked");
    await expect(
      resolveNoInitMode({ requested: true, projectExists: true }),
    ).resolves.toBe(false);

    vi.mocked(promptForNoInitConflict).mockResolvedValueOnce("no-init");
    await expect(
      resolveNoInitMode({ requested: true, projectExists: true }),
    ).resolves.toBe(true);
  });
});

describe("discover and remove untracked packages", () => {
  it("discovers known adapter and helper paths", async () => {
    const root = await tempRoot();
    const paths = discoverUntrackedPackagePaths({
      installRoot: root,
      configRoot: root,
      packageName: "@team/sample-skill",
    });
    expect(paths).toEqual([
      join(root, ".cursor", "aipm", "skills", "sample-skill.md"),
      join(root, ".claude", "skills", "sample-skill"),
      join(root, ".agents", "skills", "sample-skill"),
      join(root, ".aipm", "helpers", "team__sample-skill"),
    ]);
  });

  it("removes discovered paths and errors when nothing exists", async () => {
    const root = await tempRoot();
    await expect(
      removeUntrackedPackage({
        installRoot: root,
        configRoot: root,
        packageName: "@team/sample-skill",
      }),
    ).rejects.toThrow(/No untracked install found/);

    const skillFile = join(root, ".cursor", "aipm", "skills", "sample-skill.md");
    const helperDir = join(root, ".aipm", "helpers", "team__sample-skill", "1.0.0");
    await mkdir(join(root, ".cursor", "aipm", "skills"), { recursive: true });
    await mkdir(helperDir, { recursive: true });
    await writeFile(skillFile, "# skill\n");
    await writeFile(join(helperDir, "SETUP.md"), "setup\n");

    const result = await removeUntrackedPackage({
      installRoot: root,
      configRoot: root,
      packageName: "@team/sample-skill",
    });
    expect(result.removed).toHaveLength(2);
    await expect(
      removeUntrackedPackage({
        installRoot: root,
        configRoot: root,
        packageName: "@team/sample-skill",
      }),
    ).rejects.toThrow(/No untracked install found/);
  });
});
