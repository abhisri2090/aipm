import { access } from "node:fs/promises";
import { join } from "node:path";
import {
  ALL_TOOLS,
  expandTargets,
  type AiTool,
  type ConcreteAiTool,
  type PackageManifest,
} from "@aipm-registry/schemas";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectToolsInProject(
  projectRoot: string,
): Promise<ConcreteAiTool[]> {
  const detected: ConcreteAiTool[] = [];
  if (await pathExists(join(projectRoot, ".cursor"))) detected.push("cursor");
  if (await pathExists(join(projectRoot, ".claude"))) detected.push("claude");
  return detected;
}

export interface ResolveToolsOptions {
  projectRoot: string;
  manifest: PackageManifest;
  preferredTools?: AiTool[];
  explicitTarget?: AiTool;
}

/**
 * Resolves which tools to install to.
 * - explicitTarget wins
 * - else detected ∩ manifest.targets
 * - else preferredTools filtered to manifest.targets
 */
function manifestAllowsTool(manifest: PackageManifest, tool: ConcreteAiTool): boolean {
  if (manifest.targets.includes("*")) return true;
  return manifest.targets.includes(tool);
}

export async function resolveInstallTools(
  options: ResolveToolsOptions,
): Promise<ConcreteAiTool[]> {
  const { manifest } = options;
  const expandedAllowed = expandTargets(manifest.targets);

  if (options.explicitTarget) {
    if (options.explicitTarget === "*") {
      return [...ALL_TOOLS];
    }
    if (!manifestAllowsTool(manifest, options.explicitTarget)) {
      throw new Error(
        `Package ${manifest.name} does not target "${options.explicitTarget}". Targets: ${manifest.targets.join(", ")}`,
      );
    }
    return [options.explicitTarget];
  }

  const detected = await detectToolsInProject(options.projectRoot);
  if (detected.length > 0) {
    const intersection = detected.filter((t) => manifestAllowsTool(manifest, t));
    if (intersection.length === 0) {
      throw new Error(
        `Package ${manifest.name} targets [${manifest.targets.join(", ")}] but project only has [${detected.join(", ")}].`,
      );
    }
    return intersection;
  }

  const preferred = expandTargets(options.preferredTools ?? []).filter((t) =>
    manifestAllowsTool(manifest, t),
  );
  if (preferred.length > 0) return preferred;

  if (manifest.targets.includes("*")) return expandedAllowed;

  return [];
}
