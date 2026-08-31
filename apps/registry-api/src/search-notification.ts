const DEFAULT_SITE_URL = "https://www.aipm-registry.com";
const DEFAULT_INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_INDEXNOW_KEY = "8f24c0d56a1b4e38a2796fd31e07b5c9";

type SearchNotificationLogger = {
  info: (details: unknown, message?: string) => void;
  warn: (details: unknown, message?: string) => void;
};

function siteUrl(): string {
  const configured = process.env.INDEXNOW_SITE_URL ?? process.env.AIPM_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  const url = new URL(configured);
  if (url.hostname === "aipm-registry.com") url.hostname = "www.aipm-registry.com";
  return url.toString().replace(/\/$/, "");
}

export function promptPublicUrl(publisher: string, slug: string): string {
  return `${siteUrl()}/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`;
}

export function packagePublicUrl(name: string, version: string): string {
  const [scope, packageName] = name.replace(/^@/, "").split("/");
  return `${siteUrl()}/packages/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(packageName ?? "")}/${encodeURIComponent(version)}`;
}

export async function notifySearchEngines(
  urls: string[],
  logger?: SearchNotificationLogger,
): Promise<boolean> {
  if (process.env.NODE_ENV === "test" || process.env.INDEXNOW_ENABLED === "false") return false;

  const site = siteUrl();
  const siteOrigin = new URL(site).origin;
  const uniqueUrls = [...new Set(urls)].filter((url) => {
    try {
      return new URL(url).origin === siteOrigin;
    } catch {
      return false;
    }
  });
  if (uniqueUrls.length === 0) return false;

  const key = process.env.INDEXNOW_KEY?.trim() || DEFAULT_INDEXNOW_KEY;
  try {
    const response = await fetch(process.env.INDEXNOW_ENDPOINT ?? DEFAULT_INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(site).hostname,
        key,
        keyLocation: `${site}/${key}.txt`,
        urlList: uniqueUrls,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (![200, 202].includes(response.status)) {
      logger?.warn({ status: response.status, urls: uniqueUrls }, "IndexNow rejected SEO URLs");
      return false;
    }
    logger?.info({ urls: uniqueUrls }, "Submitted SEO URLs to IndexNow");
    return true;
  } catch (error) {
    logger?.warn({ error, urls: uniqueUrls }, "Could not submit SEO URLs to IndexNow");
    return false;
  }
}

export function queueSearchNotification(
  urls: string[],
  logger?: SearchNotificationLogger,
): void {
  void notifySearchEngines(urls, logger);
}
