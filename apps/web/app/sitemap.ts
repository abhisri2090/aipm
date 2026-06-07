import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/registry";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/registry",
    "/publish",
    "/publish/guide",
    "/use",
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
  ];
  const now = new Date();

  return staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }));
}
