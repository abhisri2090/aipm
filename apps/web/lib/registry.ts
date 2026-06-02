export type PackageSummary = {
  name: string;
  version: string;
  description: string;
  type: string;
  targets: string[];
  license: string | null;
  integrity: string;
  sizeBytes: number;
  createdAt: string;
};

export type PackageDetail = {
  name: string;
  version: string;
  manifest: {
    description: string;
    type: string;
    targets: string[];
    license?: string;
    entry?: string;
  };
  integrity: string;
  sizeBytes: number;
  createdAt: string;
};

const API_BASE_URL = (process.env.AIPM_API_BASE_URL ?? "https://api.aipm-registry.com").replace(
  /\/$/,
  "",
);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aipm-registry.com").replace(
  /\/$/,
  "",
);

export const CLI_INSTALL_COMMAND = "npm install -g @aipm-registry/cli";

export function packagePath(packageName: string, version: string): string {
  const [scope, name] = packageName.replace(/^@/, "").split("/");
  return `/packages/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(name ?? "")}/${encodeURIComponent(version)}`;
}

export function installCommand(pkg: Pick<PackageSummary, "name" | "version" | "targets">): string {
  const target = pkg.targets[0] ?? "cursor";
  return `aipm add ${pkg.name}@${pkg.version} --target ${target} --ci`;
}

export async function listPackages(query = "", limit = 50): Promise<PackageSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set("q", query);
  try {
    const response = await fetch(`${API_BASE_URL}/v1/packages?${params}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { packages?: PackageSummary[] };
    return data.packages ?? [];
  } catch {
    return [];
  }
}

export async function getPackage(name: string, version: string): Promise<PackageDetail | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/v1/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`,
      { next: { revalidate: 120 }, signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return null;
    return (await response.json()) as PackageDetail;
  } catch {
    return null;
  }
}
