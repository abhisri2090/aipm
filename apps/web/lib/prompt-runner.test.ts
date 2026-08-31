import { describe, expect, it } from "vitest";
import type { PromptVariable } from "./prompts";
import { buildFinalPrompt, missingRequiredVariables } from "./prompt-runner";

const variables: PromptVariable[] = [
  {
    name: "name",
    description: "Person's name",
    example: "Ada",
    required: true,
  },
  {
    name: "tone",
    description: "Writing tone",
    example: "Friendly",
    required: false,
  },
];

describe("prompt runner helpers", () => {
  it("finds required variables without rejecting optional blanks", () => {
    expect(missingRequiredVariables(variables, { name: "", tone: "" })).toEqual(["name"]);
    expect(missingRequiredVariables(variables, { name: "Ada", tone: "" })).toEqual([]);
  });

  it("replaces every provided placeholder and preserves blank optional ones", () => {
    expect(
      buildFinalPrompt(
        "Write to {{name}} in a {{ tone }} tone. Sign off to {{name}}.",
        variables,
        { name: "Ada", tone: "" },
      ),
    ).toBe("Write to Ada in a {{ tone }} tone. Sign off to Ada.");
  });
});
