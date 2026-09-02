import { describe, expect, it } from "vitest";
import {
  slugifyPromptTitle,
  userCanEditPrompt,
  validatePromptInput,
  validatePromptSampleImage,
} from "./prompt-routes.js";

const validPrompt = {
  title: "Plan a focused week",
  summary: "Turn a task list into a realistic weekly plan.",
  promptText: "Plan {{week}} using these tasks: {{tasks}}",
  category: "Productivity",
  tags: ["planning", "focus"],
  inputTypes: ["text"],
  outputTypes: ["structured-data"],
  testedModels: ["GPT-5", "Claude Sonnet 4.5"],
  effort: "guided",
  variables: [
    { name: "week", description: "The date range", example: "Sep 1–5", required: true },
    {
      name: "tasks",
      description: "The current task list",
      example: "Write brief",
      required: true,
    },
  ],
  license: "CC BY 4.0",
};

describe("prompt validation", () => {
  it("normalizes discovery fields while preserving tested model names", () => {
    const prompt = validatePromptInput(validPrompt);
    expect(prompt.slug).toBe("plan-a-focused-week");
    expect(prompt.tags).toEqual(["planning", "focus"]);
    expect(prompt.testedModels).toEqual(["GPT-5", "Claude Sonnet 4.5"]);
  });

  it("allows tested models to be omitted", () => {
    expect(validatePromptInput({ ...validPrompt, testedModels: [] }).testedModels).toEqual([]);
    expect(
      validatePromptInput({ ...validPrompt, testedModels: undefined }).testedModels,
    ).toEqual([]);
  });

  it("rejects duplicate variables", () => {
    expect(() =>
      validatePromptInput({
        ...validPrompt,
        variables: [
          ...validPrompt.variables,
          {
            name: "WEEK",
            description: "Duplicate",
            example: "Duplicate",
            required: true,
          },
        ],
      }),
    ).toThrow("listed more than once");
  });

  it("creates stable URL slugs", () => {
    expect(slugifyPromptTitle("  Café Photo → Poster!  ")).toBe("cafe-photo-poster");
  });

  it("requires a sample image and description for image outputs", () => {
    expect(() =>
      validatePromptSampleImage(["text", "image"], { present: false, alt: "" }),
    ).toThrow("A sample image is required");
    expect(() =>
      validatePromptSampleImage(["image"], { present: true, alt: "" }),
    ).toThrow("Describe the sample image");
    expect(() =>
      validatePromptSampleImage(["image"], {
        present: true,
        alt: "A vintage travel poster for Kyoto",
      }),
    ).not.toThrow();
  });
});

describe("userCanEditPrompt", () => {
  const prompt = { owner_user_id: "owner-1", org_id: null as string | null };

  it("allows the original owner", () => {
    expect(userCanEditPrompt("owner-1", prompt, new Set())).toBe(true);
  });

  it("rejects other users for personal prompts", () => {
    expect(userCanEditPrompt("other", prompt, new Set(["org-1"]))).toBe(false);
    expect(userCanEditPrompt(null, prompt, new Set())).toBe(false);
  });

  it("allows org owners and admins for org prompts", () => {
    const orgPrompt = { owner_user_id: "owner-1", org_id: "org-1" };
    expect(userCanEditPrompt("admin-user", orgPrompt, new Set(["org-1"]))).toBe(true);
    expect(userCanEditPrompt("member-user", orgPrompt, new Set())).toBe(false);
  });

  it("still allows the original owner of an org prompt", () => {
    const orgPrompt = { owner_user_id: "owner-1", org_id: "org-1" };
    expect(userCanEditPrompt("owner-1", orgPrompt, new Set())).toBe(true);
  });
});
