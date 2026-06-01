import { mkdtemp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { detectToolsInProject, resolveInstallTools } from "./detect-tools.js";
import type { PackageManifest } from "@aipm-registry/schemas";

const baseManifest: PackageManifest = {
  schemaVersion: "0.1",
  name: "@team/sample",
  version: "1.0.0",
  type: "skill",
  description: "test",
  entry: "skill.md",
  targets: ["cursor", "claude"],
};

describe("detectToolsInProject", () => {
  it("detects cursor folder", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-"));
    await mkdir(join(root, ".cursor"));
    expect(await detectToolsInProject(root)).toEqual(["cursor"]);
  });

  it("detects both", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-"));
    await mkdir(join(root, ".cursor"));
    await mkdir(join(root, ".claude"));
    expect(await detectToolsInProject(root)).toEqual(["cursor", "claude"]);
  });
});

describe("resolveInstallTools", () => {
  it("uses explicit target", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-"));
    const tools = await resolveInstallTools({
      projectRoot: root,
      manifest: baseManifest,
      explicitTarget: "claude",
    });
    expect(tools).toEqual(["claude"]);
  });
});
