import { publisherPath, SITE_URL } from "../../lib/registry";
import { listSitemapPublishers } from "../../lib/sitemap-skills";
import { urlSetXml, xmlResponse } from "../../lib/sitemap-xml";
import { hubSitemapEntries } from "../../lib/static-sitemap";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const pages = hubSitemapEntries().map((entry) => ({
    loc: `${SITE_URL}${entry.path}`,
    lastmod: entry.lastModified.toISOString(),
  }));
  let publishers: { loc: string; lastmod: string | null }[] = [];
  try {
    publishers = (await listSitemapPublishers()).map((publisher) => ({
      loc: `${SITE_URL}${publisherPath(publisher.slug)}`,
      lastmod: publisher.lastmod,
    }));
  } catch (error) {
    console.error("sitemap-hubs.xml publishers omitted:", error instanceof Error ? error.message : error);
  }
  return xmlResponse(urlSetXml([...pages, ...publishers]));
}
