import { describe, expect, it } from "vitest";
import {
  buildSkillSerpFields,
  humanizePackageSlug,
  resolveSkillToolLabel,
  skillOutcomeLine,
} from "./skill-serp";

describe("skill-serp", () => {
  it("humanizePackageSlug title-cases kebab segments", () => {
    expect(humanizePackageSlug("frontend-design")).toBe("Frontend Design");
    expect(humanizePackageSlug("planning_with_files")).toBe("Planning With Files");
  });

  it("resolveSkillToolLabel picks primary or AI Agent", () => {
    expect(resolveSkillToolLabel(["cursor"])).toBe("Cursor");
    expect(resolveSkillToolLabel(["claude"])).toBe("Claude Code");
    expect(resolveSkillToolLabel(["*"])).toBe("AI Agent");
    expect(resolveSkillToolLabel(["cursor", "claude"])).toBe("AI Agent");
    expect(resolveSkillToolLabel(["codex"])).toBe("AI Agent");
  });

  it("skillOutcomeLine strips trigger prose", () => {
    expect(
      skillOutcomeLine("Migrate test files from as assertions. Use when user mentions shoehorn."),
    ).toBe("Migrate test files from as assertions.");
    expect(skillOutcomeLine("When the user wants a redesign, generate three directions.")).toMatch(
      /generate three directions/i,
    );
  });

  it("buildSkillSerpFields prefers displayName and keeps title under 60", () => {
    const fields = buildSkillSerpFields({
      name: "@acme/very-long-marketing-name-that-would-overflow",
      version: "1.2.3",
      description: "Ship reusable product photography prompts. Use when the user wants product shots.",
      targets: ["cursor"],
      displayName: "Product Photography",
    });
    expect(fields.humanName).toBe("Product Photography");
    expect(fields.packageId).toBe("@acme/very-long-marketing-name-that-would-overflow@1.2.3");
    expect(fields.title).toBe("Product Photography — Cursor Skill | AIPM");
    expect(fields.title.length).toBeLessThanOrEqual(60);
    expect(fields.metaDescription).toMatch(/Install with AIPM/);
    expect(fields.metaDescription).not.toMatch(/When the user wants/i);
  });
});
