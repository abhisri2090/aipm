#!/usr/bin/env node

const DEFAULT_SITE_URL = "https://www.aipm-registry.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY = "8f24c0d56a1b4e38a2796fd31e07b5c9";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.WEB_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]?.trim()).filter(Boolean);
}

async function collectPageUrls(site) {
  const indexResponse = await fetch(`${site}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
  if (!indexResponse.ok) throw new Error(`Could not read /sitemap.xml: ${indexResponse.status}`);
  const indexXml = await indexResponse.text();
  const locs = sitemapUrls(indexXml);
  const childXml = indexXml.includes("<sitemapindex")
    ? await Promise.all(
        locs
          .filter((loc) => loc.endsWith(".xml"))
          .map(async (loc) => {
            const response = await fetch(loc, { signal: AbortSignal.timeout(15000) });
            if (!response.ok) throw new Error(`Could not read ${loc}: ${response.status}`);
            return response.text();
          }),
      )
    : [indexXml];
  return [...new Set(childXml.flatMap(sitemapUrls).filter((loc) => !loc.endsWith(".xml")))];
}

async function main() {
  const site = siteUrl();
  const host = new URL(site).hostname;
  const urls = await collectPageUrls(site);
  if (!urls.length) throw new Error("The sitemaps did not contain any URLs.");

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${site}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (![200, 202].includes(response.status)) {
    const detail = await response.text().catch(() => "");
    throw new Error(`IndexNow rejected the submission: ${response.status} ${detail}`.trim());
  }

  console.log(`Submitted ${urls.length} URLs to IndexNow for ${host}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
