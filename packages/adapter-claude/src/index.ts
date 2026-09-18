import { join } from "node:path";
import {
  writeSkillDirectory,
  type SkillAdapter,
  type SkillInstallInput,
  type SkillInstallResult,
} from "@aipm-registry/adapter-sdk";
import { shortNameFromScopeName } from "@aipm-registry/schemas";

export class ClaudeSkillAdapter implements SkillAdapter {
  readonly tool = "claude" as const;

  async installSkill(input: SkillInstallInput): Promise<SkillInstallResult> {
    const short = shortNameFromScopeName(input.packageName);
    const skillDir = join(input.projectRoot, ".claude", "skills", short);
    return writeSkillDirectory(skillDir, input);
  }
}

export const claudeSkillAdapter = new ClaudeSkillAdapter();
