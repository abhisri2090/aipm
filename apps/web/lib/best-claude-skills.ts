import { listPackagesPage, type PackageSummary } from "./registry";

/**
 * "Best Claude skills" ranking built only from data the registry already stores:
 * AIPM install counts and the GitHub star count of each skill's source repository.
 * Nothing here is estimated or invented; if a value is missing it is shown as missing.
 */

export type SourceRepo = {
  /** owner/repo on GitHub */
  slug: string;
  url: string;
};

export type RankedRepo = {
  repo: SourceRepo;
  stars: number;
  publisherSlug: string | null;
  publisherName: string;
  totalInstalls: number;
  skills: PackageSummary[];
};

export type BestClaudeSkillsData = {
  mostInstalled: PackageSummary[];
  repos: RankedRepo[];
  eligibleCount: number;
  flaggedExcluded: number;
};

export function worksWithClaude(pkg: Pick<PackageSummary, "targets">): boolean {
  return pkg.targets.includes("*") || pkg.targets.includes("claude");
}

export function sourceRepoOf(pkg: Pick<PackageSummary, "sourceUrl" | "import">): SourceRepo | null {
  const raw = pkg.import?.sourceUrl ?? pkg.sourceUrl ?? null;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname !== "github.com") return null;
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    const slug = `${owner}/${repo.replace(/\.git$/, "")}`;
    return { slug, url: `https://github.com/${slug}` };
  } catch {
    return null;
  }
}

/** Imported skills occasionally have a broken description (for example a bare YAML ">"). */
export function hasUsableDescription(pkg: Pick<PackageSummary, "description">): boolean {
  const description = pkg.description.trim();
  return description.length >= 20 && /[a-z]/i.test(description);
}

function installs(pkg: PackageSummary): number {
  return typeof pkg.installCount === "number" && Number.isFinite(pkg.installCount) ? pkg.installCount : 0;
}

function stars(pkg: PackageSummary): number | null {
  return typeof pkg.githubStars === "number" && Number.isFinite(pkg.githubStars) ? pkg.githubStars : null;
}

export function rankBestClaudeSkills(packages: PackageSummary[], mostInstalledLimit = 10): BestClaudeSkillsData {
  const unique = new Map<string, PackageSummary>();
  for (const pkg of packages) {
    if (!unique.has(pkg.name)) unique.set(pkg.name, pkg);
  }
  const claudeSkills = [...unique.values()].filter(worksWithClaude);
  const eligible = claudeSkills.filter((pkg) => pkg.scan?.status !== "flagged");
  const flaggedExcluded = claudeSkills.length - eligible.length;

  const mostInstalled = eligible
    .filter((pkg) => installs(pkg) > 0)
    .sort(
      (a, b) =>
        installs(b) - installs(a) || (stars(b) ?? -1) - (stars(a) ?? -1) || a.name.localeCompare(b.name),
    )
    .slice(0, mostInstalledLimit);

  const groups = new Map<string, RankedRepo>();
  for (const pkg of eligible) {
    if (!hasUsableDescription(pkg)) continue;
    const repo = sourceRepoOf(pkg);
    const repoStars = stars(pkg);
    if (!repo || repoStars === null) continue;
    const existing = groups.get(repo.slug);
    if (existing) {
      existing.skills.push(pkg);
      existing.stars = Math.max(existing.stars, repoStars);
      existing.totalInstalls += installs(pkg);
    } else {
      groups.set(repo.slug, {
        repo,
        stars: repoStars,
        publisherSlug: pkg.publisher?.org.slug ?? null,
        publisherName: pkg.publisher?.org.name ?? repo.slug.split("/")[0] ?? repo.slug,
        totalInstalls: installs(pkg),
        skills: [pkg],
      });
    }
  }

  const repos = [...groups.values()]
    .map((group) => ({
      ...group,
      skills: [...group.skills].sort((a, b) => installs(b) - installs(a) || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.stars - a.stars || b.totalInstalls - a.totalInstalls || a.repo.slug.localeCompare(b.repo.slug));

  return { mostInstalled, repos, eligibleCount: eligible.length, flaggedExcluded };
}

/** Load every Claude-compatible skill from the registry (paged). Returns [] if the API is unreachable. */
export async function loadClaudeSkills(maxPages = 10): Promise<PackageSummary[]> {
  const packages: PackageSummary[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await listPackagesPage({ target: "claude", limit: 100, cursor });
    packages.push(...result.packages);
    if (!result.nextCursor || result.packages.length === 0) break;
    cursor = result.nextCursor;
  }
  return packages;
}
