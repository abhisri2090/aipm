import { access } from "node:fs/promises";
import { join } from "node:path";
import type { AiTool } from "@aipm-registry/schemas";
import type { PackageManifest } from "@aipm-registry/schemas";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectToolsInProject(projectRoot: string): Promise<AiTool[]> {
  const detected: AiTool[] = [];
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
export async function resolveInstallTools(
  options: ResolveToolsOptions,
): Promise<AiTool[]> {
  const { manifest } = options;
  const allowed = new Set(manifest.targets);

  if (options.explicitTarget) {
    if (!allowed.has(options.explicitTarget)) {
      throw new Error(
        `Package ${manifest.name} does not target "${options.explicitTarget}". Targets: ${manifest.targets.join(", ")}`,
      );
    }
    return [options.explicitTarget];
  }

  const detected = await detectToolsInProject(options.projectRoot);
  if (detected.length > 0) {
    const intersection = detected.filter((t) => allowed.has(t));
    if (intersection.length === 0) {
      throw new Error(
        `Package ${manifest.name} targets [${manifest.targets.join(", ")}] but project only has [${detected.join(", ")}].`,
      );
    }
    return intersection;
  }

  const preferred = (options.preferredTools ?? []).filter((t) => allowed.has(t));
  if (preferred.length > 0) return preferred;

  return [];
}
