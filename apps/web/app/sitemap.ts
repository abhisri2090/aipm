import type { MetadataRoute } from "next";
import { listPackages, packagePath, SITE_URL } from "../lib/registry";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["/", "/registry", "/publish", "/use", "/about", "/faq"];
  const packages = await listPackages("", 100);
  const now = new Date();

  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
    })),
    ...packages.map((pkg) => ({
      url: `${SITE_URL}${packagePath(pkg.name, pkg.version)}`,
      lastModified: new Date(pkg.createdAt),
    })),
  ];
}
