import { SITE_URL } from "../../lib/registry";
import { latestLastmod, sitemapIndexXml, xmlResponse } from "../../lib/sitemap-xml";
import { guideSitemapEntries, hubSitemapEntries } from "../../lib/static-sitemap";

export function GET(): Response {
  const hubsLastmod = latestLastmod(hubSitemapEntries().map((entry) => entry.lastModified));
  const guidesLastmod = latestLastmod(guideSitemapEntries().map((entry) => entry.lastModified));
  return xmlResponse(
    sitemapIndexXml([
      { loc: `${SITE_URL}/sitemap-hubs.xml`, lastmod: hubsLastmod },
      { loc: `${SITE_URL}/sitemap-guides.xml`, lastmod: guidesLastmod },
      { loc: `${SITE_URL}/ai-skills-sitemap.xml` },
      { loc: `${SITE_URL}/prompt-sitemap.xml` },
    ]),
  );
}
