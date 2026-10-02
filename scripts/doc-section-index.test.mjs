import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import robots from "../apps/web/app/robots";
import {
  DOCUMENTATION_INDEX_PATH,
  listDocSectionIndexes,
} from "../apps/web/lib/doc-section-index";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";
import { listGuideIndexEntries } from "../apps/web/lib/guide-index";
import { pageMetadata } from "../apps/web/lib/seo";

const RETIRED = new Set([
  "/guides/agent-package-manager",
  "/guides/prompt-package-manager",
  "/guides/mcp-package-manager",
]);

const pageSource = readFileSync(
  new URL("../apps/web/app/resources/[section]/page.tsx", import.meta.url),
  "utf8",
);

describe("docs section indexes", () => {
  it("gives each docs heading its own card set, and does not duplicate /guides", () => {
    const sections = listDocSectionIndexes();
    expect(sections.map((section) => section.title)).toEqual(
      DOC_NAV_SECTIONS.map((section) => section.title),
    );
    expect(new Set(sections.map((section) => section.path)).size).toBe(sections.length);
    expect(sections.map((section) => section.path)).not.toContain("/guides");
    expect(sections.map((section) => section.path)).not.toContain(
      DOCUMENTATION_INDEX_PATH,
    );

    const guideHrefs = listGuideIndexEntries().map((guide) => `/guides/${guide.slug}`);
    const plain = sections.find(
      (section) => section.title === "Plain English Technical Guides",
    );
    expect(plain.path).toBe("/resources/plain-english");
    expect(plain.items.map((item) => item.href)).not.toEqual(guideHrefs);

    for (const section of sections) {
      const nav = DOC_NAV_SECTIONS.find((item) => item.title === section.title);
      const expected = nav.items.filter((item) => !RETIRED.has(item.href));
      expect(section.items, section.title).toEqual(expected);
      expect(section.items.length, section.title).toBeGreaterThan(0);
      for (const item of section.items) {
        expect(RETIRED.has(item.href), item.href).toBe(false);
      }
    }

    expect(pageSource).toContain("section.items.map");
    expect(pageSource).toContain("item.label");
    expect(pageSource).toContain("item.body");
    expect(pageSource).toContain("pageMetadata");
    expect(pageSource).not.toContain("noIndexPageMetadata");
  });

  it("adds each section index to the sitemap as an indexable URL", async () => {
    const entries = await sitemap();
    const pathnames = new Set(entries.map((entry) => new URL(entry.url).pathname));
    expect(pathnames.has(DOCUMENTATION_INDEX_PATH)).toBe(true);
    expect(pathnames.has("/documentation")).toBe(false);

    for (const section of listDocSectionIndexes()) {
      const entry = entries.find(
        (item) => item.url === `https://www.aipm-registry.com${section.path}`,
      );
      expect(entry, section.path).toBeDefined();
      expect(entry.lastModified).toEqual(new Date("2026-10-02T00:00:00.000Z"));
      for (const item of section.items) {
        expect(pathnames.has(item.href), `${section.title} -> ${item.href}`).toBe(true);
      }
      const metadata = pageMetadata({
        title: section.title,
        description: `Pages listed under ${section.title}.`,
        path: section.path,
      });
      expect(metadata.robots).toBeUndefined();
    }

    const disallowed = robots().rules.flatMap((rule) => rule.disallow ?? []);
    expect(disallowed).not.toContain("/resources");
  });
});
