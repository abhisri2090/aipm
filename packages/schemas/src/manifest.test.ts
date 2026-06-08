import { describe, expect, it } from "vitest";
import { AiToolSchema, ALL_TOOLS, expandTargets, PackageManifestSchema } from "./manifest.js";

describe("AiToolSchema", () => {
  it("accepts wildcard target", () => {
    expect(AiToolSchema.parse("*")).toBe("*");
  });
});

describe("expandTargets", () => {
  it("expands wildcard to all concrete tools", () => {
    expect(expandTargets(["*"])).toEqual([...ALL_TOOLS]);
  });

  it("passes through concrete targets", () => {
    expect(expandTargets(["cursor"])).toEqual(["cursor"]);
  });
});

describe("PackageManifestSchema", () => {
  it("parses manifest with wildcard targets", () => {
    const manifest = PackageManifestSchema.parse({
      schemaVersion: "0.1",
      name: "@team/sample",
      version: "1.0.0",
      type: "skill",
      description: "test",
      entry: "SKILL.md",
      targets: ["*"],
    });
    expect(manifest.targets).toEqual(["*"]);
  });
});
