import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/registry";
import { SEO_GUIDES } from "../lib/seo-guides";
import { SKILL_DISCOVERY_PAGES } from "../lib/skill-discovery";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/registry",
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
    "/thanks",
    "/compatibility",
    "/stats",
    ...SEO_GUIDES.map((guide) => `/guides/${guide.slug}`),
    ...SKILL_DISCOVERY_PAGES.map((page) => `/skills/${page.slug}`),
  ];
  const now = new Date();

  return staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }));
}
