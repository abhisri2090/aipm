import type { SkillAdapter } from "@aipm/adapter-sdk";
import { claudeSkillAdapter } from "@aipm/adapter-claude";
import { cursorSkillAdapter } from "@aipm/adapter-cursor";
import type { AiTool, PackageManifest } from "@aipm/schemas";
import { resolveInstallTools } from "./detect-tools.js";

const adapters: Record<AiTool, SkillAdapter> = {
  cursor: cursorSkillAdapter,
  claude: claudeSkillAdapter,
};

export interface InstallSkillOptions {
  projectRoot: string;
  manifest: PackageManifest;
  skillMarkdown: string;
  preferredTools?: AiTool[];
  explicitTarget?: AiTool;
}

export interface InstallSkillResult {
  resolvedTools: AiTool[];
  installed: Partial<Record<AiTool, string[]>>;
}

export async function installSkillPackage(
  options: InstallSkillOptions,
): Promise<InstallSkillResult> {
  const tools = await resolveInstallTools({
    projectRoot: options.projectRoot,
    manifest: options.manifest,
    preferredTools: options.preferredTools,
    explicitTarget: options.explicitTarget,
  });

  if (tools.length === 0) {
    throw new Error(
      "No AI tool detected (.cursor/ or .claude/). Use --target cursor|claude or set preferredTools in aipm.package.json.",
    );
  }

  const installed: Partial<Record<AiTool, string[]>> = {};

  for (const tool of tools) {
    const adapter = adapters[tool];
    const result = await adapter.installSkill({
      packageName: options.manifest.name,
      version: options.manifest.version,
      skillMarkdown: options.skillMarkdown,
      projectRoot: options.projectRoot,
    });
    installed[tool] = result.writtenPaths;
  }

  return { resolvedTools: tools, installed };
}
