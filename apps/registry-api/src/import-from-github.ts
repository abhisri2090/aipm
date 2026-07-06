import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
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

const GITHUB_TREE_URL =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+?)\/?$/;
const GITHUB_BLOB_URL =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)\/?$/;

export type GitHubFolderRef = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
};

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
  const trimmed = url.trim();
  const treeMatch = trimmed.match(GITHUB_TREE_URL);
  const blobMatch = trimmed.match(GITHUB_BLOB_URL);
  const match = treeMatch ?? blobMatch;
  if (!match) {
    throw new Error(
      "Expected https://github.com/{owner}/{repo}/tree/{branch}/{path} or .../blob/{branch}/{path}",
    );
  }
  return {
    owner: match[1]!,
    repo: match[2]!,
    branch: match[3]!,
    path: normalizeGitHubFolderPath(match[4]!),
  };
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

export function computeContentHash(files: Record<string, string>): string {
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

type GitHubTreeEntry = { type: string; path: string; url: string };
type GitHubRef = { object: { sha: string } };
type GitHubTree = { tree: GitHubTreeEntry[] };
type GitHubBlob = { content: string; encoding: string };
type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  twitter_username?: string | null;
  html_url?: string | null;
};
type GitHubRepo = { license?: { spdx_id?: string } | null };
type GitHubContentEntry = {
  name: string;
  path: string;
  type: "file" | "dir" | "submodule" | "symlink";
};

export function buildGitHubTreeUrl(ref: GitHubFolderRef, subfolderName: string): string {
  const path = ref.path ? `${ref.path}/${subfolderName}` : subfolderName;
  return `https://github.com/${ref.owner}/${ref.repo}/tree/${ref.branch}/${path}`;
}

export async function listGitHubSubfolders(
  ref: GitHubFolderRef,
  token?: string,
): Promise<string[]> {
  const contentsPath = `/repos/${ref.owner}/${ref.repo}/contents/${ref.path}?ref=${encodeURIComponent(ref.branch)}`;
  const entries = await githubRequest<GitHubContentEntry[] | GitHubContentEntry>(
    contentsPath,
    token,
  );
  if (!Array.isArray(entries)) {
    throw new Error("URL points to a file, not a folder");
  }
  const dirs = entries.filter((entry) => entry.type === "dir").map((entry) => entry.name).sort();
  if (dirs.length === 0) {
    throw new Error("No subfolders found");
  }
  return dirs;
}

export async function fetchGitHubFolder(
  ref: GitHubFolderRef,
  token?: string,
): Promise<{ files: Record<string, string>; commitSha: string }> {
  const refData = await githubRequest<GitHubRef>(
    `/repos/${ref.owner}/${ref.repo}/git/ref/heads/${ref.branch}`,
    token,
  );
  const commitSha = refData.object.sha;
  const treeData = await githubRequest<GitHubTree>(
    `/repos/${ref.owner}/${ref.repo}/git/trees/${commitSha}?recursive=1`,
    token,
  );
  const prefix = `${ref.path.replace(/\/$/, "")}/`;
  const blobs = treeData.tree.filter(
    (entry) =>
      entry.type === "blob" && (entry.path === ref.path || entry.path.startsWith(prefix)),
  );
  const files: Record<string, string> = {};
  for (const blob of blobs) {
    const relativePath =
      blob.path === ref.path ? (blob.path.split("/").pop() ?? "") : blob.path.slice(prefix.length);
    if (!relativePath) continue;
    const contentResponse = await fetch(blob.url, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "User-Agent": "aipm-registry-import",
      },
    });
    if (!contentResponse.ok) {
      throw new Error(`Failed to download ${blob.path}: ${contentResponse.status}`);
    }
    const payload = (await contentResponse.json()) as GitHubBlob;
    files[relativePath] = Buffer.from(
      payload.content,
      payload.encoding === "base64" ? "base64" : "utf8",
    ).toString("utf8");
  }
  return { files, commitSha };
}

export function detectLicense(
  files: Record<string, string>,
  repoLicense?: { spdx_id?: string } | null,
): string {
  const licenseFile = Object.keys(files).find((name) => /^license/i.test(name));
  if (licenseFile) {
    const firstLine = files[licenseFile]?.split("\n")[0]?.trim();
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
  files: Record<string, string>,
): Promise<void> {
  for (const [name, content] of Object.entries(files)) {
    const filePath = join(dir, name);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
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
  const parsed = parseGitHubFolderUrl(options.sourceUrl);
  const folderName = parsed.path.split("/").pop() ?? "skill";
  const packageName = buildPackageName(options.orgName?.trim() || parsed.owner, folderName);

  const [{ files, commitSha }, user, repoMeta] = await Promise.all([
    fetchGitHubFolder(parsed, token),
    githubRequest<GitHubUser>(`/users/${parsed.owner}`, token),
    githubRequest<GitHubRepo>(`/repos/${parsed.owner}/${parsed.repo}`, token),
  ]);

  const entry = pickEntryFile(Object.keys(files));
  if (!entry) throw new Error("Could not find SKILL.md or README.md in folder");

  const frontmatter = parseFrontmatter(files[entry] ?? "");
  const readmeContent = files["README.md"] ?? files["readme.md"];
  const description = resolveDescription({
    frontmatter,
    readmeContent,
    fallbackName: folderName,
  });
  const agentDescription = resolveAgentDescription(files[entry]);
  const license = detectLicense(files, repoMeta.license);
  const contentHash = computeContentHash(files);

  const provenance = await getLatestProvenance(options.pool, packageName);
  const versions = await listPackageVersionsForName(options.pool, packageName);
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
