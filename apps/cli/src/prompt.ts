import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { AiTool } from "@aipm-registry/schemas";

export async function promptForTool(): Promise<AiTool> {
  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      const answer = await rl.question(
        "Which AI tool should this skill be installed for? (cursor/claude): ",
      );
      const normalized = answer.trim().toLowerCase();
      if (normalized === "cursor" || normalized === "claude") {
        return normalized;
      }
      console.log('Please enter "cursor" or "claude".');
    }
  } finally {
    rl.close();
  }
}
