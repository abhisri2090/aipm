export type PackagePublisher = {
  org: {
    slug: string;
    name: string;
  };
  user: {
    githubLogin: string;
    name: string | null;
    avatarUrl: string | null;
    verified?: boolean;
  };
};

export type PackageImportMeta = {
  imported: boolean;
  sourceUrl: string | null;
  sourceCommitSha?: string | null;
  sourceLicense?: string | null;
  contentHash?: string | null;
};

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
  publisher?: PackagePublisher | null;
  import?: PackageImportMeta;
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
  publisher?: PackagePublisher | null;
  import?: PackageImportMeta;
};

export const REGISTRY_API_BASE_URL = (process.env.AIPM_API_BASE_URL ?? "https://api.aipm-registry.com").replace(
  /\/$/,
  "",
);

/** Public API origin for browser navigation (OAuth must not go through Next rewrites). */
export const PUBLIC_REGISTRY_API_BASE_URL = (
  process.env.NEXT_PUBLIC_AIPM_API_BASE_URL ?? REGISTRY_API_BASE_URL
).replace(/\/$/, "");

export const GITHUB_LOGIN_URL = `${PUBLIC_REGISTRY_API_BASE_URL}/v1/auth/github/start`;

export const DEV_LOGIN_URL = "/v1/auth/dev/login";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aipm-registry.com").replace(
  /\/$/,
  "",
);

export function isLocalDevSite(siteUrl: string = SITE_URL): boolean {
  const normalized =
    typeof window === "undefined" ? siteUrl.toLowerCase() : window.location.origin.toLowerCase();
  return normalized.includes("localhost") || normalized.includes("127.0.0.1");
}

export const CLI_INSTALL_COMMAND = "npm install -g @aipm-registry/cli";
export const CLI_VERSION = "0.2.12";
export const CLI_RELEASE_TAG = `cli-v${CLI_VERSION}`;
export const CLI_RELEASE_URL = `https://github.com/abhisri2090/aipm/releases/tag/${CLI_RELEASE_TAG}`;
export const CLI_RELEASE_DOWNLOAD_URL = `https://github.com/abhisri2090/aipm/releases/download/${CLI_RELEASE_TAG}`;
export const CLI_INSTALL_SCRIPT_COMMAND = `curl -fsSL ${CLI_RELEASE_DOWNLOAD_URL}/install.sh | sh`;
export const CLI_WINDOWS_INSTALL_COMMAND = `irm ${CLI_RELEASE_DOWNLOAD_URL}/install.ps1 | iex`;
export const CLI_HOMEBREW_COMMAND = `brew install ${CLI_RELEASE_DOWNLOAD_URL}/aipm.rb`;
export const CLI_SCOOP_COMMAND = `scoop install ${CLI_RELEASE_DOWNLOAD_URL}/aipm.json`;

export const CLI_INSTALL_OPTIONS = [
  {
    label: "via npm",
    code: CLI_INSTALL_COMMAND,
  },
  {
    label: "via macOS/Linux standalone",
    code: CLI_INSTALL_SCRIPT_COMMAND,
  },
  {
    label: "via Homebrew",
    code: CLI_HOMEBREW_COMMAND,
  },
  {
    label: "via Windows PowerShell",
    code: CLI_WINDOWS_INSTALL_COMMAND,
  },
] as const;

export function packagePath(packageName: string, version: string): string {
  const [scope, name] = packageName.replace(/^@/, "").split("/");
  return `/packages/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(name ?? "")}/${encodeURIComponent(version)}`;
}

export function installCommand(pkg: Pick<PackageSummary, "name" | "version" | "targets">): string {
  const target = pkg.targets.includes("*") ? "*" : (pkg.targets[0] ?? "cursor");
  return `aipm add ${pkg.name}@${pkg.version} --target ${target} --ci`;
}

export function displayTargets(targets: string[]): string[] {
  return targets.includes("*") ? ["cursor", "claude", "*"] : targets;
}

export function isImportedPackage(pkg: Pick<PackageSummary, "import" | "publisher">): boolean {
  return Boolean(pkg.import?.imported);
}

export function isUnverifiedImportedPackage(pkg: Pick<PackageSummary, "import" | "publisher">): boolean {
  return isImportedPackage(pkg) && pkg.publisher?.user.verified === false;
}

export function installCommandForTarget(
  pkg: Pick<PackageSummary, "name" | "version">,
  target: string,
): string {
  return `aipm add ${pkg.name}@${pkg.version} --target ${target} --ci`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0] ?? "KB";
  for (const nextUnit of units.slice(1)) {
    if (value < 1024) break;
    value /= 1024;
    unit = nextUnit;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
}

export function shortIntegrity(value: string): string {
  const [algorithm, hash] = value.split("-");
  if (!algorithm || !hash) return value.slice(0, 18);
  return `${algorithm}-${hash.slice(0, 14)}...`;
}

export async function listPackages(query = "", limit = 50): Promise<PackageSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set("q", query);
  try {
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/packages?${params}`, {
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
      `${REGISTRY_API_BASE_URL}/v1/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`,
      { next: { revalidate: 120 }, signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return null;
    return (await response.json()) as PackageDetail;
  } catch {
    return null;
  }
}
