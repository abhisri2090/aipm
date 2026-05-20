import type { AiTool } from "@aipm/schemas";

export interface SkillInstallInput {
  packageName: string;
  version: string;
  skillMarkdown: string;
  projectRoot: string;
}

export interface SkillInstallResult {
  writtenPaths: string[];
}

export interface SkillAdapter {
  readonly tool: AiTool;
  installSkill(input: SkillInstallInput): Promise<SkillInstallResult>;
}
