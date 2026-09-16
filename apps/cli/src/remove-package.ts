import { lstat, rm, rmdir } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type { LockfilePackageEntry } from "@aipm-registry/schemas";

function within(root: string, path: string): boolean {
  const rel = relative(resolve(root), resolve(path));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function trackedPaths(entry: LockfilePackageEntry): string[] {
  return [
    ...Object.values(entry.installed).flat(),
    ...(entry.installedAssets?.main ?? []),
    ...(entry.installedAssets?.helper ?? []),
  ];
}

async function pruneEmptyParents(path: string, roots: string[]): Promise<void> {
  let current = dirname(path);
  while (roots.some((root) => within(root, current)) && !roots.some((root) => resolve(root) === current)) {
    try {
      await rmdir(current);
    } catch {
      return;
    }
    current = dirname(current);
  }
}

export async function removeInstalledPackageFiles(input: {
  configRoot: string;
  installRoot: string;
  entry: LockfilePackageEntry;
}): Promise<number> {
  const roots = [...new Set([resolve(input.configRoot), resolve(input.installRoot)])];
  const paths = [...new Set(trackedPaths(input.entry).map((path) => resolve(path)))];
  const unsafe = paths.find((path) => !roots.some((root) => within(root, path)));
  if (unsafe) throw new Error(`Refusing to remove an untrusted path from the lockfile: ${unsafe}`);

  let removed = 0;
  for (const path of paths) {
    if (await lstat(path).catch(() => null)) removed += 1;
    await rm(path, { force: true });
  }
  for (const path of paths.sort((a, b) => b.length - a.length)) {
    await pruneEmptyParents(path, roots);
  }
  return removed;
}
