import { access, rm, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { shortNameFromScopeName } from "@aipm-registry/schemas";
import { promptForNoInitConflict } from "./prompt.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function packageHelperSlug(name: string): string {
  const [scope = "", pkg = ""] = name.replace(/^@/, "").split("/");
  return `${scope}__${pkg}`;
}

function helpersBase(configRoot: string): string {
  return basename(configRoot) === ".aipm"
    ? join(configRoot, "helpers")
    : join(configRoot, ".aipm", "helpers");
}

/**
 * Resolves whether this run should use untracked (--no-init) mode.
 * Returns true to keep --no-init behavior; false to fall through to tracked mode.
 */
export async function resolveNoInitMode(options: {
  requested: boolean;
  projectExists: boolean;
  ci?: boolean;
}): Promise<boolean> {
  if (!options.requested) return false;
  if (!options.projectExists) return true;

  if (options.ci) {
    throw new Error(
      "Project already initialized (aipm.package.json exists). Drop --no-init, or run interactively to choose whether to continue without tracking.",
    );
  }

  console.warn("Warning: aipm.package.json already exists in this project.");
  console.warn("You requested --no-init (install/manage without project tracking).");
  const choice = await promptForNoInitConflict();
  return choice === "no-init";
}

export function discoverUntrackedPackagePaths(input: {
  installRoot: string;
  configRoot: string;
  packageName: string;
}): string[] {
  const short = shortNameFromScopeName(input.packageName);
  const slug = packageHelperSlug(input.packageName);
  return [
    join(input.installRoot, ".cursor", "aipm", "skills", `${short}.md`),
    join(input.installRoot, ".claude", "skills", short),
    join(input.installRoot, ".agents", "skills", short),
    join(helpersBase(input.configRoot), slug),
  ];
}

export async function removeUntrackedPackage(input: {
  installRoot: string;
  configRoot: string;
  packageName: string;
}): Promise<{ removed: string[] }> {
  const candidates = discoverUntrackedPackagePaths(input);
  const removed: string[] = [];

  for (const path of candidates) {
    const info = await stat(path).catch(() => null);
    if (!info) continue;
    await rm(path, { recursive: true, force: true });
    removed.push(path);
  }

  if (removed.length === 0) {
    throw new Error(
      `No untracked install found for ${input.packageName}. Nothing to remove under known tool skill paths or .aipm/helpers.`,
    );
  }

  return { removed };
}

/** Whether any known untracked path exists for the package. */
export async function hasUntrackedPackageInstall(input: {
  installRoot: string;
  configRoot: string;
  packageName: string;
}): Promise<boolean> {
  for (const path of discoverUntrackedPackagePaths(input)) {
    if (await pathExists(path)) return true;
  }
  return false;
}
