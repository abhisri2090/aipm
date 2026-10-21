import { SITE_URL } from "../../lib/registry";
import { urlSetXml, xmlResponse } from "../../lib/sitemap-xml";
import { guideSitemapEntries } from "../../lib/static-sitemap";

export function GET(): Response {
  return xmlResponse(
    urlSetXml(
      guideSitemapEntries().map((entry) => ({
        loc: `${SITE_URL}${entry.path}`,
        lastmod: entry.lastModified.toISOString(),
      })),
    ),
  );
}
