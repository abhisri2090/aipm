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

const wildcardManifest: PackageManifest = {
  ...baseManifest,
  targets: ["*"],
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

  it("detects codex folder", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-"));
    await mkdir(join(root, ".codex"));
    expect(await detectToolsInProject(root)).toEqual(["codex"]);
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

  it("uses explicit codex target", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-"));
    const tools = await resolveInstallTools({
      projectRoot: root,
      manifest: { ...baseManifest, targets: ["codex"] },
      explicitTarget: "codex",
    });
    expect(tools).toEqual(["codex"]);
  });

  it("expands explicit wildcard to all tools", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-"));
    const tools = await resolveInstallTools({
      projectRoot: root,
      manifest: wildcardManifest,
      explicitTarget: "*",
    });
    expect(tools).toEqual(["cursor", "claude", "codex"]);
  });

  it("matches detected tools against wildcard manifest", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-"));
    await mkdir(join(root, ".cursor"));
    const tools = await resolveInstallTools({
      projectRoot: root,
      manifest: wildcardManifest,
    });
    expect(tools).toEqual(["cursor"]);
  });

  it("falls back to all tools when wildcard manifest has no detected tools", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-"));
    const tools = await resolveInstallTools({
      projectRoot: root,
      manifest: wildcardManifest,
    });
    expect(tools).toEqual(["cursor", "claude", "codex"]);
  });
});
