import { REGISTRY_API_BASE_URL, skillListFromResponse, type PackageSummary } from "./registry";

export const SITEMAP_REVALIDATE_SECONDS = 3600;

const PAGE_SIZE = 100;
const MAX_SKILL_PAGES = 40;
const PARALLEL_SKILL_PAGES = 8;
const MAX_PUBLISHER_PAGES = 20;

type PackageListResponse = {
  skills?: PackageSummary[];
  packages?: PackageSummary[];
  nextCursor?: string | null;
  nextOffset?: number | null;
};

type PublisherListResponse = {
  publishers?: Array<{ slug?: string; createdAt?: string }>;
  nextCursor?: string | null;
};

export type SitemapPublisher = {
  slug: string;
  lastmod: string | null;
};

function sitemapFetchInit() {
  return {
    next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(4000),
  };
}

async function fetchSkillsPage(offset: number): Promise<PackageSummary[]> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/skills?${params}`, sitemapFetchInit());
  if (!response.ok) throw new Error(`Skill listing failed (${response.status})`);
  const data = (await response.json()) as PackageListResponse;
  return skillListFromResponse(data);
}

/**
 * Every public skill, or an error when a page cannot be read. Callers must not
 * publish a partial list.
 *
 * Pages after the first are fetched in parallel (offset pagination). A full
 * sequential cursor walk is ~20s for ~1,700 skills and blows the 8s web smoke
 * timeout; eight-wide waves stay well under that.
 */
export async function listSitemapSkills(): Promise<PackageSummary[]> {
  const packages: PackageSummary[] = [];
  let offset = 0;
  let pages = 0;

  while (pages < MAX_SKILL_PAGES) {
    const batchSize = pages === 0 ? 1 : Math.min(PARALLEL_SKILL_PAGES, MAX_SKILL_PAGES - pages);
    const batch = await Promise.all(
      Array.from({ length: batchSize }, (_, index) => fetchSkillsPage(offset + index * PAGE_SIZE)),
    );
    for (const skills of batch) {
      pages += 1;
      packages.push(...skills);
      if (skills.length < PAGE_SIZE) return packages;
    }
    offset += batchSize * PAGE_SIZE;
  }

  throw new Error("Skill listing did not finish");
}

/**
 * Public publishers with at least one published skill. `/v1/publishers` already
 * excludes reservation-only orgs, so hubs sitemap must not walk `/v1/skills`.
 */
export async function listSitemapPublishers(): Promise<SitemapPublisher[]> {
  const publishers: SitemapPublisher[] = [];
  let cursor: string | undefined;
  const seen = new Set<string>();

  for (let page = 0; page < MAX_PUBLISHER_PAGES; page += 1) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/publishers?${params}`, sitemapFetchInit());
    if (!response.ok) throw new Error(`Publisher listing failed (${response.status})`);
    const data = (await response.json()) as PublisherListResponse;
    if (!Array.isArray(data.publishers)) throw new Error("Publisher listing response is invalid");
    for (const publisher of data.publishers) {
      const slug = publisher.slug?.trim();
      if (!slug) continue;
      const published = publisher.createdAt ? Date.parse(publisher.createdAt) : Number.NaN;
      publishers.push({
        slug,
        lastmod: Number.isFinite(published) ? new Date(published).toISOString() : null,
      });
    }
    if (!data.nextCursor) return publishers;
    if (seen.has(data.nextCursor)) throw new Error("Publisher listing cursor repeated");
    seen.add(data.nextCursor);
    cursor = data.nextCursor;
  }

  throw new Error("Publisher listing did not finish");
}
