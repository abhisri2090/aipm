import { homedir } from "node:os";
import { join } from "node:path";
import { cwd } from "node:process";

/** Directory for global AIPM config (aipm.package.json, lockfile). */
export function globalConfigDir(env: NodeJS.ProcessEnv = process.env): string {
  const fromEnv = env.AIPM_HOME?.trim();
  return fromEnv ? fromEnv.replace(/\/$/, "") : join(homedir(), ".aipm");
}

export type ProjectScopeOptions = {
  global?: boolean;
};

/** Root directory for aipm.package.json and aipm-lock.json. */
export function resolveConfigRoot(options: ProjectScopeOptions = {}): string {
  return options.global ? globalConfigDir() : cwd();
}

/**
 * Root directory passed to adapters (.cursor/, .claude/, .codex/ under here).
 * Global installs write to the user's home so skills apply across projects.
 */
export function resolveInstallRoot(options: ProjectScopeOptions = {}): string {
  return options.global ? homedir() : cwd();
}

export function scopeLabel(options: ProjectScopeOptions): string {
  return options.global ? "global" : "project";
}

export function initRequiredMessage(options: ProjectScopeOptions): string {
  return options.global ? "Run aipm init -g first" : "Run aipm init first";
}
