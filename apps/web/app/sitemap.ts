import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/registry";
import { SEO_GUIDES } from "../lib/seo-guides";
import { SKILL_DISCOVERY_PAGES } from "../lib/skill-discovery";
import { listPrompts } from "../lib/prompts";

const LAST_SIGNIFICANT_UPDATE = new Date("2026-09-04T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const prompts = await listPrompts();
  const staticPaths = [
    "/",
    "/skills",
    "/prompts",
    "/publish",
    "/publish/guide",
    "/install",
    "/use",
    "/commands",
    "/targets",
    "/popular-skills",
    "/about",
    "/faq",
    "/resources",
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
    ...SEO_GUIDES.map((guide) => `/guides/${guide.slug}`),
    ...SKILL_DISCOVERY_PAGES.map((page) => `/skills/${page.slug}`),
  ];

  const guidePaths = new Set(SEO_GUIDES.map((guide) => `/guides/${guide.slug}`));
  const guideUpdatedAt = new Map(
    SEO_GUIDES.map((guide) => [
      `/guides/${guide.slug}`,
      new Date(`${guide.updatedAt ?? "2026-09-04"}T00:00:00.000Z`),
    ]),
  );

  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: guidePaths.has(path) ? guideUpdatedAt.get(path) : LAST_SIGNIFICANT_UPDATE,
    })),
    ...prompts.map((prompt) => ({
      url: `${SITE_URL}${prompt.path}`,
      lastModified: new Date(prompt.updatedAt),
    })),
  ];
}
