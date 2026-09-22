import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { AiTool } from "@aipm-registry/schemas";

export async function promptForTool(): Promise<AiTool> {
  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      const answer = await rl.question(
        "Which AI tool should this skill be installed for? (cursor/claude/codex): ",
      );
      const normalized = answer.trim().toLowerCase();
      if (normalized === "cursor" || normalized === "claude" || normalized === "codex") {
        return normalized;
      }
      console.log('Please enter "cursor", "claude", or "codex".');
    }
  } finally {
    rl.close();
  }
}

export async function promptForConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`${question} (y/N): `);
    const normalized = answer.trim().toLowerCase();
    return normalized === "y" || normalized === "yes";
  } finally {
    rl.close();
  }
}

/** Interactive choice when --no-init is used on an already-initialized project. */
export async function promptForNoInitConflict(): Promise<"no-init" | "tracked"> {
  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      console.log("  1) Continue without project tracking (keep --no-init)");
      console.log("  2) Use normal project mode (drop --no-init for this run)");
      const answer = await rl.question("Choose 1 or 2: ");
      const normalized = answer.trim().toLowerCase();
      if (normalized === "1" || normalized === "no-init") return "no-init";
      if (normalized === "2" || normalized === "tracked" || normalized === "normal") return "tracked";
      console.log('Please enter "1" or "2".');
    }
  } finally {
    rl.close();
  }
}
