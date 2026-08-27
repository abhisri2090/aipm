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

async function main() {
  const site = siteUrl();
  const host = new URL(site).hostname;
  const sitemapResponse = await fetch(`${site}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
  if (!sitemapResponse.ok) throw new Error(`Could not read sitemap: ${sitemapResponse.status}`);

  const urls = sitemapUrls(await sitemapResponse.text());
  if (!urls.length) throw new Error("The sitemap did not contain any URLs.");

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
