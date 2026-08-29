import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { addPublishFiles } from "./publish-state.js";
import { packStagedFiles } from "./pack.js";

describe("packStagedFiles", () => {
  it("packs staged files before removing the temp directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-pack-test-"));
    try {
      await writeFile(
        join(root, "aipm.manifest.json"),
        JSON.stringify({
          schemaVersion: "0.1",
          name: "@team/pack-test",
          version: "1.0.0",
          type: "skill",
          description: "Pack test",
          entry: "SKILL.md",
          targets: ["cursor"],
          license: "Apache-2.0",
        }),
      );
      await writeFile(join(root, "SKILL.md"), "# Pack test\n");
      await addPublishFiles(root, ["."]);

      const tarball = await packStagedFiles(root);
      expect(tarball.length).toBeGreaterThan(0);

      const text = tarball.toString("utf8", 0, Math.min(tarball.length, 200));
      expect(text.includes("ustar") || tarball.length > 100).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
