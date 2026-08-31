import type { PromptVariable } from "./prompts";

type VariableValues = Record<string, string>;

function placeholderPattern(name: string): RegExp {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`{{\\s*${escapedName}\\s*}}`, "g");
}

export function missingRequiredVariables(
  variables: PromptVariable[],
  values: VariableValues,
): string[] {
  return variables
    .filter((variable) => variable.required && !values[variable.name]?.trim())
    .map((variable) => variable.name);
}

export function buildFinalPrompt(
  promptText: string,
  variables: PromptVariable[],
  values: VariableValues,
): string {
  return variables.reduce((result, variable) => {
    const value = values[variable.name]?.trim();
    if (!value) return result;
    return result.replace(placeholderPattern(variable.name), () => value);
  }, promptText);
}
