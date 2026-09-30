import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { PackageManifest } from "@aipm-registry/schemas";

vi.mock("./prompt.js", () => ({
  promptForInstallLayout: vi.fn(async () => ({ mode: "shared" as const })),
}));

import { promptForInstallLayout } from "./prompt.js";
import { resolveInstallLayout } from "./install-layout.js";

const manifest: PackageManifest = {
  schemaVersion: "0.1",
  name: "@team/review-helper",
  version: "1.0.0",
  type: "skill",
  description: "test",
  entry: "SKILL.md",
  targets: ["cursor", "claude", "codex"],
};

async function projectWith(...folders: string[]) {
  const root = await mkdtemp(join(tmpdir(), "aipm-layout-"));
  for (const folder of folders) await mkdir(join(root, folder));
  return root;
}

describe("resolveInstallLayout", () => {
  it("fails in CI when several tool folders exist and no flag was passed", async () => {
    const root = await projectWith(".cursor", ".claude");
    await expect(resolveInstallLayout({
      projectRoot: root,
      manifest,
      ci: true,
    })).rejects.toThrow(/Pass --target cursor\|claude\|codex or --shared/);
  });

  it("uses --shared for every detected tool the package allows", async () => {
    const root = await projectWith(".cursor", ".codex");
    await expect(resolveInstallLayout({
      projectRoot: root,
      manifest,
      shared: true,
    })).resolves.toEqual({ mode: "shared", tools: ["cursor", "codex"] });
  });

  it("rejects --shared together with --target", async () => {
    const root = await projectWith(".cursor", ".claude");
    await expect(resolveInstallLayout({
      projectRoot: root,
      manifest,
      shared: true,
      explicitTarget: "cursor",
    })).rejects.toThrow(/--shared cannot be combined with --target/);
  });

  it("does not ask when only one tool folder exists", async () => {
    const root = await projectWith(".cursor");
    await expect(resolveInstallLayout({
      projectRoot: root,
      manifest,
    })).resolves.toEqual({ mode: "default" });
  });

  it("uses the menu choice when several tool folders exist", async () => {
    const root = await projectWith(".cursor", ".claude");
    await expect(resolveInstallLayout({ projectRoot: root, manifest })).resolves.toEqual({
      mode: "shared",
      tools: ["cursor", "claude"],
    });

    vi.mocked(promptForInstallLayout).mockResolvedValueOnce({ mode: "copy", tool: "cursor" });
    const again = await projectWith(".cursor", ".claude");
    await expect(resolveInstallLayout({ projectRoot: again, manifest })).resolves.toEqual({
      mode: "copy",
      tool: "cursor",
    });
  });
});
