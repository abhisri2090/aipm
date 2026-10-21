import { isAbsolute, relative, resolve } from "node:path";
import type { AiTool, Lockfile, LockfilePackageEntry } from "@aipm-registry/schemas";

/** Store lockfile paths relative to the lockfile directory so they can be committed. */
export function toLockfilePath(configRoot: string, path: string): string {
  const absolute = isAbsolute(path) ? resolve(path) : resolve(configRoot, path);
  return relative(resolve(configRoot), absolute).split("\\").join("/");
}

/** Resolve a lockfile path, accepting both project-relative and legacy absolute values. */
export function fromLockfilePath(configRoot: string, path: string): string {
  return isAbsolute(path) ? resolve(path) : resolve(configRoot, path);
}

function relativizeLockEntry(configRoot: string, entry: LockfilePackageEntry): LockfilePackageEntry {
  const installed: LockfilePackageEntry["installed"] = {};
  for (const [tool, paths] of Object.entries(entry.installed) as Array<[AiTool, string[] | undefined]>) {
    if (paths) installed[tool] = paths.map((path) => toLockfilePath(configRoot, path));
  }

  return {
    ...entry,
    installed,
    ...(entry.shared
      ? {
          shared: {
            root: toLockfilePath(configRoot, entry.shared.root),
            files: entry.shared.files.map((path) => toLockfilePath(configRoot, path)),
          },
        }
      : {}),
    ...(entry.installedAssets
      ? {
          installedAssets: {
            main: entry.installedAssets.main.map((path) => toLockfilePath(configRoot, path)),
            helper: entry.installedAssets.helper.map((path) => toLockfilePath(configRoot, path)),
          },
        }
      : {}),
    ...(entry.postInstall
      ? {
          postInstall: {
            ...entry.postInstall,
            promptFile: toLockfilePath(configRoot, entry.postInstall.promptFile),
          },
        }
      : {}),
  };
}

export function relativizeLockfile(configRoot: string, data: Lockfile): Lockfile {
  const packages: Lockfile["packages"] = {};
  for (const [name, entry] of Object.entries(data.packages)) {
    packages[name] = relativizeLockEntry(configRoot, entry);
  }

  const prompts: Lockfile["prompts"] = {};
  for (const [name, entry] of Object.entries(data.prompts ?? {})) {
    prompts[name] = {
      ...entry,
      installedPath: toLockfilePath(configRoot, entry.installedPath),
    };
  }

  return { ...data, packages, prompts };
}
