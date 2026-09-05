import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillAdapter, SkillInstallInput, SkillInstallResult } from "@aipm-registry/adapter-sdk";
import { shortNameFromScopeName } from "@aipm-registry/schemas";

export class CodexSkillAdapter implements SkillAdapter {
  readonly tool = "codex" as const;

  async installSkill(input: SkillInstallInput): Promise<SkillInstallResult> {
    const short = shortNameFromScopeName(input.packageName);
    const skillDir = join(input.projectRoot, ".agents", "skills", short);
    await mkdir(skillDir, { recursive: true });
    const filePath = join(skillDir, "SKILL.md");
    await writeFile(filePath, input.skillMarkdown, "utf8");
    return { writtenPaths: [filePath] };
  }
}

export const codexSkillAdapter = new CodexSkillAdapter();
