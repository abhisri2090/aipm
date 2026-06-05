import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/registry";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/login", "/dashboard", "/admin", "/internal"],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/package-sitemap.xml`],
  };
}
