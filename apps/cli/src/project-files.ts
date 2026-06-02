import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  LockfileSchema,
  ProjectPackageJsonSchema,
  type AiTool,
  type Lockfile,
  type LockfilePackageEntry,
  type ProjectPackageJson,
} from "@aipm-registry/schemas";

export type { ProjectPackageJson };

const PACKAGE_JSON = "aipm.package.json";
const LOCKFILE = "aipm-lock.json";

export async function readProjectPackageJson(
  projectRoot: string,
): Promise<ProjectPackageJson | null> {
  try {
    const raw = await readFile(join(projectRoot, PACKAGE_JSON), "utf8");
    return ProjectPackageJsonSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeProjectPackageJson(
  projectRoot: string,
  data: ProjectPackageJson,
): Promise<void> {
  await writeFile(
    join(projectRoot, PACKAGE_JSON),
    JSON.stringify(data, null, 2) + "\n",
    "utf8",
  );
}

export async function readLockfile(projectRoot: string): Promise<Lockfile | null> {
  try {
    const raw = await readFile(join(projectRoot, LOCKFILE), "utf8");
    return LockfileSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeLockfile(projectRoot: string, data: Lockfile): Promise<void> {
  await writeFile(join(projectRoot, LOCKFILE), JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function upsertLockEntry(
  lock: Lockfile,
  name: string,
  entry: LockfilePackageEntry,
): Lockfile {
  return {
    ...lock,
    packages: { ...lock.packages, [name]: entry },
  };
}

export function resolveRegistryUrl(
  project: ProjectPackageJson | null,
  flag?: string,
  fallback?: string,
): string {
  const fromEnv = process.env.AIPM_REGISTRY_URL ?? process.env.AIPM_REGISTRY;
  if (flag) return flag.replace(/\/$/, "");
  if (project?.registry) return project.registry.replace(/\/$/, "");
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (fallback) return fallback.replace(/\/$/, "");
  throw new Error("Registry URL required: set registry in aipm.package.json or AIPM_REGISTRY_URL");
}

export function parseTargetFlag(target?: string): AiTool | undefined {
  if (!target) return undefined;
  if (target === "cursor" || target === "claude") return target;
  throw new Error('--target must be "cursor" or "claude"');
}
