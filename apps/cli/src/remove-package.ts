import { lstat, realpath, rm, rmdir, unlink } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type { LockfilePackageEntry } from "@aipm-registry/schemas";

function within(root: string, path: string): boolean {
  const rel = relative(resolve(root), resolve(path));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export function trackedInstalledPackagePaths(entry: LockfilePackageEntry): string[] {
  return [
    ...Object.values(entry.installed).flat(),
    ...(entry.shared?.files ?? []),
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
  otherEntries?: LockfilePackageEntry[];
}): Promise<{ removed: number; retainedShared: number }> {
  const roots = [...new Set([resolve(input.configRoot), resolve(input.installRoot)])];
  const realRoots = await Promise.all(roots.map((root) => realpath(root).catch(() => root)));
  const requestedPaths = [...new Set(trackedInstalledPackagePaths(input.entry).map((path) => resolve(path)))];
  const protectedPaths = new Set(
    (input.otherEntries ?? []).flatMap(trackedInstalledPackagePaths).map((path) => resolve(path)),
  );
  const paths = requestedPaths.filter((path) => !protectedPaths.has(path));
  const unsafe = paths.find((path) => !roots.some((root) => within(root, path)));
  if (unsafe) throw new Error(`Refusing to remove an untrusted path from the lockfile: ${unsafe}`);

  const symlinkPaths: string[] = [];
  const realPaths: string[] = [];
  for (const path of paths) {
    const stat = await lstat(path).catch(() => null);
    if (!stat) continue;
    if (stat.isSymbolicLink()) symlinkPaths.push(path);
    else realPaths.push(path);
  }

  for (const path of realPaths) {
    const canonicalPath = await realpath(path);
    if (!realRoots.some((root) => within(root, canonicalPath))) {
      throw new Error(`Refusing to remove a path that resolves outside the install roots: ${path}`);
    }
  }

  let removed = 0;
  for (const path of symlinkPaths) {
    await unlink(path);
    removed += 1;
  }
  for (const path of realPaths) {
    await rm(path, { force: true });
    removed += 1;
  }
  for (const path of [...symlinkPaths, ...realPaths].sort((a, b) => b.length - a.length)) {
    await pruneEmptyParents(path, roots);
  }
  return { removed, retainedShared: requestedPaths.length - paths.length };
}
