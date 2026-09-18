import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import type { AiTool } from "@aipm-registry/schemas";

export interface SkillInstallInput {
  packageName: string;
  version: string;
  skillMarkdown: string;
  supportingFiles?: SkillSupportingFile[];
  projectRoot: string;
}

export interface SkillSupportingFile {
  path: string;
  content: Uint8Array;
  mode?: number;
}

export interface SkillInstallResult {
  writtenPaths: string[];
}

export async function writeSkillDirectory(
  skillDir: string,
  input: Pick<SkillInstallInput, "skillMarkdown" | "supportingFiles">,
): Promise<SkillInstallResult> {
  const entryPath = join(skillDir, "SKILL.md");
  const seen = new Set(["skill.md"]);
  const files = (input.supportingFiles ?? []).map((file) => {
    const normalized = normalize(file.path);
    const target = resolve(skillDir, normalized);
    const fromSkillDir = relative(skillDir, target);
    return { file, normalized, target, fromSkillDir, key: fromSkillDir.toLowerCase() };
  });

  for (const { file, normalized, fromSkillDir, key } of files) {
    if (
      !normalized ||
      normalized === "." ||
      isAbsolute(normalized) ||
      fromSkillDir === ".." ||
      fromSkillDir.startsWith(`..${sep}`) ||
      isAbsolute(fromSkillDir) ||
      seen.has(key)
    ) {
      throw new Error(`Unsafe or duplicate skill supporting file path: ${file.path}`);
    }
    seen.add(key);
  }

  await mkdir(skillDir, { recursive: true });
  await writeFile(entryPath, input.skillMarkdown, "utf8");
  const writtenPaths = [entryPath];
  for (const { file, target } of files) {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content);
    if (file.mode !== undefined) await chmod(target, file.mode & 0o777);
    writtenPaths.push(target);
  }

  return { writtenPaths };
}

export interface SkillAdapter {
  readonly tool: AiTool;
  installSkill(input: SkillInstallInput): Promise<SkillInstallResult>;
}
