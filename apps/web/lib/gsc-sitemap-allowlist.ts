import paths from "./gsc-sitemap-allowlist.json";

/** Paths with Google Search Console impressions. Always sitemap these. */
export const GSC_SITEMAP_ALLOWLIST: readonly string[] = paths;

/** Registry skill page: /skills/{scope}/{name}/{version}. Discovery hubs are shorter. */
export function isVersionedSkillSitemapPath(path: string): boolean {
  return /^\/skills\/[^/]+\/[^/]+\/[^/]+$/.test(path);
}
