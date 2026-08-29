import { packagePath, REGISTRY_API_BASE_URL, SITE_URL, type PackageSummary } from "../../lib/registry";

export const dynamic = "force-dynamic";

type PackageListResponse = {
  packages?: PackageSummary[];
  nextCursor?: string | null;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function listPackageUrls(): Promise<PackageSummary[]> {
  const packages: PackageSummary[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/packages?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) break;
    const data = (await response.json()) as PackageListResponse;
    packages.push(...(data.packages ?? []));
    if (!data.nextCursor) break;
    cursor = data.nextCursor;
  }

  return packages;
}

export async function GET(): Promise<Response> {
  let packages: PackageSummary[] = [];
  try {
    packages = await listPackageUrls();
  } catch {
    packages = [];
  }

  const urls = packages
    .map((pkg) => {
      const loc = `${SITE_URL}${packagePath(pkg.name, pkg.version)}`;
      const lastmod = new Date(pkg.createdAt).toISOString();
      return `<url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></url>`;
    })
    .join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  });
}
