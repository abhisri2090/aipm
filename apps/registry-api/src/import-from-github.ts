import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { promisify } from "node:util";
import type pg from "pg";
import { getLatestProvenance, listPackageVersionsForName } from "./db.js";
import {
  importSkillPackage,
  type ImportAuthorPayload,
  type ImportProvenancePayload,
} from "./admin-import.js";
import { DuplicateVersionError } from "./metadata-store.js";
import type { MetadataStore } from "./metadata-store.js";
import type { BlobStorage } from "./storage.js";
import { normalizeUsernameCandidate } from "./aipm-username.js";

const execFileAsync = promisify(execFile);

const IMPORT_URL_HINT =
  "Expected a GitHub repo or folder URL, like https://github.com/owner/repo or https://github.com/owner/repo/tree/main/path/to/skill";

export type GitHubFolderRef = {
  owner: string;
  repo: string;
  /** Empty means the repository default branch, resolved before GitHub API calls. */
  branch: string;
  path: string;
};

export type GitHubImportMode = "skill" | "collection" | "peek-skills" | "empty";

export type ResolvedGitHubImport = {
  mode: "skill" | "collection";
  sourceUrl: string;
  ref: GitHubFolderRef;
};

export class GitHubSkillCollectionError extends Error {
  readonly sourceUrl: string;
  readonly owner: string;

  constructor(resolved: ResolvedGitHubImport) {
    super(`This GitHub URL contains multiple skills. Use bulk import with ${resolved.sourceUrl}`);
    this.name = "GitHubSkillCollectionError";
    this.sourceUrl = resolved.sourceUrl;
    this.owner = resolved.ref.owner;
  }
}

export class SkillAlreadyExistsError extends Error {
  readonly packageName: string;
  readonly version: string;

  constructor(packageName: string, version: string) {
    super(`Skill already exists: ${packageName}@${version}`);
    this.name = "SkillAlreadyExistsError";
    this.packageName = packageName;
    this.version = version;
  }
}

export function assertSkillNotImported(packageName: string, latestVersion: string | null): void {
  if (latestVersion) {
    throw new SkillAlreadyExistsError(packageName, latestVersion);
  }
}

function normalizeGitHubFolderPath(path: string): string {
  const cleaned = path.replace(/\/$/, "");
  const segments = cleaned.split("/");
  const last = segments[segments.length - 1] ?? "";
  if (/\.(md|markdown|txt|json|yaml|yml)$/i.test(last)) {
    return segments.slice(0, -1).join("/");
  }
  return cleaned;
}

export function parseGitHubFolderUrl(url: string): GitHubFolderRef {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error(IMPORT_URL_HINT);
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    throw new Error(IMPORT_URL_HINT);
  }
  const segments = parsed.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new Error(IMPORT_URL_HINT);
  }
  const owner = segments[0]!;
  let repo = segments[1]!;
  if (repo.toLowerCase().endsWith(".git")) {
    repo = repo.slice(0, -4);
  }
  const rest = segments.slice(2);
  if (rest.length === 0) {
    return { owner, repo, branch: "", path: "" };
  }
  if ((rest[0] === "tree" || rest[0] === "blob") && rest[1]) {
    return {
      owner,
      repo,
      branch: rest[1],
      path: normalizeGitHubFolderPath(rest.slice(2).join("/")),
    };
  }
  throw new Error(IMPORT_URL_HINT);
}

export function toGitHubTreeUrl(ref: GitHubFolderRef): string {
  const base = `https://github.com/${ref.owner}/${ref.repo}/tree/${ref.branch}`;
  return ref.path ? `${base}/${ref.path}` : base;
}

export function decideGitHubImportMode(
  entries: Array<{ name: string; type: string }>,
): GitHubImportMode {
  const files = new Set(
    entries.filter((entry) => entry.type === "file").map((entry) => entry.name.toLowerCase()),
  );
  const dirs = new Set(
    entries.filter((entry) => entry.type === "dir").map((entry) => entry.name.toLowerCase()),
  );
  if (files.has("skill.md")) return "skill";
  if (dirs.has("skills")) return "peek-skills";
  if (files.has("readme.md")) return "skill";
  if (dirs.size > 0) return "collection";
  return "empty";
}

export function folderBlobRelativePath(blobPath: string, folderPath: string): string | null {
  const normalizedFolder = folderPath.replace(/\/$/, "");
  if (!normalizedFolder) return blobPath || null;
  if (blobPath === normalizedFolder) {
    return blobPath.split("/").pop() ?? null;
  }
  const prefix = `${normalizedFolder}/`;
  if (blobPath.startsWith(prefix)) return blobPath.slice(prefix.length);
  return null;
}

function githubContentsApiPath(ref: GitHubFolderRef): string {
  const encodedRef = encodeURIComponent(ref.branch);
  if (!ref.path) {
    return `/repos/${ref.owner}/${ref.repo}/contents?ref=${encodedRef}`;
  }
  return `/repos/${ref.owner}/${ref.repo}/contents/${ref.path}?ref=${encodedRef}`;
}

export function normalizeSkillSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");
  return normalized || "skill";
}

export function buildPackageName(owner: string, folderName: string): string {
  const orgSlug = normalizeUsernameCandidate(owner);
  const skillSlug = normalizeSkillSlug(folderName);
  return `@${orgSlug}/${skillSlug}`;
}

export function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {};
  const fields: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }
  return fields;
}

export function pickEntryFile(fileNames: string[]): string | null {
  const lower = new Map(fileNames.map((name) => [name.toLowerCase(), name]));
  return lower.get("skill.md") ?? lower.get("readme.md") ?? null;
}

export function resolveDescription(options: {
  frontmatter: Record<string, string>;
  readmeContent?: string;
  fallbackName: string;
}): string {
  let description: string;
  if (options.frontmatter.description?.trim()) {
    description = options.frontmatter.description.trim();
  } else if (options.frontmatter.name?.trim()) {
    description = options.frontmatter.name.trim();
  } else if (options.readmeContent) {
    const stripped = options.readmeContent.replace(/^---[\s\S]*?---\s*/m, "").trim();
    const firstLine = stripped.split("\n").find((line) => line.trim());
    description = firstLine ? firstLine.replace(/^#\s*/, "").trim() : options.fallbackName;
  } else {
    description = options.fallbackName;
  }
  return truncateDescription(description);
}

const MAX_DESCRIPTION_CHARS = 240;

export function truncateDescription(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= MAX_DESCRIPTION_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_CHARS - 3).trimEnd()}...`;
}

const MAX_AGENT_DESCRIPTION_CHARS = 12000;

export function resolveAgentDescription(entryContent?: string): string | undefined {
  if (!entryContent) return undefined;
  const body = entryContent.replace(/^---[\s\S]*?---\r?\n?/, "").trim();
  if (!body) return undefined;
  if (body.length <= MAX_AGENT_DESCRIPTION_CHARS) return body;
  return `${body.slice(0, MAX_AGENT_DESCRIPTION_CHARS - 3).trimEnd()}...`;
}

export function computeContentHash(files: Record<string, string | Buffer>): string {
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));
  const hash = createHash("sha256");
  for (const [path, content] of entries) {
    hash.update(path);
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function nextPatchVersion(latestVersion: string | null): string {
  if (!latestVersion) return "1.0.0";
  const match = latestVersion.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return "1.0.0";
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function resolveImportVersion(options: {
  latestVersion: string | null;
  latestContentHash: string | null;
  contentHash: string;
}): { action: "skip" | "publish"; version: string | null } {
  if (options.latestContentHash && options.latestContentHash === options.contentHash) {
    return { action: "skip", version: options.latestVersion };
  }
  return { action: "publish", version: nextPatchVersion(options.latestVersion) };
}

async function githubRequest<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "User-Agent": "aipm-registry-import",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

type GitHubRef = { object: { sha: string } };
type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  twitter_username?: string | null;
  html_url?: string | null;
};
type GitHubRepo = { default_branch?: string; license?: { spdx_id?: string } | null };
type GitHubContentEntry = {
  name: string;
  path: string;
  type: "file" | "dir" | "submodule" | "symlink";
};

export function buildGitHubTreeUrl(ref: GitHubFolderRef, subfolderName: string): string {
  const path = ref.path ? `${ref.path}/${subfolderName}` : subfolderName;
  return `https://github.com/${ref.owner}/${ref.repo}/tree/${ref.branch}/${path}`;
}

async function resolveDefaultBranch(ref: GitHubFolderRef, token?: string): Promise<GitHubFolderRef> {
  if (ref.branch) return ref;
  const repo = await githubRequest<GitHubRepo>(`/repos/${ref.owner}/${ref.repo}`, token);
  const branch = repo.default_branch?.trim();
  if (!branch) {
    throw new Error("Could not resolve the repository default branch");
  }
  return { ...ref, branch };
}

export async function listGitHubFolderEntries(
  ref: GitHubFolderRef,
  token?: string,
): Promise<GitHubContentEntry[]> {
  const entries = await githubRequest<GitHubContentEntry[] | GitHubContentEntry>(
    githubContentsApiPath(ref),
    token,
  );
  if (!Array.isArray(entries)) {
    throw new Error("URL points to a file, not a folder");
  }
  return entries;
}

export async function resolveGitHubSkillImport(
  sourceUrl: string,
  token?: string,
): Promise<ResolvedGitHubImport> {
  let ref = await resolveDefaultBranch(parseGitHubFolderUrl(sourceUrl), token);
  let entries = await listGitHubFolderEntries(ref, token);
  let mode = decideGitHubImportMode(entries);
  if (mode === "peek-skills") {
    ref = { ...ref, path: ref.path ? `${ref.path.replace(/\/$/, "")}/skills` : "skills" };
    entries = await listGitHubFolderEntries(ref, token);
    mode = decideGitHubImportMode(entries);
    if (mode === "peek-skills") mode = "collection";
  }
  if (mode === "empty") {
    throw new Error("Could not find SKILL.md, README.md, or a skills/ folder");
  }
  return {
    mode: mode === "collection" ? "collection" : "skill",
    sourceUrl: toGitHubTreeUrl(ref),
    ref,
  };
}

export async function listGitHubSubfolders(
  ref: GitHubFolderRef,
  token?: string,
): Promise<string[]> {
  const dirs = (await listGitHubFolderEntries(ref, token))
    .filter((entry) => entry.type === "dir")
    .map((entry) => entry.name)
    .sort();
  if (dirs.length === 0) {
    throw new Error("No subfolders found");
  }
  return dirs;
}

async function resolveCommitSha(
  ref: GitHubFolderRef,
  token?: string,
): Promise<string> {
  try {
    const refData = await githubRequest<GitHubRef>(
      `/repos/${ref.owner}/${ref.repo}/git/ref/heads/${ref.branch}`,
      token,
    );
    if (refData.object?.sha) return refData.object.sha;
  } catch {
    // Fall through to git ls-remote when the REST API is rate-limited.
  }

  const remote = `https://github.com/${ref.owner}/${ref.repo}.git`;
  const { stdout } = await execFileAsync(
    "git",
    ["ls-remote", remote, `refs/heads/${ref.branch}`],
    { maxBuffer: 1024 * 1024 },
  );
  const sha = stdout.trim().split(/\s+/)[0];
  if (!sha || !/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error(`Could not resolve commit for ${ref.owner}/${ref.repo}@${ref.branch}`);
  }
  return sha;
}

export async function fetchGitHubFolder(
  ref: GitHubFolderRef,
  token?: string,
): Promise<{ files: Record<string, Buffer>; commitSha: string }> {
  const resolved = await resolveDefaultBranch(ref, token);
  const commitSha = await resolveCommitSha(resolved, token);
  const response = await fetch(
    `https://codeload.github.com/${resolved.owner}/${resolved.repo}/tar.gz/${commitSha}`,
    {
      headers: {
        "User-Agent": "aipm-registry-import",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      redirect: "follow",
    },
  );
  if (!response.ok) {
    throw new Error(
      `GitHub archive download for ${resolved.owner}/${resolved.repo}@${commitSha} failed: ${response.status}`,
    );
  }
  const tarball = Buffer.from(await response.arrayBuffer());
  const files = await extractFilesFromGitHubTarball(tarball, resolved.path);
  return { files, commitSha };
}

export async function extractFilesFromGitHubTarball(
  tarball: Buffer,
  folderPath: string,
): Promise<Record<string, Buffer>> {
  const tempDir = await mkdtemp(join(tmpdir(), "aipm-gh-tar-"));
  const tgzPath = join(tempDir, "repo.tgz");
  try {
    await writeFile(tgzPath, tarball);
    await execFileAsync("tar", ["-xzf", tgzPath, "-C", tempDir]);

    async function walk(dir: string): Promise<string[]> {
      const entries = await readdir(dir, { withFileTypes: true });
      const paths: string[] = [];
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          paths.push(...(await walk(full)));
        } else if (entry.isFile()) {
          paths.push(full);
        }
      }
      return paths;
    }

    const allFiles = await walk(tempDir);
    const files: Record<string, Buffer> = {};
    for (const fullPath of allFiles) {
      if (fullPath === tgzPath) continue;
      const relativeFromTemp = fullPath.slice(tempDir.length + 1);
      const slash = relativeFromTemp.indexOf("/");
      if (slash === -1) continue;
      const repoRelative = relativeFromTemp.slice(slash + 1);
      const relativePath = folderBlobRelativePath(repoRelative, folderPath);
      if (!relativePath) continue;
      const fileStat = await stat(fullPath);
      if (!fileStat.isFile()) continue;
      files[relativePath] = await readFile(fullPath);
    }
    return files;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export function detectLicense(
  files: Record<string, string | Buffer>,
  repoLicense?: { spdx_id?: string } | null,
): string {
  const licenseFile = Object.keys(files).find((name) => /^license/i.test(name));
  if (licenseFile) {
    const raw = files[licenseFile];
    const text = raw == null ? "" : Buffer.isBuffer(raw) ? raw.toString("utf8") : raw;
    const firstLine = text.split("\n")[0]?.trim();
    if (firstLine) return firstLine.replace(/\s+/g, " ");
  }
  if (repoLicense?.spdx_id && repoLicense.spdx_id !== "NOASSERTION") {
    return repoLicense.spdx_id;
  }
  return "Apache-2.0";
}

async function packDirectory(dir: string): Promise<Buffer> {
  const { stdout } = await execFileAsync("tar", ["-czf", "-", "-C", dir, "."], {
    maxBuffer: 50 * 1024 * 1024,
    encoding: "buffer",
  });
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

export async function writeImportedFilesToDirectory(
  dir: string,
  files: Record<string, string | Buffer>,
): Promise<void> {
  for (const [name, content] of Object.entries(files)) {
    const filePath = join(dir, name);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  }
}

export type ImportFromUrlResult =
  | {
      action: "skipped";
      sourceUrl: string;
      packageName: string;
      version: string | null;
      contentHash: string;
    }
  | {
      action: "published";
      sourceUrl: string;
      packageName: string;
      version: string;
      contentHash: string;
      integrity: string;
      userId: string;
    };

export async function importSkillFromGitHubUrl(options: {
  pool: pg.Pool;
  metadata: MetadataStore;
  storage: BlobStorage;
  sourceUrl: string;
  githubToken?: string;
  orgName?: string;
}): Promise<ImportFromUrlResult> {
  const token = options.githubToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const resolved = await resolveGitHubSkillImport(options.sourceUrl, token);
  if (resolved.mode === "collection") {
    throw new GitHubSkillCollectionError(resolved);
  }
  const parsed = resolved.ref;
  const folderName = parsed.path ? (parsed.path.split("/").pop() ?? parsed.repo) : parsed.repo;
  const packageName = buildPackageName(options.orgName?.trim() || parsed.owner, folderName);
  const versions = await listPackageVersionsForName(options.pool, packageName);
  assertSkillNotImported(packageName, versions[0]?.version ?? null);

  const [{ files, commitSha }, user, repoMeta] = await Promise.all([
    fetchGitHubFolder(parsed, token),
    githubRequest<GitHubUser>(`/users/${parsed.owner}`, token),
    githubRequest<GitHubRepo>(`/repos/${parsed.owner}/${parsed.repo}`, token),
  ]);

  const entry = pickEntryFile(Object.keys(files));
  if (!entry) throw new Error("Could not find SKILL.md or README.md in folder");

  const entryText = files[entry]?.toString("utf8") ?? "";
  const frontmatter = parseFrontmatter(entryText);
  const readmeContent =
    files["README.md"]?.toString("utf8") ?? files["readme.md"]?.toString("utf8");
  const description = resolveDescription({
    frontmatter,
    readmeContent,
    fallbackName: folderName,
  });
  const agentDescription = resolveAgentDescription(entryText);
  const license = detectLicense(files, repoMeta.license);
  const contentHash = computeContentHash(files);

  const provenance = await getLatestProvenance(options.pool, packageName);
  const versionDecision = resolveImportVersion({
    latestVersion: versions[0]?.version ?? null,
    latestContentHash: provenance?.content_hash ?? null,
    contentHash,
  });

  if (versionDecision.action === "skip") {
    return {
      action: "skipped",
      sourceUrl: options.sourceUrl,
      packageName,
      version: versionDecision.version,
      contentHash,
    };
  }

  const tempDir = await mkdtemp(join(tmpdir(), "aipm-import-"));
  try {
    await writeImportedFilesToDirectory(tempDir, files);
    await writeFile(
      join(tempDir, "aipm.manifest.json"),
      `${JSON.stringify(
        {
          schemaVersion: "0.1",
          name: packageName,
          version: versionDecision.version,
          type: "skill",
          description,
          entry,
          targets: ["*"],
          license,
          ...(agentDescription ? { agentDescription } : {}),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const tarball = await packDirectory(tempDir);
    const author: ImportAuthorPayload = {
      githubId: String(user.id),
      githubLogin: user.login,
      name: user.name ?? null,
      avatarUrl: user.avatar_url ?? null,
      email: user.email ?? null,
      xHandle: user.twitter_username ?? null,
      githubUrl: user.html_url ?? null,
    };
    const provenancePayload: ImportProvenancePayload = {
      sourceUrl: options.sourceUrl,
      commitSha,
      license,
      contentHash,
    };

    try {
      const result = await importSkillPackage({
        pool: options.pool,
        metadata: options.metadata,
        storage: options.storage,
        tarball,
        author,
        provenance: provenancePayload,
      });
      return {
        action: "published",
        sourceUrl: options.sourceUrl,
        packageName: result.name,
        version: result.version,
        contentHash,
        integrity: result.integrity,
        userId: result.userId,
      };
    } catch (error) {
      if (error instanceof DuplicateVersionError) {
        throw error;
      }
      throw error;
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
