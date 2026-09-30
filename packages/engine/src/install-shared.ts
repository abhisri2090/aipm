import { lstat, mkdir, symlink, unlink } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { writeSkillDirectory, type SkillSupportingFile } from "@aipm-registry/adapter-sdk";
import { shortNameFromScopeName, type ConcreteAiTool } from "@aipm-registry/schemas";

export interface InstallSharedSkillInput {
  projectRoot: string;
  packageName: string;
  tools: readonly ConcreteAiTool[];
  skillMarkdown: string;
  supportingFiles?: SkillSupportingFile[];
}

export interface InstallSharedSkillResult {
  short: string;
  root: string;
  files: string[];
  links: Partial<Record<ConcreteAiTool, string>>;
}

export function sharedSkillDir(projectRoot: string, short: string): string {
  return join(projectRoot, ".ai", "skills", short);
}

export function toolSkillDir(projectRoot: string, tool: ConcreteAiTool, short: string): string {
  if (tool === "cursor") return join(projectRoot, ".cursor", "skills", short);
  if (tool === "claude") return join(projectRoot, ".claude", "skills", short);
  return join(projectRoot, ".agents", "skills", short);
}

async function linkSkillDir(linkPath: string, canonicalDir: string): Promise<void> {
  await mkdir(dirname(linkPath), { recursive: true });
  const existing = await lstat(linkPath).catch(() => null);
  if (existing?.isSymbolicLink()) await unlink(linkPath);
  else if (existing) {
    throw new Error(`${linkPath} already exists and is not a shortcut. Remove it or install with --target.`);
  }
  try {
    await symlink(relative(dirname(linkPath), canonicalDir), linkPath, "dir");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EPERM") {
      throw new Error(
        `Could not create a shortcut at ${linkPath}. On Windows, turn on Developer Mode or run an admin shell, then retry.`,
      );
    }
    throw error;
  }
}

/** Remove tool shortcuts so a later full copy does not write through them into `.ai`. */
export async function detachSkillShortcuts(
  projectRoot: string,
  packageName: string,
  tools: readonly ConcreteAiTool[],
): Promise<void> {
  const short = shortNameFromScopeName(packageName);
  for (const tool of tools) {
    const dir = toolSkillDir(projectRoot, tool, short);
    const info = await lstat(dir).catch(() => null);
    if (info?.isSymbolicLink()) await unlink(dir);
  }
}

export async function installSharedSkill(input: InstallSharedSkillInput): Promise<InstallSharedSkillResult> {
  if (input.tools.length === 0) {
    throw new Error("No AI tool folder found to link. Add .cursor, .claude, or .codex, or pass --target.");
  }
  const short = shortNameFromScopeName(input.packageName);
  const root = sharedSkillDir(input.projectRoot, short);
  const written = await writeSkillDirectory(root, {
    skillMarkdown: input.skillMarkdown,
    supportingFiles: input.supportingFiles,
  });
  const links: Partial<Record<ConcreteAiTool, string>> = {};
  for (const tool of input.tools) {
    const linkPath = toolSkillDir(input.projectRoot, tool, short);
    await linkSkillDir(linkPath, root);
    links[tool] = linkPath;
  }
  return { short, root, files: written.writtenPaths, links };
}
