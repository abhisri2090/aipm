import type pg from "pg";
import {
  listPackagesForGithubStarsSync,
  setPackageGithubStarsForNames,
  type GithubStarsSyncMode,
} from "./db.js";
import { githubRequest, parseGitHubFolderUrl } from "./import-from-github.js";

export type GithubStarsSyncError = {
  repo: string;
  message: string;
};

export type GithubStarsSyncResult = {
  updated: number;
  reposFetched: number;
  errors: GithubStarsSyncError[];
};

type GitHubRepoStars = { stargazers_count?: number };

function isRateLimited(message: string): boolean {
  return /\b(403|429)\b/.test(message);
}

export async function syncGithubStarsForPackages(options: {
  pool: pg.Pool;
  mode: GithubStarsSyncMode;
  githubToken?: string;
}): Promise<GithubStarsSyncResult> {
  const token = options.githubToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const packages = await listPackagesForGithubStarsSync(options.pool, options.mode);

  const byRepo = new Map<string, { owner: string; repo: string; names: string[] }>();
  const errors: GithubStarsSyncError[] = [];

  for (const pkg of packages) {
    try {
      const ref = parseGitHubFolderUrl(pkg.source_url);
      const key = `${ref.owner}/${ref.repo}`.toLowerCase();
      const existing = byRepo.get(key);
      if (existing) {
        existing.names.push(pkg.name);
      } else {
        byRepo.set(key, { owner: ref.owner, repo: ref.repo, names: [pkg.name] });
      }
    } catch (error) {
      errors.push({
        repo: pkg.source_url,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let updated = 0;
  let reposFetched = 0;

  for (const [key, group] of byRepo) {
    try {
      const meta = await githubRequest<GitHubRepoStars>(`/repos/${group.owner}/${group.repo}`, token);
      reposFetched += 1;
      const stars =
        typeof meta.stargazers_count === "number" && Number.isFinite(meta.stargazers_count)
          ? Math.max(0, Math.floor(meta.stargazers_count))
          : null;
      if (stars === null) {
        errors.push({ repo: key, message: "GitHub response missing stargazers_count" });
        continue;
      }
      updated += await setPackageGithubStarsForNames(options.pool, group.names, stars);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ repo: key, message });
      if (isRateLimited(message)) {
        break;
      }
    }
  }

  return { updated, reposFetched, errors };
}
