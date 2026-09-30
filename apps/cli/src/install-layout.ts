import { detectToolsInProject } from "@aipm-registry/engine";
import type { AiTool, ConcreteAiTool, PackageManifest } from "@aipm-registry/schemas";
import { promptForInstallLayout } from "./prompt.js";

export type InstallLayout =
  | { mode: "copy"; tool: ConcreteAiTool }
  | { mode: "shared"; tools: ConcreteAiTool[] }
  | { mode: "default" };

function allowed(manifest: PackageManifest, tool: ConcreteAiTool): boolean {
  return manifest.targets.includes("*") || manifest.targets.includes(tool);
}

export async function resolveInstallLayout(input: {
  projectRoot: string;
  manifest: PackageManifest;
  explicitTarget?: AiTool;
  shared?: boolean;
  ci?: boolean;
}): Promise<InstallLayout> {
  if (input.shared && input.explicitTarget) {
    throw new Error("--shared cannot be combined with --target.");
  }
  const detected = (await detectToolsInProject(input.projectRoot)).filter((tool) => allowed(input.manifest, tool));

  if (input.shared) {
    if (detected.length === 0) {
      throw new Error("No AI tool folder found to link. Add .cursor, .claude, or .codex, or pass --target.");
    }
    return { mode: "shared", tools: detected };
  }
  if (input.explicitTarget || detected.length < 2) return { mode: "default" };
  if (input.ci) {
    throw new Error("Several AI tool folders found. Pass --target cursor|claude|codex or --shared.");
  }
  const choice = await promptForInstallLayout(detected);
  if (choice.mode === "shared") return { mode: "shared", tools: detected };
  return { mode: "copy", tool: choice.tool };
}
