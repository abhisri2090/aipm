import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { removeInstalledPackageFiles } from "./remove-package.js";

const entry = (installed: string[], main: string[] = [], helper: string[] = []) => ({
  version: "1.0.0",
  integrity: "sha256-test",
  registry: "https://api.aipm-registry.com",
  resolvedTools: ["claude" as const],
  installed: { claude: installed },
  installedAssets: { main, helper },
});

describe("removeInstalledPackageFiles", () => {
  it("deletes tracked adapter and package files and prunes their empty directories", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-remove-"));
    const skill = join(root, ".claude", "skills", "review", "SKILL.md");
    const asset = join(root, "review-server", "server.js");
    await mkdir(join(root, ".claude", "skills", "review"), { recursive: true });
    await mkdir(join(root, "review-server"), { recursive: true });
    await writeFile(skill, "# Review\n");
    await writeFile(asset, "export {};\n");

    await expect(
      removeInstalledPackageFiles({ configRoot: root, installRoot: root, entry: entry([skill], [asset]) }),
    ).resolves.toBe(2);
    await expect(stat(skill)).rejects.toThrow();
    await expect(stat(asset)).rejects.toThrow();
    await expect(stat(join(root, ".claude", "skills", "review"))).rejects.toThrow();
  });

  it("rejects an untrusted lockfile path before deleting any file", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-remove-"));
    const safe = join(root, "safe.md");
    const outsideRoot = await mkdtemp(join(tmpdir(), "aipm-outside-"));
    const outside = join(outsideRoot, "keep.md");
    await writeFile(safe, "safe\n");
    await writeFile(outside, "keep\n");

    await expect(
      removeInstalledPackageFiles({ configRoot: root, installRoot: root, entry: entry([safe, outside]) }),
    ).rejects.toThrow("untrusted path");
    await expect(readFile(safe, "utf8")).resolves.toBe("safe\n");
    await expect(readFile(outside, "utf8")).resolves.toBe("keep\n");
  });
});
