import { selectPrompt, type SelectPromptOptions } from "./select.js";

export type ConfirmPromptOptions = {
  message: string;
  /** Default highlighted choice (default: false / No). */
  initialConfirm?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  input?: SelectPromptOptions<boolean>["input"];
  output?: SelectPromptOptions<boolean>["output"];
};

/** Yes/No prompt with the same arrow-key UI as select. */
export async function confirmPrompt(options: ConfirmPromptOptions): Promise<boolean> {
  return selectPrompt<boolean>({
    message: options.message,
    initialIndex: options.initialConfirm ? 0 : 1,
    input: options.input,
    output: options.output,
    options: [
      { value: true, label: options.activeLabel ?? "Yes" },
      { value: false, label: options.inactiveLabel ?? "No" },
    ],
  });
}
