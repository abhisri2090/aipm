import type pg from "pg";
import type { MetadataStore } from "./metadata-store.js";
import type { BlobStorage } from "./storage.js";
import { setPackageGithubStars } from "./db.js";
import {
  buildGitHubTreeUrl,
  githubRequest,
  importSkillFromGitHubUrl,
  listGitHubSubfolders,
  parseGitHubFolderUrl,
  type ImportFromUrlResult,
} from "./import-from-github.js";

export const DEFAULT_BULK_IMPORT_MAX_SKILLS = 50;

export type BulkImportFromUrlResult = {
  parentUrl: string;
  orgName: string;
  subfolders: string[];
  results: Array<ImportFromUrlResult & { subfolder: string }>;
  summary: { published: number; skipped: number; failed: number };
  aborted?: { subfolder: string; error: string };
};

type GitHubRepoStars = { stargazers_count?: number };

async function fetchRepoStars(
  owner: string,
  repo: string,
  token: string | undefined,
  cache: Map<string, number | null>,
): Promise<number | null> {
  const key = `${owner}/${repo}`.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const meta = await githubRequest<GitHubRepoStars>(`/repos/${owner}/${repo}`, token);
    const stars =
      typeof meta.stargazers_count === "number" && Number.isFinite(meta.stargazers_count)
        ? Math.max(0, Math.floor(meta.stargazers_count))
        : null;
    cache.set(key, stars);
    return stars;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export async function bulkImportSkillsFromGitHubFolder(options: {
  pool: pg.Pool;
  metadata: MetadataStore;
  storage: BlobStorage;
  sourceUrl: string;
  orgName: string;
  githubToken?: string;
  maxSkills?: number;
}): Promise<BulkImportFromUrlResult> {
  const token = options.githubToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const parentUrl = options.sourceUrl.trim();
  const orgName = options.orgName.trim();
  const parsed = parseGitHubFolderUrl(parentUrl);
  const maxSkills = options.maxSkills ?? DEFAULT_BULK_IMPORT_MAX_SKILLS;

  const subfolders = await listGitHubSubfolders(parsed, token);
  if (subfolders.length > maxSkills) {
    throw new Error(`Too many subfolders (${subfolders.length}); max is ${maxSkills}`);
  }

  // One stars fetch per unique repo (bulk imports usually share a parent repo).
  const starsCache = new Map<string, number | null>();
  const parentStars = await fetchRepoStars(parsed.owner, parsed.repo, token, starsCache);

  const results: Array<ImportFromUrlResult & { subfolder: string }> = [];
  let published = 0;
  let skipped = 0;

  for (const subfolder of subfolders) {
    const childUrl = buildGitHubTreeUrl(parsed, subfolder);
    try {
      const result = await importSkillFromGitHubUrl({
        pool: options.pool,
        metadata: options.metadata,
        storage: options.storage,
        sourceUrl: childUrl,
        githubToken: token,
        orgName,
      });
      results.push({ ...result, subfolder });
      if (result.action === "published") {
        published += 1;
        if (parentStars !== null) {
          try {
            await setPackageGithubStars(options.pool, result.packageName, parentStars);
          } catch {
            // Stars can be filled later via admin sync.
          }
        }
      } else {
        skipped += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        parentUrl,
        orgName,
        subfolders,
        results,
        summary: { published, skipped, failed: 1 },
        aborted: { subfolder, error: message },
      };
    }
  }

  return {
    parentUrl,
    orgName,
    subfolders,
    results,
    summary: { published, skipped, failed: 0 },
  };
}
