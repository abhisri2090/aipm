import { SEO_GUIDES, type SeoGuide } from "./seo-guides";

/**
 * Guides the app actually serves at /guides/[slug] via generateStaticParams.
 * SEO_GUIDES is that source. Retired slugs are redirects in next.config.ts and are not included.
 * None of these guides set a noindex robots policy (guide metadata uses pageMetadata).
 */
export type GuideIndexEntry = Pick<
  SeoGuide,
  "slug" | "title" | "description" | "publishedAt" | "updatedAt"
>;

export function listGuideIndexEntries(): GuideIndexEntry[] {
  const seen = new Set<string>();
  const entries: GuideIndexEntry[] = [];
  for (const guide of SEO_GUIDES) {
    if (!guide.slug || seen.has(guide.slug)) continue;
    seen.add(guide.slug);
    entries.push({
      slug: guide.slug,
      title: guide.title,
      description: guide.description,
      publishedAt: guide.publishedAt,
      updatedAt: guide.updatedAt,
    });
  }
  return entries;
}
