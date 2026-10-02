import { DOC_NAV_SECTIONS, type DocNavItem } from "./docs-nav";

/**
 * Sidebar label "Documentation" is the docs home, which already exists at /resources.
 * It is not a second index.
 */
export const DOCUMENTATION_INDEX_PATH = "/resources";

/** Retired guide URLs that only 301. Never cards. */
const RETIRED_PATHS = new Set([
  "/guides/agent-package-manager",
  "/guides/prompt-package-manager",
  "/guides/mcp-package-manager",
]);

/**
 * One index URL per docs-nav section. Slugs stay under /resources so they do not
 * collide with existing top-level pages (/publish, /research, /guides).
 * /guides remains the full SEO_GUIDES index. The "Guides" section is a smaller,
 * different set, so it lives at /resources/guides.
 */
const SECTION_SLUGS: Record<string, string> = {
  "Plain English Technical Guides": "plain-english",
  "Getting started": "getting-started",
  "Publish package": "publish-package",
  Guides: "guides",
  Research: "research",
  "Quality & discovery": "quality",
  Reference: "reference",
  Legal: "legal",
  Project: "project",
};

export type DocSectionIndex = {
  slug: string;
  path: string;
  title: string;
  items: DocNavItem[];
};

export function listDocSectionIndexes(): DocSectionIndex[] {
  return DOC_NAV_SECTIONS.map((section) => {
    const slug = SECTION_SLUGS[section.title];
    if (!slug) {
      throw new Error(`No index path for docs section "${section.title}"`);
    }
    return {
      slug,
      path: `/resources/${slug}`,
      title: section.title,
      items: section.items.filter((item) => !RETIRED_PATHS.has(item.href)),
    };
  });
}

export function getDocSectionIndex(slug: string): DocSectionIndex | null {
  return listDocSectionIndexes().find((section) => section.slug === slug) ?? null;
}
