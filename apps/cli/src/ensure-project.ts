import { mkdir } from "node:fs/promises";
import { detectToolsInProject } from "@aipm-registry/engine";
import type { AiTool, ProjectPackageJson } from "@aipm-registry/schemas";
import { parseTargetFlag, writeProjectPackageJson } from "./project-files.js";
import {
  initRequiredMessage,
  resolveConfigRoot,
  resolveInstallRoot,
  scopeLabel,
  type ProjectScopeOptions,
} from "./project-root.js";
import { promptForTool } from "./prompt.js";
import { offerChoices } from "./ui/recover.js";

export type EnsureProjectResult =
  | { action: "ready"; project: ProjectPackageJson }
  | { action: "no-init" };

/**
 * When aipm.package.json is missing, prompt to initialize or (optionally) continue untracked.
 * In CI / non-TTY, throws the classic init-required error.
 */
export async function ensureProjectOrOffer(options: {
  scope: ProjectScopeOptions;
  project: ProjectPackageJson | null;
  ci?: boolean;
  registry: string;
  target?: string;
  /** When true, offer "install/manage without initializing" (add/update/remove). */
  allowNoInit: boolean;
  /** Command label for messaging, e.g. "add" / "install". */
  command: string;
}): Promise<EnsureProjectResult> {
  if (options.project) {
    return { action: "ready", project: options.project };
  }

  const fallback = initRequiredMessage(options.scope);
  const choices = options.allowNoInit
    ? ([
        {
          value: "init" as const,
          label: "Initialize AiPM",
          hint: `create aipm.package.json (${scopeLabel(options.scope)})`,
        },
        {
          value: "no-init" as const,
          label: "Continue without initializing",
          hint: "one-time / no project tracking",
        },
      ] as const)
    : ([
        {
          value: "init" as const,
          label: "Initialize AiPM",
          hint: `create aipm.package.json (${scopeLabel(options.scope)})`,
        },
      ] as const);

  const choice = await offerChoices<"init" | "no-init">({
    ci: options.ci,
    note: {
      type: "warn",
      title: "AiPM is not initialized",
      message: `No aipm.package.json found for this ${scopeLabel(options.scope)}.`,
    },
    message: `How do you want to continue with aipm ${options.command}?`,
    choices: [...choices],
    fallbackError: fallback,
  });

  if (choice === "no-init") {
    return { action: "no-init" };
  }

  const project = await createProjectPackageJson({
    scope: options.scope,
    registry: options.registry,
    target: options.target,
  });
  return { action: "ready", project };
}

export async function createProjectPackageJson(options: {
  scope: ProjectScopeOptions;
  registry: string;
  target?: string;
}): Promise<ProjectPackageJson> {
  const configRoot = resolveConfigRoot(options.scope);
  const installRoot = resolveInstallRoot(options.scope);
  if (options.scope.global) await mkdir(configRoot, { recursive: true });

  const detected = await detectToolsInProject(installRoot);
  const parsedTarget = parseTargetFlag(options.target);
  let preferredTools: AiTool[] = parsedTarget ? [parsedTarget] : detected;
  if (!options.target && detected.length === 0) {
    const choice = await promptForTool();
    preferredTools = [choice];
  }

  const project: ProjectPackageJson = {
    schemaVersion: "0.1",
    registry: options.registry,
    preferredTools: preferredTools.length ? preferredTools : undefined,
    packages: {},
    prompts: {},
  };
  await writeProjectPackageJson(configRoot, project);
  console.log(`Created aipm.package.json (${scopeLabel(options.scope)}, registry: ${options.registry})`);
  return project;
}
