import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillAdapter, SkillInstallInput, SkillInstallResult } from "@aipm-registry/adapter-sdk";
import { shortNameFromScopeName } from "@aipm-registry/schemas";

export class CursorSkillAdapter implements SkillAdapter {
  readonly tool = "cursor" as const;

  async installSkill(input: SkillInstallInput): Promise<SkillInstallResult> {
    const short = shortNameFromScopeName(input.packageName);
    const skillsDir = join(input.projectRoot, ".cursor", "aipm", "skills");
    await mkdir(skillsDir, { recursive: true });
    const filePath = join(skillsDir, `${short}.md`);
    await writeFile(filePath, input.skillMarkdown, "utf8");
    return { writtenPaths: [filePath] };
  }
}

export const cursorSkillAdapter = new CursorSkillAdapter();
