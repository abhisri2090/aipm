import { recommendCmd } from "./recommend-cmd.js";
import { offerChoices, RecoveryCancelledError } from "./ui/recover.js";

export { RecoveryCancelledError };

/** When --no-init blocks a prompt URL, offer to continue with project tracking. */
export async function resolvePromptRequiresTracking(options: {
  ci?: boolean;
  command: "add" | "update" | "remove";
}): Promise<"tracked"> {
  const choice = await offerChoices<"tracked">({
    ci: options.ci,
    note: {
      type: "warn",
      title: "Prompt URLs need project tracking",
      message: "--no-init cannot manage prompts without aipm.package.json.",
    },
    message: "How do you want to continue?",
    choices: [
      {
        value: "tracked",
        label: "Continue with project tracking",
        hint: "drop --no-init for this run",
      },
    ],
    fallbackError:
      "Prompt URLs require project tracking. Drop --no-init, or run aipm init and continue without --no-init.",
  });
  return choice;
}

/** Private package / auth failure → login & retry, or cancel. */
export async function resolvePrivateInstallFailure(options: {
  ci?: boolean;
  errorMessage: string;
}): Promise<"login-retry"> {
  const looksPrivate =
    /private|login|unauthorized|forbidden|401|403|aipm login/i.test(options.errorMessage);
  if (!looksPrivate) {
    throw new Error(options.errorMessage);
  }

  const choice = await offerChoices<"login-retry">({
    ci: options.ci,
    note: {
      type: "error",
      title: "Package install needs authentication",
      message: options.errorMessage,
    },
    message: "What do you want to do?",
    choices: [
      {
        value: "login-retry",
        label: "Log in and retry",
        hint: "aipm login",
      },
    ],
    fallbackError: options.errorMessage,
  });
  return choice;
}

export async function resolveLoginRequired(options: {
  ci?: boolean;
  purpose: string;
}): Promise<"login"> {
  return offerChoices<"login">({
    ci: options.ci,
    note: {
      type: "warn",
      title: "Login required",
      message: options.purpose,
    },
    message: "What do you want to do?",
    choices: [{ value: "login", label: "Log in now", hint: "opens browser" }],
    fallbackError: `Run ${recommendCmd("aipm login")} first.`,
  });
}

export async function resolvePromptAliasConflict(options: {
  ci?: boolean;
  alias: string;
  currentUrl: string;
  nextUrl: string;
}): Promise<"replace"> {
  return offerChoices<"replace">({
    ci: options.ci,
    note: {
      type: "warn",
      title: "Prompt alias already in use",
      message: `"${options.alias}" currently tracks ${options.currentUrl}`,
    },
    message: "Replace it with the new prompt URL?",
    choices: [
      {
        value: "replace",
        label: "Replace and continue",
        hint: options.nextUrl,
      },
    ],
    fallbackError: `Prompt alias "${options.alias}" already tracks ${options.currentUrl}. Remove it first or use a unique slug.`,
  });
}
