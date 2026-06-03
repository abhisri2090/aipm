import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/registry";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/registry",
    "/publish",
    "/use",
    "/about",
    "/faq",
    "/resources",
    "/ai-practices",
    "/discoverability",
    "/thanks",
  ];
  const now = new Date();

  return staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }));
}
