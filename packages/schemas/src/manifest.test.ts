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

  it("parses optional usage guidance", () => {
    const manifest = PackageManifestSchema.parse({
      schemaVersion: "0.1",
      name: "@team/sample",
      version: "1.0.0",
      type: "skill",
      description: "test",
      entry: "SKILL.md",
      targets: ["cursor"],
      usage: "Ask the assistant to review your diff before opening a PR.",
    });
    expect(manifest.usage).toBe("Ask the assistant to review your diff before opening a PR.");
  });

  it("parses optional agent description copied from skill.md", () => {
    const manifest = PackageManifestSchema.parse({
      schemaVersion: "0.1",
      name: "@team/sample",
      version: "1.0.0",
      type: "skill",
      description: "Review code changes before opening a pull request.",
      entry: "SKILL.md",
      targets: ["cursor"],
      agentDescription: "# Review helper\n\nReview diffs for regressions and missing tests.",
    });
    expect(manifest.agentDescription).toContain("Review diffs");
  });

  it("parses optional quality metadata for public package pages", () => {
    const manifest = PackageManifestSchema.parse({
      schemaVersion: "0.1",
      name: "@team/sample",
      version: "1.0.0",
      type: "skill",
      description: "Review code changes before opening a pull request.",
      entry: "SKILL.md",
      targets: ["cursor", "claude"],
      usage: "Ask the assistant to review the current diff and return findings first.",
      tags: ["code-review", "pull-requests"],
      categories: ["Engineering", "Quality"],
      sourceUrl: "https://github.com/team/sample-skill",
      examples: [
        {
          title: "Review staged changes",
          description: "Use before opening a pull request.",
          prompt: "Review my staged changes for regressions and missing tests.",
        },
      ],
      releaseNotes: "Initial release with code review guidance.",
    });

    expect(manifest.tags).toEqual(["code-review", "pull-requests"]);
    expect(manifest.categories).toEqual(["Engineering", "Quality"]);
    expect(manifest.examples?.[0]?.prompt).toContain("staged changes");
    expect(manifest.releaseNotes).toBe("Initial release with code review guidance.");
  });
});
