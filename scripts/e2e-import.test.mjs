import { describe, expect, it } from "vitest";

const hasE2eEnv =
  process.env.DATABASE_URL &&
  process.env.AIPM_ADMIN_TOKEN &&
  process.env.GITHUB_TOKEN &&
  process.env.AIPM_REGISTRY_URL;

describe.skipIf(!hasE2eEnv)("import skill e2e", () => {
  it("imports grill-me from GitHub into the registry", async () => {
    const { importSkillFromUrl } = await import("./import-skill.mjs");
    const result = await importSkillFromUrl(
      "https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me",
    );
    expect(["published", "skipped"]).toContain(result.action);
    expect(result.packageName).toBe("@mattpocock/grill-me");
  }, 120_000);
});
