import { publisherPath, SITE_URL, type PackageSummary } from "../../lib/registry";
import { listSitemapSkills } from "../../lib/sitemap-skills";
import { urlSetXml, xmlResponse } from "../../lib/sitemap-xml";
import { hubSitemapEntries } from "../../lib/static-sitemap";

export const dynamic = "force-dynamic";

function publisherEntries(skills: PackageSummary[]) {
  const dates = new Map<string, string>();
  for (const skill of skills) {
    const slug = skill.publisher?.org.slug;
    if (!slug) continue;
    const published = Date.parse(skill.createdAt);
    if (!Number.isFinite(published)) continue;
    const current = dates.get(slug);
    if (!current || published > Date.parse(current)) dates.set(slug, new Date(published).toISOString());
  }
  return [...dates].map(([slug, lastmod]) => ({
    loc: `${SITE_URL}${publisherPath(slug)}`,
    lastmod,
  }));
}

export async function GET(): Promise<Response> {
  const pages = hubSitemapEntries().map((entry) => ({
    loc: `${SITE_URL}${entry.path}`,
    lastmod: entry.lastModified.toISOString(),
  }));
  let publishers: { loc: string; lastmod: string }[] = [];
  try {
    publishers = publisherEntries(await listSitemapSkills());
  } catch (error) {
    console.error("sitemap-hubs.xml publishers omitted:", error instanceof Error ? error.message : error);
  }
  return xmlResponse(urlSetXml([...pages, ...publishers]));
}
