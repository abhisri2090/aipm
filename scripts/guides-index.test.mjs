import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import robots from "../apps/web/app/robots";
import { listGuideIndexEntries } from "../apps/web/lib/guide-index";
import { SEO_GUIDES } from "../apps/web/lib/seo-guides";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";
import { pageMetadata } from "../apps/web/lib/seo";

const RETIRED = [
  "agent-package-manager",
  "prompt-package-manager",
  "mcp-package-manager",
];

const pageSource = readFileSync(
  new URL("../apps/web/app/guides/page.tsx", import.meta.url),
  "utf8",
);

describe("/guides index", () => {
  it("lists one card per guide the slug route already serves", () => {
    const entries = listGuideIndexEntries();
    expect(entries).toHaveLength(SEO_GUIDES.length);
    expect(entries.map((guide) => guide.slug)).toEqual(
      SEO_GUIDES.map((guide) => guide.slug),
    );
    expect(new Set(entries.map((guide) => guide.slug)).size).toBe(entries.length);
    for (const slug of RETIRED) {
      expect(entries.some((guide) => guide.slug === slug)).toBe(false);
    }
    for (const guide of entries) {
      const source = SEO_GUIDES.find((item) => item.slug === guide.slug);
      expect(guide.title).toBe(source.title);
      expect(guide.description).toBe(source.description);
    }
    expect(pageSource).toContain("listGuideIndexEntries");
    expect(pageSource).toContain("guides.map");
    expect(pageSource).toContain("guide.title");
    expect(pageSource).toContain("guide.description");
    expect(pageSource).toContain("`/guides/${guide.slug}`");
    expect(pageSource).toContain("pageMetadata");
    expect(pageSource).not.toContain("noIndexPageMetadata");
  });

  it("is in the main sitemap, indexable, and linked from the docs nav", async () => {
    const entries = await sitemap();
    const guidesEntry = entries.find(
      (entry) => entry.url === "https://www.aipm-registry.com/guides",
    );
    expect(guidesEntry).toBeDefined();
    expect(guidesEntry.lastModified).toEqual(new Date("2026-10-02T00:00:00.000Z"));
    const guidePaths = entries
      .map((entry) => new URL(entry.url).pathname)
      .filter((path) => path.startsWith("/guides/"));
    expect(guidePaths).toHaveLength(listGuideIndexEntries().length);
    expect(new Set(guidePaths)).toEqual(
      new Set(listGuideIndexEntries().map((guide) => `/guides/${guide.slug}`)),
    );

    const metadata = pageMetadata({
      title: "Guides",
      description:
        "Every guide published on AIPM, with the title and description from that guide.",
      path: "/guides",
    });
    expect(metadata.robots).toBeUndefined();
    const rules = robots().rules;
    const disallowed = rules.flatMap((rule) => rule.disallow ?? []);
    expect(disallowed).not.toContain("/guides");

    const navHrefs = DOC_NAV_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.href),
    );
    expect(navHrefs).toContain("/guides");
  });
});
