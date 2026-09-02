import {
  PROMPT_CATEGORIES,
  PROMPT_INPUT_TYPES,
  PROMPT_OUTPUT_TYPES,
  type PromptVariable,
} from "./prompts";

const GENERIC_SYSTEM_PROMPT = `You are a prompt editor. Preserve the original goal, base use case, constraints, and expected output. Make the instruction clear, generic, reusable, and tool-agnostic. Only replace sections that depend on one-off context, such as a specific person, project, organization, date, location, or input data, with clear variables using {{variable_name}}. Do not change the core use case or add unrelated requirements. Return only the improved prompt.`;

const FORM_DETAILS_SYSTEM_PROMPT = `You are helping prepare a prompt for the AIPM publishing form. Preserve the prompt's original use case and suggest concise, accurate values for its title, URL slug, summary, category, tags, input types, output types, effort, language, tested models, variables with descriptions and examples, example input, example output, usage notes, license, and source URL. Use category values from Productivity, Work, Photo, Travel, Fun, Learning, Marketing, Coding, or Playground. Use input type values from text, image, document, code, or audio. Use output type values from text, image, code, structured-data, audio, or video. Use effort values quick, guided, or advanced. Use license values CC BY 4.0, CC BY-SA 4.0, CC0 1.0, or All rights reserved. Do not invent facts; use an empty string or empty array when a value cannot be determined. Return only valid JSON, with no markdown fences, explanation, or extra text. Use exactly this shape: {"title":"","slug":"","summary":"","category":"","tags":[],"inputTypes":[],"outputTypes":[],"effort":"","language":"","testedModels":[],"variables":[{"name":"","description":"","example":"","required":true}],"exampleInput":"","exampleOutput":"","usageNotes":"","license":"","sourceUrl":""}.`;

export type PromptFormAutofill = Partial<{
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  inputTypes: string[];
  outputTypes: string[];
  effort: string;
  language: string;
  testedModels: string[];
  variables: PromptVariable[];
  exampleInput: string;
  exampleOutput: string;
  usageNotes: string;
  license: string;
  sourceUrl: string;
}>;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  return result || undefined;
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return undefined;
  }
  const result = value.map((item) => item.trim()).filter(Boolean);
  return result.length ? result : undefined;
}

function variablesValue(value: unknown): PromptVariable[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const variables = value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const name = stringValue(item.name);
    const description = stringValue(item.description);
    const example = stringValue(item.example);
    if (!name || !description || !example || typeof item.required !== "boolean") return [];
    return [{ name, description, example, required: item.required }];
  });

  return variables.length > 0 && variables.length === value.length ? variables : undefined;
}

function withoutMarkdownFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function requirePrompt(promptText: string): string {
  if (!promptText.trim()) throw new Error("Enter a prompt first");
  return promptText;
}

export function buildGenericPrompt(promptText: string): string {
  return `SYSTEM INSTRUCTIONS\n${GENERIC_SYSTEM_PROMPT}\n\nUSER PROMPT\n${requirePrompt(promptText)}`;
}

export function buildFormDetailsPrompt(promptText: string): string {
  return `SYSTEM INSTRUCTIONS\n${FORM_DETAILS_SYSTEM_PROMPT}\n\nUSER PROMPT\n${requirePrompt(promptText)}`;
}

export function parseFormDetailsResponse(responseText: string): PromptFormAutofill {
  let parsed: unknown;
  try {
    parsed = JSON.parse(withoutMarkdownFence(responseText));
  } catch {
    throw new Error("Paste a valid JSON response from your AI tool.");
  }

  if (!isRecord(parsed)) {
    throw new Error("The JSON response must be an object of form details.");
  }

  const details: PromptFormAutofill = {};
  const title = stringValue(parsed.title);
  const slug = stringValue(parsed.slug);
  const summary = stringValue(parsed.summary);
  const category = stringValue(parsed.category);
  const tags = stringList(parsed.tags);
  const inputTypes = stringList(parsed.inputTypes);
  const outputTypes = stringList(parsed.outputTypes);
  const effort = stringValue(parsed.effort);
  const language = stringValue(parsed.language);
  const testedModels = stringList(parsed.testedModels);
  const variables = variablesValue(parsed.variables);
  const exampleInput = stringValue(parsed.exampleInput);
  const exampleOutput = stringValue(parsed.exampleOutput);
  const usageNotes = stringValue(parsed.usageNotes);
  const license = stringValue(parsed.license);
  const sourceUrl = stringValue(parsed.sourceUrl);

  if (title !== undefined) details.title = title;
  if (slug !== undefined) details.slug = slug;
  if (summary !== undefined) details.summary = summary;
  if (
    category !== undefined &&
    PROMPT_CATEGORIES.includes(category as (typeof PROMPT_CATEGORIES)[number]) &&
    category !== "All"
  ) {
    details.category = category;
  }
  if (tags !== undefined) details.tags = tags;
  if (inputTypes !== undefined) {
    details.inputTypes = inputTypes.filter((item) =>
      PROMPT_INPUT_TYPES.includes(item as (typeof PROMPT_INPUT_TYPES)[number]),
    );
  }
  if (outputTypes !== undefined) {
    details.outputTypes = outputTypes.filter((item) =>
      PROMPT_OUTPUT_TYPES.includes(item as (typeof PROMPT_OUTPUT_TYPES)[number]),
    );
  }
  if (effort === "quick" || effort === "guided" || effort === "advanced") {
    details.effort = effort;
  }
  if (language !== undefined) details.language = language;
  if (testedModels !== undefined) details.testedModels = testedModels;
  if (variables !== undefined) details.variables = variables;
  if (exampleInput !== undefined) details.exampleInput = exampleInput;
  if (exampleOutput !== undefined) details.exampleOutput = exampleOutput;
  if (usageNotes !== undefined) details.usageNotes = usageNotes;
  if (
    license === "CC BY 4.0" ||
    license === "CC BY-SA 4.0" ||
    license === "CC0 1.0" ||
    license === "All rights reserved"
  ) {
    details.license = license;
  }
  if (sourceUrl !== undefined) details.sourceUrl = sourceUrl;

  if (Object.keys(details).length === 0) {
    throw new Error("The JSON response did not include recognized form fields.");
  }

  return details;
}
