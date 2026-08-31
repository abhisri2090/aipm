import { describe, expect, it } from "vitest";
import {
  buildFormDetailsPrompt,
  buildGenericPrompt,
  parseFormDetailsResponse,
} from "./prompt-preparation";

describe("prompt preparation templates", () => {
  it("puts the genericization instructions before the original prompt", () => {
    const result = buildGenericPrompt("Create a weekly meal plan for my family.");

    expect(result.indexOf("SYSTEM INSTRUCTIONS")).toBeLessThan(
      result.indexOf("USER PROMPT"),
    );
    expect(result).toContain("Preserve the original goal");
    expect(result).toContain("Create a weekly meal plan for my family.");
  });

  it("creates a form-details request that preserves the original prompt", () => {
    const result = buildFormDetailsPrompt("Summarize this project update.");

    expect(result).toContain("AIPM publishing form");
    expect(result).toContain("Return only valid JSON");
    expect(result).toContain('"title":"","slug":"","summary":""');
    expect(result).toContain("Summarize this project update.");
  });

  it("parses recognized form details from a JSON response", () => {
    expect(
      parseFormDetailsResponse(
        JSON.stringify({
          title: "Weekly planning",
          category: "Productivity",
          tags: ["planning", "focus"],
          inputTypes: ["text", "invalid"],
          variables: [
            {
              name: "tasks",
              description: "Tasks to plan",
              example: "Write release notes",
              required: true,
            },
          ],
        }),
      ),
    ).toEqual({
      title: "Weekly planning",
      category: "Productivity",
      tags: ["planning", "focus"],
      inputTypes: ["text"],
      variables: [
        {
          name: "tasks",
          description: "Tasks to plan",
          example: "Write release notes",
          required: true,
        },
      ],
    });
  });

  it("accepts fenced JSON and rejects invalid responses", () => {
    expect(parseFormDetailsResponse('```json\n{"summary":"A summary"}\n```')).toEqual({
      summary: "A summary",
    });
    expect(
      parseFormDetailsResponse(
        JSON.stringify({
          title: "",
          tags: [],
          variables: [{ name: "topic", description: "", example: "", required: true }],
          summary: "Keep existing values",
        }),
      ),
    ).toEqual({ summary: "Keep existing values" });
    expect(() => parseFormDetailsResponse("not JSON")).toThrow("valid JSON");
    expect(() => parseFormDetailsResponse('{"unknown":"value"}')).toThrow(
      "recognized form fields",
    );
  });

  it("rejects empty prompts", () => {
    expect(() => buildGenericPrompt("  ")).toThrow("Enter a prompt first");
    expect(() => buildFormDetailsPrompt("")).toThrow("Enter a prompt first");
  });
});
