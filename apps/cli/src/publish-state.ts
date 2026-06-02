import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, normalize, relative, resolve, sep } from "node:path";
import { PackageManifestSchema, type PackageManifest } from "@aipm-registry/schemas";

export type PublishStateEntry = {
  path: string;
  hash: string;
  size: number;
};

export type PublishState = {
  schemaVersion: "0.1";
  files: PublishStateEntry[];
};

const STATE_PATH = join(".aipm", "publish-state.json");
const MAX_PACKAGE_BYTES = 50 * 1024 * 1024;
const EXCLUDED_SEGMENTS = new Set([".aipm", ".git", "node_modules", "dist", ".next"]);
const EXCLUDED_SUFFIXES = [".log", ".pem", ".key", ".pfx", ".p12", ".publishsettings"];
const EXCLUDED_NAMES = new Set([".env", ".env.local", ".env.production", ".env.development"]);

export function publishStatePath(root: string): string {
  return join(root, STATE_PATH);
}

export function normalizePublishPath(root: string, filePath: string): string {
  const abs = resolve(root, filePath);
  const rel = normalize(relative(root, abs)).split(sep).join("/");
  if (!rel || rel === ".") return ".";
  if (rel.startsWith("../") || rel === ".." || rel.startsWith("/")) {
    throw new Error(`Path is outside the skill folder: ${filePath}`);
  }
  if (rel.includes("/../")) throw new Error(`Unsafe path: ${filePath}`);
  return rel;
}

export function isExcludedPublishPath(rel: string): boolean {
  const segments = rel.split("/");
  if (segments.some((segment) => EXCLUDED_SEGMENTS.has(segment))) return true;
  const name = segments[segments.length - 1] ?? rel;
  if (EXCLUDED_NAMES.has(name) || name.startsWith(".env.")) return true;
  return EXCLUDED_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

async function fileHash(path: string): Promise<{ hash: string; size: number }> {
  const data = await readFile(path);
  return {
    hash: createHash("sha256").update(data).digest("hex"),
    size: data.length,
  };
}

export async function readPublishState(root: string): Promise<PublishState> {
  try {
    const raw = await readFile(publishStatePath(root), "utf8");
    const parsed = JSON.parse(raw) as PublishState;
    return {
      schemaVersion: "0.1",
      files: Array.isArray(parsed.files) ? parsed.files : [],
    };
  } catch {
    return { schemaVersion: "0.1", files: [] };
  }
}

export async function writePublishState(root: string, state: PublishState): Promise<void> {
  const path = publishStatePath(root);
  await mkdir(dirname(path), { recursive: true });
  const files = [...state.files].sort((a, b) => a.path.localeCompare(b.path));
  await writeFile(path, JSON.stringify({ schemaVersion: "0.1", files }, null, 2) + "\n", "utf8");
}

async function expandPublishPath(root: string, rel: string): Promise<string[]> {
  if (isExcludedPublishPath(rel)) return [];
  const abs = join(root, rel);
  const info = await stat(abs);
  if (info.isFile()) return [rel];
  if (!info.isDirectory()) return [];
  const entries = await readdir(abs);
  const nested = await Promise.all(
    entries.map((entry) => expandPublishPath(root, `${rel === "." ? "" : `${rel}/`}${entry}`)),
  );
  return nested.flat();
}

export async function addPublishFiles(root: string, paths: string[]): Promise<PublishState> {
  const state = await readPublishState(root);
  const byPath = new Map(state.files.map((entry) => [entry.path, entry]));
  const inputs = paths.length > 0 ? paths : ["."];

  for (const input of inputs) {
    const normalized = normalizePublishPath(root, input);
    const files = await expandPublishPath(root, normalized);
    for (const rel of files) {
      if (isExcludedPublishPath(rel)) continue;
      const hashed = await fileHash(join(root, rel));
      byPath.set(rel, { path: rel, ...hashed });
    }
  }

  const next = { schemaVersion: "0.1" as const, files: [...byPath.values()] };
  await writePublishState(root, next);
  return next;
}

export async function removePublishFiles(root: string, paths: string[]): Promise<PublishState> {
  const state = await readPublishState(root);
  const removeSet = new Set(paths.map((path) => normalizePublishPath(root, path)));
  const next = {
    schemaVersion: "0.1" as const,
    files: state.files.filter((entry) => !removeSet.has(entry.path)),
  };
  await writePublishState(root, next);
  return next;
}

export async function resetPublishState(root: string): Promise<void> {
  await rm(publishStatePath(root), { force: true });
}

export async function readManifest(root: string): Promise<PackageManifest> {
  const raw = await readFile(join(root, "aipm.manifest.json"), "utf8");
  return PackageManifestSchema.parse(JSON.parse(raw));
}

export async function validatePublishState(root: string): Promise<{ manifest: PackageManifest; size: number }> {
  const manifest = await readManifest(root);
  const state = await readPublishState(root);
  if (state.files.length === 0) throw new Error("No files staged. Run aipm publish add <files...>.");
  const staged = new Set(state.files.map((entry) => entry.path));
  if (!staged.has("aipm.manifest.json")) throw new Error("aipm.manifest.json must be staged.");
  if (!staged.has(manifest.entry)) throw new Error(`Manifest entry must be staged: ${manifest.entry}`);

  let size = 0;
  for (const entry of state.files) {
    if (isExcludedPublishPath(entry.path)) throw new Error(`Refusing to publish excluded path: ${entry.path}`);
    const abs = join(root, entry.path);
    const info = await stat(abs).catch(() => null);
    if (!info?.isFile()) throw new Error(`Staged file is missing: ${entry.path}`);
    const hashed = await fileHash(abs);
    size += hashed.size;
  }
  if (size > MAX_PACKAGE_BYTES) throw new Error("Package exceeds 50 MB limit.");
  return { manifest, size };
}

export async function statusPublishState(root: string): Promise<Array<PublishStateEntry & { changed: boolean }>> {
  const state = await readPublishState(root);
  const rows = [];
  for (const entry of state.files) {
    const current = await fileHash(join(root, entry.path)).catch(() => null);
    rows.push({ ...entry, changed: !current || current.hash !== entry.hash });
  }
  return rows;
}

export async function copyStagedFiles(root: string, destination: string): Promise<void> {
  const state = await readPublishState(root);
  for (const entry of state.files) {
    const target = join(destination, entry.path);
    await mkdir(dirname(target), { recursive: true });
    await cp(join(root, entry.path), target);
  }
}
