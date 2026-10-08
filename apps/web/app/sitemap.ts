import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/registry";
import { SEO_GUIDES } from "../lib/seo-guides";
import { SKILL_DISCOVERY_PAGES } from "../lib/skill-discovery";
import { PROMPT_TOPIC_HUBS } from "../lib/prompt-topics";
import { PROMPT_LINK_SNAPSHOT_DATE, listGeneratedSeriesHubs } from "../lib/prompt-links";
import { listDocSectionIndexes } from "../lib/doc-section-index";

/** Fallback when a path has no content-specific date (hub SEO refresh). */
const HUB_SEO_REFRESH = new Date("2026-09-23T00:00:00.000Z");

/** Docs section indexes added with /guides. */
const DOC_SECTION_INDEX_LASTMOD = new Date("2026-10-02T00:00:00.000Z");

/** Per-path lastmod for static marketing pages (ISO date → Date). */
const STATIC_PAGE_LASTMOD: Record<string, Date> = {
  "/": new Date("2026-10-05T00:00:00.000Z"),
  "/skills": new Date("2026-10-05T00:00:00.000Z"),
  "/prompts": new Date("2026-09-28T00:00:00.000Z"),
  "/install": HUB_SEO_REFRESH,
  "/use": new Date("2026-09-25T00:00:00.000Z"),
  "/publish": new Date("2026-09-23T00:00:00.000Z"),
  "/publish/guide": new Date("2026-09-25T00:00:00.000Z"),
  "/publish/github": new Date("2026-09-19T00:00:00.000Z"),
  "/publishers": new Date("2026-09-04T00:00:00.000Z"),
  "/commands": new Date("2026-09-25T00:00:00.000Z"),
  "/targets": new Date("2026-09-25T00:00:00.000Z"),
  "/for": new Date("2026-10-07T00:00:00.000Z"),
  "/for/claude-code": new Date("2026-10-07T00:00:00.000Z"),
  "/for/cursor": new Date("2026-10-07T00:00:00.000Z"),
  "/for/codex": new Date("2026-10-07T00:00:00.000Z"),
  "/popular-skills": new Date("2026-09-04T00:00:00.000Z"),
  "/about": new Date("2026-09-25T00:00:00.000Z"),
  "/faq": new Date("2026-09-25T00:00:00.000Z"),
  "/resources": new Date("2026-09-04T00:00:00.000Z"),
  "/guides": new Date("2026-10-02T00:00:00.000Z"),
  "/examples": new Date("2026-09-25T00:00:00.000Z"),
  "/glossary": new Date("2026-09-25T00:00:00.000Z"),
  "/ai-practices": new Date("2026-09-04T00:00:00.000Z"),
  "/discoverability": new Date("2026-09-04T00:00:00.000Z"),
  "/security": new Date("2026-09-04T00:00:00.000Z"),
  "/privacy": new Date("2026-09-04T00:00:00.000Z"),
  "/terms": new Date("2026-09-04T00:00:00.000Z"),
  "/status": new Date("2026-09-04T00:00:00.000Z"),
  "/roadmap": new Date("2026-09-04T00:00:00.000Z"),
  "/changelog": new Date("2026-09-22T00:00:00.000Z"),
  "/templates": new Date("2026-09-25T00:00:00.000Z"),
  "/research/state-of-agent-skills-2026": new Date("2026-09-25T00:00:00.000Z"),
  "/thanks": new Date("2026-09-04T00:00:00.000Z"),
  "/compatibility": new Date("2026-09-25T00:00:00.000Z"),
  "/best-claude-skills": new Date("2026-09-25T00:00:00.000Z"),
};

function dateFromIsoDay(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/skills",
    "/prompts",
    "/publishers",
    "/publish",
    "/publish/guide",
    "/publish/github",
    "/install",
    "/use",
    "/commands",
    "/targets",
    "/for",
    "/for/claude-code",
    "/for/cursor",
    "/for/codex",
    "/popular-skills",
    "/about",
    "/faq",
    "/resources",
    "/guides",
    "/examples",
    "/glossary",
    "/ai-practices",
    "/discoverability",
    "/security",
    "/privacy",
    "/terms",
    "/status",
    "/roadmap",
    "/changelog",
    "/templates",
    "/research/state-of-agent-skills-2026",
    "/thanks",
    "/compatibility",
    "/best-claude-skills",
    ...listDocSectionIndexes().map((section) => section.path),
    ...SEO_GUIDES.map((guide) => `/guides/${guide.slug}`),
    ...SKILL_DISCOVERY_PAGES.map((page) => `/skills/${page.slug}`),
    ...PROMPT_TOPIC_HUBS.map((hub) => `/prompts/topics/${hub.slug}`),
    ...listGeneratedSeriesHubs().map((series) => `/prompts/topics/${series.slug}`),
  ];

  const guideUpdatedAt = new Map(
    SEO_GUIDES.map((guide) => [
      `/guides/${guide.slug}`,
      dateFromIsoDay(guide.updatedAt ?? guide.publishedAt ?? "2026-09-04"),
    ]),
  );

  const discoveryUpdatedAt = new Map(
    SKILL_DISCOVERY_PAGES.map((page) => [
      `/skills/${page.slug}`,
      dateFromIsoDay(page.updatedAt ?? "2026-09-04"),
    ]),
  );

  const topicUpdatedAt = new Map<string, Date>([
    ...PROMPT_TOPIC_HUBS.map((hub) => [`/prompts/topics/${hub.slug}`, dateFromIsoDay(hub.updatedAt)] as const),
    // Generated series hubs change when the prompt snapshot is regenerated.
    ...listGeneratedSeriesHubs().map(
      (series) => [`/prompts/topics/${series.slug}`, dateFromIsoDay(PROMPT_LINK_SNAPSHOT_DATE)] as const,
    ),
  ]);

  const docSectionUpdatedAt = new Map(
    listDocSectionIndexes().map((section) => [section.path, DOC_SECTION_INDEX_LASTMOD]),
  );

  return staticPaths.map((path) => {
    const lastModified =
      docSectionUpdatedAt.get(path) ??
      guideUpdatedAt.get(path) ??
      discoveryUpdatedAt.get(path) ??
      topicUpdatedAt.get(path) ??
      STATIC_PAGE_LASTMOD[path] ??
      HUB_SEO_REFRESH;

    return {
      url: `${SITE_URL}${path}`,
      lastModified,
    };
  });
}
