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
