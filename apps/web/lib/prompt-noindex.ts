import data from "./prompt-noindex.json";

/**
 * Prompt pages that are near-duplicate template variants of another prompt
 * (promptText word 5-gram Jaccard >= 0.9). They render normally but are `noindex, follow`
 * and are left out of /prompt-sitemap.xml. Regenerate with
 * `node apps/web/scripts/generate-prompt-noindex.mjs` (see docs/SEO_THIN_PAGE_RULE.md).
 */
export const NEAR_DUPLICATE_PROMPT_PATHS: ReadonlySet<string> = new Set(data.noindex.map((entry) => entry.path));

export function isNearDuplicatePrompt(path: string): boolean {
  return NEAR_DUPLICATE_PROMPT_PATHS.has(path);
}
