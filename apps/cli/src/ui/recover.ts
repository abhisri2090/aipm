import { stdin as input, stdout as output } from "node:process";
import { printNote } from "./note.js";
import { selectPrompt, SelectCancelledError, type SelectOption } from "./select.js";

export { SelectCancelledError };

export function canPromptInteractively(ci?: boolean): boolean {
  if (ci) return false;
  return Boolean(input.isTTY && output.isTTY);
}

export class RecoveryCancelledError extends Error {
  constructor(message = "Cancelled.") {
    super(message);
    this.name = "RecoveryCancelledError";
  }
}

/**
 * Show a note + interactive choices. In CI / non-TTY, throws `fallbackError`.
 * Esc / Ctrl+C throws {@link RecoveryCancelledError}.
 */
export async function offerChoices<T extends string>(options: {
  ci?: boolean;
  note?: { type?: "info" | "warn" | "error" | "success"; title?: string; message: string };
  message: string;
  choices: ReadonlyArray<SelectOption<T>>;
  /** Thrown when interactive prompts are unavailable. */
  fallbackError: string;
}): Promise<T> {
  if (!canPromptInteractively(options.ci)) {
    throw new Error(options.fallbackError);
  }

  if (options.note) {
    printNote({
      type: options.note.type ?? "warn",
      title: options.note.title,
      message: options.note.message,
    });
  }

  try {
    return await selectPrompt<T>({
      message: options.message,
      options: options.choices,
    });
  } catch (error) {
    if (error instanceof SelectCancelledError) {
      throw new RecoveryCancelledError();
    }
    throw error;
  }
}
