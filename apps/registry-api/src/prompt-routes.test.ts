import { describe, expect, it } from "vitest";
import {
  slugifyPromptTitle,
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
