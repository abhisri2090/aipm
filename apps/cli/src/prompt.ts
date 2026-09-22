import type { ConcreteAiTool } from "@aipm-registry/schemas";
import { confirmPrompt } from "./ui/confirm.js";
import { selectPrompt } from "./ui/select.js";

export async function promptForTool(
  tools: ReadonlyArray<ConcreteAiTool> = ["cursor", "claude", "codex"],
): Promise<ConcreteAiTool> {
  const options = tools.map((tool) => ({
    value: tool,
    label: tool,
    hint:
      tool === "cursor"
        ? ".cursor/"
        : tool === "claude"
          ? ".claude/"
          : ".agents/ (Codex)",
  }));
  return selectPrompt<ConcreteAiTool>({
    message: "Which AI tool should this skill be installed for?",
    options,
  });
}

export async function promptForConfirmation(question: string): Promise<boolean> {
  return confirmPrompt({ message: question, initialConfirm: false });
}

/** Interactive choice when --no-init is used on an already-initialized project. */
export async function promptForNoInitConflict(): Promise<"no-init" | "tracked"> {
  return selectPrompt<"no-init" | "tracked">({
    message: "Project already has aipm.package.json. How do you want to continue?",
    options: [
      {
        value: "no-init",
        label: "Continue without project tracking",
        hint: "keep --no-init",
      },
      {
        value: "tracked",
        label: "Use normal project mode",
        hint: "drop --no-init for this run",
      },
    ],
  });
}

export { selectPrompt, SelectCancelledError } from "./ui/select.js";
export type { SelectOption, SelectPromptOptions } from "./ui/select.js";
export { confirmPrompt } from "./ui/confirm.js";
export { printNote } from "./ui/note.js";
export { createSpinner } from "./ui/spinner.js";
export { offerChoices, canPromptInteractively, RecoveryCancelledError } from "./ui/recover.js";
