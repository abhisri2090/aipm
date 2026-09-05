import { describe, expect, it } from "vitest";
import { LockfileSchema } from "./lockfile.js";
import { ProjectPackageJsonSchema } from "./package-json.js";

describe("project prompt tracking schemas", () => {
  it("keeps older project and lock files backward compatible", () => {
    expect(
      ProjectPackageJsonSchema.parse({
        schemaVersion: "0.1",
        registry: "https://api.aipm-registry.com",
        packages: {},
      }).prompts,
    ).toEqual({});
    expect(LockfileSchema.parse({ schemaVersion: "0.1", packages: {} }).prompts).toEqual({});
  });

  it("accepts prompt URLs and lock metadata", () => {
    const project = ProjectPackageJsonSchema.parse({
      schemaVersion: "0.1",
      registry: "https://api.aipm-registry.com",
      packages: {},
      prompts: {
        summary: "https://www.aipm-registry.com/prompts/aipm/summary",
      },
    });
    expect(project.prompts.summary).toContain("/prompts/aipm/summary");

    const lock = LockfileSchema.parse({
      schemaVersion: "0.1",
      packages: {},
      prompts: {
        summary: {
          id: "prompt-1",
          url: "https://www.aipm-registry.com/prompts/aipm/summary",
          publisher: "aipm",
          slug: "summary",
          contentHash: "abc123",
          updatedAt: "2026-09-05T00:00:00.000Z",
          installedPath: ".aipm/prompts/aipm--summary.md",
        },
      },
    });
    expect(lock.prompts.summary.publisher).toBe("aipm");
  });
});
