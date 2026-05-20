import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillAdapter, SkillInstallInput, SkillInstallResult } from "@aipm/adapter-sdk";
import { shortNameFromScopeName } from "@aipm/schemas";

export class ClaudeSkillAdapter implements SkillAdapter {
  readonly tool = "claude" as const;

  async installSkill(input: SkillInstallInput): Promise<SkillInstallResult> {
    const short = shortNameFromScopeName(input.packageName);
    const skillDir = join(input.projectRoot, ".claude", "aipm", "skills", short);
    await mkdir(skillDir, { recursive: true });
    const filePath = join(skillDir, "SKILL.md");
    await writeFile(filePath, input.skillMarkdown, "utf8");
    return { writtenPaths: [filePath] };
  }
}

export const claudeSkillAdapter = new ClaudeSkillAdapter();
