import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type pg from "pg";
import { PackageManifestSchema, parseScopeName, type PackageManifest } from "@aipm-registry/schemas";
import {
  publishImportedSkillForOrg,
  type ImportProvenancePayload,
} from "./admin-import.js";
import {
  getLatestProvenance,
  getPackageReservationByName,
  getOrgBySlug,
  listPackageVersionsForName,
  type PackageVisibility,
  type UserRow,
} from "./db.js";
import {
  buildPackageName,
  computeContentHash,
  detectLicense,
  fetchGitHubFolder,
  githubRequest,
  nextPatchVersion,
  parseFrontmatter,
  resolveAgentDescription,
  resolveDescription,
  resolveGitHubSkillImport,
  toGitHubTreeUrl,
  writeImportedFilesToDirectory,
  type GitHubFolderRef,
} from "./import-from-github.js";
import type { MetadataStore } from "./metadata-store.js";
import { DuplicateVersionError } from "./metadata-store.js";
import type { BlobStorage } from "./storage.js";

const execFileAsync = promisify(execFile);

export const UPDATE_NOTICE =
  "This skill is already on AIPM under this name. We'll publish a new version so the current one stays available. You can change the version or the package name before you import.";

export class UserGithubImportError extends Error {
  readonly code: string;
  readonly status: number;
  readonly files?: string[];

  constructor(code: string, message: string, status = 400, files?: string[]) {
    super(message);
    this.name = "UserGithubImportError";
    this.code = code;
    this.status = status;
    this.files = files;
  }
}

type GitHubRepoMeta = {
  private?: boolean;
  default_branch?: string;
  license?: { spdx_id?: string } | null;
  owner?: { login?: string; type?: string };
  permissions?: { admin?: boolean; push?: boolean; pull?: boolean };
};

export function assertPublicRepoImportAllowed(options: {
  repo: GitHubRepoMeta;
  githubLogin: string;
}): void {
  if (options.repo.private) {
    throw new UserGithubImportError(
      "private_repo",
      "Only public GitHub repositories can be imported.",
      400,
    );
  }
  const ownerLogin = options.repo.owner?.login?.toLowerCase() ?? "";
  const userLogin = options.githubLogin.toLowerCase();
  if (ownerLogin === userLogin) return;
  if (options.repo.permissions?.admin === true) return;
  throw new UserGithubImportError(
    "not_repo_admin",
    "You can only import public repos you own or admin.",
    403,
  );
}

export async function loadPublicRepoForImport(
  ref: Pick<GitHubFolderRef, "owner" | "repo">,
  userToken?: string,
): Promise<GitHubRepoMeta> {
  const token = userToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  try {
    const repo = await githubRequest<GitHubRepoMeta>(`/repos/${ref.owner}/${ref.repo}`, token);
    if (repo.private) {
      throw new UserGithubImportError("private_repo", "Only public GitHub repositories can be imported.", 400);
    }
    return repo;
  } catch (error) {
    if (error instanceof UserGithubImportError) throw error;
    throw new UserGithubImportError(
      "repo_not_found",
      "Public GitHub repository not found. Use a public repo or folder URL.",
      400,
    );
  }
}

function rootFileNames(files: Record<string, Buffer>): string[] {
  return Object.keys(files)
    .filter((name) => !name.includes("/"))
    .sort((a, b) => a.localeCompare(b));
}

export function resolveUserEntry(options: {
  rootFiles: string[];
  requestedEntry?: string;
}): string {
  const lower = new Map(options.rootFiles.map((name) => [name.toLowerCase(), name]));
  const skillMd = lower.get("skill.md");
  if (skillMd) return skillMd;

  if (!options.requestedEntry?.trim()) {
    throw new UserGithubImportError(
      "entry_required",
      "No SKILL.md found. Pick the entry file for this skill.",
      400,
      options.rootFiles,
    );
  }

  const match = lower.get(options.requestedEntry.trim().toLowerCase());
  if (!match) {
    throw new UserGithubImportError(
      "invalid_entry",
      "Entry file must be one of the files in this folder.",
      400,
      options.rootFiles,
    );
  }
  return match;
}

async function packDirectory(dir: string): Promise<Buffer> {
  const { stdout } = await execFileAsync("tar", ["-czf", "-", "-C", dir, "."], {
    maxBuffer: 50 * 1024 * 1024,
    encoding: "buffer",
  });
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

function defaultPackageName(orgSlug: string, ref: GitHubFolderRef): string {
  const folderName = ref.path ? (ref.path.split("/").pop() ?? ref.repo) : ref.repo;
  return buildPackageName(orgSlug, folderName);
}

export type UserGithubImportPreview = {
  sourceUrl: string;
  commitSha: string;
  entry: string;
  files: string[];
  packageName: string;
  existingVersion: string | null;
  updateNotice: string | null;
  manifest: PackageManifest;
  visibility: PackageVisibility;
  provenance: { license: string; contentHash: string };
};

export async function previewUserGithubImport(options: {
  pool: pg.Pool;
  orgSlug: string;
  sourceUrl: string;
  entry?: string;
  githubLogin: string;
  githubToken?: string;
}): Promise<UserGithubImportPreview> {
  const token = options.githubToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const resolved = await resolveGitHubSkillImport(options.sourceUrl, token);
  if (resolved.mode === "collection") {
    throw new UserGithubImportError(
      "collection_not_supported",
      "This URL has more than one skill. Paste a folder that contains a single skill (with SKILL.md), or pick one skill folder.",
      400,
    );
  }

  const repo = await loadPublicRepoForImport(resolved.ref, token);
  assertPublicRepoImportAllowed({ repo, githubLogin: options.githubLogin });

  const { files, commitSha } = await fetchGitHubFolder(resolved.ref, token);
  const rootFiles = rootFileNames(files);
  if (rootFiles.length === 0) {
    throw new UserGithubImportError("empty_folder", "No files found in this GitHub folder.", 400);
  }

  const entry = resolveUserEntry({ rootFiles, requestedEntry: options.entry });
  const entryText = files[entry]?.toString("utf8") ?? "";
  const frontmatter = parseFrontmatter(entryText);
  const readmeContent =
    files["README.md"]?.toString("utf8") ?? files["readme.md"]?.toString("utf8");
  const folderName = resolved.ref.path
    ? (resolved.ref.path.split("/").pop() ?? resolved.ref.repo)
    : resolved.ref.repo;
  const description = resolveDescription({
    frontmatter,
    readmeContent,
    fallbackName: folderName,
  });
  const agentDescription = resolveAgentDescription(entryText);
  const license = detectLicense(files, repo.license);
  const contentHash = computeContentHash(files);
  const packageName = defaultPackageName(options.orgSlug, resolved.ref);

  const org = await getOrgBySlug(options.pool, options.orgSlug);
  if (!org) throw new UserGithubImportError("org_not_found", "Org not found", 404);

  const reservation = await getPackageReservationByName(options.pool, packageName);
  let existingVersion: string | null = null;
  let updateNotice: string | null = null;
  let visibility: PackageVisibility = org.default_package_visibility;
  if (reservation && reservation.org_id === org.id) {
    const versions = await listPackageVersionsForName(options.pool, packageName);
    existingVersion = versions[0]?.version ?? null;
    updateNotice = UPDATE_NOTICE;
    visibility = reservation.visibility;
  }

  const version = nextPatchVersion(existingVersion);
  const manifest = PackageManifestSchema.parse({
    schemaVersion: "0.1",
    name: packageName,
    version,
    type: "skill",
    description,
    entry,
    targets: ["*"],
    license,
    ...(agentDescription ? { agentDescription } : {}),
    sourceUrl: toGitHubTreeUrl(resolved.ref),
  });

  return {
    sourceUrl: toGitHubTreeUrl(resolved.ref),
    commitSha,
    entry,
    files: rootFiles,
    packageName,
    existingVersion,
    updateNotice,
    manifest,
    visibility,
    provenance: { license, contentHash },
  };
}

export async function confirmUserGithubImport(options: {
  pool: pg.Pool;
  metadata: MetadataStore;
  storage: BlobStorage;
  user: UserRow;
  orgSlug: string;
  sourceUrl: string;
  entry?: string;
  commitSha: string;
  manifest: unknown;
  visibility?: PackageVisibility;
  githubToken?: string;
}): Promise<{
  packageName: string;
  version: string;
  sourceUrl: string;
  contentHash: string;
  integrity: string;
  isUpdate: boolean;
}> {
  if (!options.user.github_login) {
    throw new UserGithubImportError("github_required", "Connect GitHub before importing.", 403);
  }

  const token = options.githubToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const resolved = await resolveGitHubSkillImport(options.sourceUrl, token);
  if (resolved.mode === "collection") {
    throw new UserGithubImportError(
      "collection_not_supported",
      "This URL has more than one skill. Paste a folder that contains a single skill.",
      400,
    );
  }

  const repo = await loadPublicRepoForImport(resolved.ref, token);
  assertPublicRepoImportAllowed({ repo, githubLogin: options.user.github_login });

  const { files, commitSha } = await fetchGitHubFolder(resolved.ref, token);
  if (commitSha !== options.commitSha) {
    throw new UserGithubImportError(
      "source_changed",
      "The GitHub folder changed since preview. Preview again, then import.",
      409,
    );
  }

  const rootFiles = rootFileNames(files);
  const entry = resolveUserEntry({ rootFiles, requestedEntry: options.entry });

  const parsedManifest = PackageManifestSchema.parse(options.manifest);
  const scope = parseScopeName(parsedManifest.name).scope;
  if (scope !== options.orgSlug) {
    throw new UserGithubImportError(
      "invalid_scope",
      `Package name must use @${options.orgSlug}/...`,
      400,
    );
  }
  if (parsedManifest.entry !== entry) {
    throw new UserGithubImportError(
      "entry_mismatch",
      `Manifest entry must be ${entry}.`,
      400,
    );
  }
  if (!files[entry]) {
    throw new UserGithubImportError("invalid_entry", "Entry file missing from GitHub folder.", 400);
  }

  const versions = await listPackageVersionsForName(options.pool, parsedManifest.name);
  if (versions.some((row) => row.version === parsedManifest.version)) {
    throw new UserGithubImportError(
      "version_exists",
      `Version ${parsedManifest.version} already exists. Choose a new version.`,
      409,
    );
  }

  const reservation = await getPackageReservationByName(options.pool, parsedManifest.name);
  const org = await getOrgBySlug(options.pool, options.orgSlug);
  if (!org) throw new UserGithubImportError("org_not_found", "Org not found", 404);
  if (reservation && reservation.org_id !== org.id) {
    throw new UserGithubImportError(
      "name_taken",
      "That package name is reserved by another organization. Choose a different name.",
      409,
    );
  }

  const contentHash = computeContentHash(files);
  const license = parsedManifest.license ?? detectLicense(files, repo.license);
  const provenance: ImportProvenancePayload = {
    sourceUrl: toGitHubTreeUrl(resolved.ref),
    commitSha,
    license,
    contentHash,
  };

  const tempDir = await mkdtemp(join(tmpdir(), "aipm-user-import-"));
  try {
    await writeImportedFilesToDirectory(tempDir, files);
    const manifestToWrite: PackageManifest = {
      ...parsedManifest,
      schemaVersion: "0.1",
      type: "skill",
      entry,
      sourceUrl: parsedManifest.sourceUrl ?? toGitHubTreeUrl(resolved.ref),
    };
    await writeFile(join(tempDir, "aipm.manifest.json"), `${JSON.stringify(manifestToWrite, null, 2)}\n`, "utf8");
    const tarball = await packDirectory(tempDir);

    try {
      const published = await publishImportedSkillForOrg({
        pool: options.pool,
        metadata: options.metadata,
        storage: options.storage,
        tarball,
        user: options.user,
        orgSlug: options.orgSlug,
        visibility: options.visibility,
        provenance,
      });
      return {
        packageName: published.name,
        version: published.version,
        sourceUrl: provenance.sourceUrl,
        contentHash,
        integrity: published.integrity,
        isUpdate: published.isUpdate,
      };
    } catch (error) {
      if (error instanceof DuplicateVersionError) {
        throw new UserGithubImportError(
          "version_exists",
          error.message,
          409,
        );
      }
      if (error instanceof Error && /reserved by another/i.test(error.message)) {
        throw new UserGithubImportError("name_taken", error.message, 409);
      }
      throw error;
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

/** Exported for tests — avoid unused import lint on getLatestProvenance in some builds. */
export async function latestContentHash(pool: pg.Pool, packageName: string): Promise<string | null> {
  const provenance = await getLatestProvenance(pool, packageName);
  return provenance?.content_hash ?? null;
}
