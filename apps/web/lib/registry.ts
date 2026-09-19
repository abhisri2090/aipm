import cliPackage from "../../cli/package.json";

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

export type ScanStatus = "not_scanned" | "clean" | "flagged" | "error";

export type ScanFinding = {
  category: "secret" | "prompt-injection" | "network-or-filesystem";
  severity: "warning" | "block";
  label: string;
  location: string;
};

export type ScanInfo = {
  status: ScanStatus;
  scannedAt: string | null;
  scannerVersion: string | null;
  checksPerformed: string[];
  findings: ScanFinding[];
};

export type PackageSummary = {
  name: string;
  version: string;
  description: string;
  type: string;
  targets: string[];
  license: string | null;
  usage?: string | null;
  tags?: string[];
  categories?: string[];
  sourceUrl?: string | null;
  integrity: string;
  sizeBytes: number;
  createdAt: string;
  installCount?: number;
  publisher?: PackagePublisher | null;
  import?: PackageImportMeta;
  scan?: ScanInfo;
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
    usage?: string;
    agentDescription?: string;
    tags?: string[];
    categories?: string[];
    sourceUrl?: string;
    examples?: Array<{
      title: string;
      description?: string;
      prompt: string;
    }>;
    releaseNotes?: string;
  };
  integrity: string;
  sizeBytes: number;
  createdAt: string;
  installCount?: number;
  publisher?: PackagePublisher | null;
  import?: PackageImportMeta;
  scan?: ScanInfo;
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
export const GITHUB_CONNECT_URL = `${PUBLIC_REGISTRY_API_BASE_URL}/v1/auth/github/connect`;

export const DEV_LOGIN_URL = "/v1/auth/dev/login";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aipm-registry.com").replace(/\/$/, "");

export function isLocalDevSite(siteUrl: string = SITE_URL): boolean {
  const normalized = typeof window === "undefined" ? siteUrl.toLowerCase() : window.location.origin.toLowerCase();
  return normalized.includes("localhost") || normalized.includes("127.0.0.1");
}

export const CLI_INSTALL_COMMAND = "npm install -g @aipm-registry/cli";
export const CLI_VERSION = cliPackage.version;
export const CLI_RELEASE_TAG = `cli-v${CLI_VERSION}`;
export const CLI_RELEASE_URL = `https://github.com/abhisri2090/aipm/releases/tag/${CLI_RELEASE_TAG}`;
export const CLI_RELEASE_DOWNLOAD_URL = `https://github.com/abhisri2090/aipm/releases/download/${CLI_RELEASE_TAG}`;
export const CLI_INSTALL_SCRIPT_COMMAND = `curl -fsSL ${CLI_RELEASE_DOWNLOAD_URL}/install.sh | sh`;
export const CLI_WINDOWS_INSTALL_COMMAND = `irm ${CLI_RELEASE_DOWNLOAD_URL}/install.ps1 | iex`;
export const CLI_HOMEBREW_COMMAND = `brew install ${CLI_RELEASE_DOWNLOAD_URL}/aipm.rb`;
export const CLI_SCOOP_COMMAND = `scoop install ${CLI_RELEASE_DOWNLOAD_URL}/aipm.json`;

export const CLI_INSTALL_OPTIONS = [
  {
    label: "npm",
    slug: "via-npm",
    code: CLI_INSTALL_COMMAND,
  },
  {
    label: "via Homebrew",
    slug: "via-homebrew",
    code: CLI_HOMEBREW_COMMAND,
  },
  {
    label: "via Windows PowerShell",
    slug: "via-windows-powershell",
    code: CLI_WINDOWS_INSTALL_COMMAND,
  },
  {
    label: "via macOS",
    slug: "via-macos-linux-standalone",
    code: CLI_INSTALL_SCRIPT_COMMAND,
  },
] as const;

export function packagePath(packageName: string, version: string): string {
  const [scope, name] = packageName.replace(/^@/, "").split("/");
  return `/skills/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(name ?? "")}/${encodeURIComponent(version)}`;
}

export function packageFilesPath(packageName: string, version: string): string {
  return `${packagePath(packageName, version)}/files`;
}

export function publisherPath(slug: string): string {
  return `/publishers/${encodeURIComponent(slug)}`;
}

export function packageShortName(name: string): string {
  const parts = name.replace(/^@/, "").split("/");
  return parts[parts.length - 1] ?? name;
}

export function isIndexablePackage(pkg: Pick<PackageSummary, "description" | "sourceUrl" | "import">): boolean {
  const description = pkg.description.trim();
  const sourceUrl = pkg.sourceUrl ?? pkg.import?.sourceUrl ?? null;
  return description.length >= 40 && (Boolean(sourceUrl) || description.length >= 80);
}

export function parsePackageName(name: string): { scope: string; skillName: string } {
  const [scope, skillName] = name.replace(/^@/, "").split("/");
  return { scope: scope ?? "", skillName: skillName ?? name };
}

function firstMarkdownParagraph(content: string): string | null {
  let body = content.replace(/^---[\s\S]*?---\r?\n?/, "").trim();
  body = body.replace(/^#\s+[^\n]+\n+/, "").trim();
  return (
    body
      .split(/\n\s*\n/)
      .find((block) => block.trim())
      ?.trim() ?? null
  );
}

/** Longer skill overview copied from import (legacy usage field or SKILL.md body). */
export function resolveSkillAbout(options: { usage?: string | null; agentDescription?: string | null }): string | null {
  if (options.usage?.trim()) return options.usage.trim();
  if (options.agentDescription?.trim()) return firstMarkdownParagraph(options.agentDescription);
  return null;
}

/** Slash command to invoke the skill in any supported AI tool. */
export function resolveSkillInvokeCommand(name: string): string {
  return `/${packageShortName(name)} <your description>`;
}

/** @deprecated Use resolveSkillInvokeCommand */
export function resolveSkillUsage(options: {
  name: string;
  description: string;
  targets: string[];
  usage?: string | null;
  examplePrompt?: string | null;
}): string {
  return resolveSkillInvokeCommand(options.name);
}

export function packageKeywords(
  pkg: Pick<PackageSummary, "name" | "description" | "targets" | "tags" | "categories">,
): string[] {
  return [
    pkg.name,
    pkg.description,
    ...displayTargets(pkg.targets),
    ...(pkg.tags ?? []),
    ...(pkg.categories ?? []),
  ].filter(Boolean);
}

export function installCommand(pkg: Pick<PackageSummary, "name" | "version">): string {
  return `aipm add ${pkg.name}@${pkg.version}`;
}

export function displayTargets(targets: string[]): string[] {
  return targets.includes("*") ? ["All tools"] : targets;
}

export function commandTargets(targets: string[]): string[] {
  return targets.includes("*") ? ["cursor", "claude"] : targets.filter((target) => target !== "*");
}

export function isImportedPackage(pkg: Pick<PackageSummary, "import" | "publisher">): boolean {
  return Boolean(pkg.import?.imported);
}

export function isUnverifiedImportedPackage(pkg: Pick<PackageSummary, "import" | "publisher">): boolean {
  return isImportedPackage(pkg) && pkg.publisher?.user.verified === false;
}

export function installCommandForTarget(pkg: Pick<PackageSummary, "name" | "version">, target: string): string {
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

export function formatInstallCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return "0 installs";
  if (count === 1) return "1 install";
  if (count < 1000) return `${count} installs`;
  const value = count / 1000;
  const formatted = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted}K installs`;
}

export function scanBadgeLabel(status: ScanStatus | undefined): string {
  switch (status) {
    case "clean":
      return "Scanned · no issues";
    case "flagged":
      return "Scanned · flagged";
    case "error":
      return "Scan incomplete";
    default:
      return "Not yet scanned";
  }
}

export function shortIntegrity(value: string): string {
  const [algorithm, hash] = value.split("-");
  if (!algorithm || !hash) return value.slice(0, 18);
  return `${algorithm}-${hash.slice(0, 14)}...`;
}

export const PACKAGE_TARGET_FILTERS = ["all", "cursor", "claude", "codex"] as const;
export const PACKAGE_SORT_OPTIONS = ["newest", "popular", "title"] as const;
export type PackageSortMode = (typeof PACKAGE_SORT_OPTIONS)[number];

export function skillListFromResponse<T>(data: { skills?: T[]; packages?: T[] } | null | undefined): T[] {
  return data?.skills ?? data?.packages ?? [];
}

export async function listPackages(
  query = "",
  limit = 50,
): Promise<PackageSummary[]> {
  const page = await listPackagesPage({ query, limit });
  return page.packages;
}

export async function listPackagesPage(options: {
  query?: string;
  limit?: number;
  cursor?: string | null;
  offset?: number | null;
  category?: string;
  target?: string;
  sort?: string;
  throwOnError?: boolean;
}): Promise<{
  packages: PackageSummary[];
  nextCursor: string | null;
  nextOffset: number | null;
}> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 50) });
  if (options.query) params.set("q", options.query);
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.offset != null && options.offset > 0) params.set("offset", String(options.offset));
  if (options.category && options.category !== "All") params.set("category", options.category);
  if (options.target && options.target !== "all") params.set("target", options.target);
  if (options.sort) params.set("sort", options.sort);
  try {
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/skills?${params}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`Package listing failed (${response.status})`);
    const data = (await response.json()) as {
      skills?: PackageSummary[];
      packages?: PackageSummary[];
      nextCursor?: string | null;
      nextOffset?: number | null;
    };
    const skills = skillListFromResponse(data);
    if (options.throwOnError && !Array.isArray(data.skills ?? data.packages)) {
      throw new Error("Package listing response is invalid");
    }
    return {
      packages: skills,
      nextCursor: data.nextCursor ?? null,
      nextOffset: data.nextOffset ?? null,
    };
  } catch (error) {
    // Network/timeout failures should not crash directory pages in local/dev.
    // throwOnError is for bad API responses after a successful connection.
    const isNetworkFailure =
      error instanceof TypeError ||
      (error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError" || /fetch failed/i.test(error.message)));
    if (options.throwOnError && !isNetworkFailure) throw error;
    return { packages: [], nextCursor: null, nextOffset: null };
  }
}

export type PublisherSummary = {
  slug: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  createdAt: string;
  packageCount: number;
  user: {
    githubLogin: string | null;
    name: string | null;
    avatarUrl: string | null;
    verified: boolean;
  };
};

export async function listPublishersPage(
  query = "",
  limit = 24,
  cursor?: string | null,
  throwOnError = false,
  offset?: number | null,
): Promise<{ publishers: PublisherSummary[]; nextCursor: string | null; nextOffset: number | null }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set("q", query);
  if (cursor) params.set("cursor", cursor);
  if (offset != null && offset > 0) params.set("offset", String(offset));
  try {
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/publishers?${params}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`Publisher listing failed (${response.status})`);
    const data = (await response.json()) as {
      publishers?: PublisherSummary[];
      nextCursor?: string | null;
      nextOffset?: number | null;
    };
    if (throwOnError && !Array.isArray(data.publishers)) {
      throw new Error("Publisher listing response is invalid");
    }
    return {
      publishers: data.publishers ?? [],
      nextCursor: data.nextCursor ?? null,
      nextOffset: data.nextOffset ?? null,
    };
  } catch (error) {
    const isNetworkFailure =
      error instanceof TypeError ||
      (error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError" || /fetch failed/i.test(error.message)));
    if (throwOnError && !isNetworkFailure) throw error;
    return { publishers: [], nextCursor: null, nextOffset: null };
  }
}

export async function getPackage(name: string, version: string): Promise<PackageDetail | null> {
  try {
    const response = await fetch(
      `${REGISTRY_API_BASE_URL}/v1/skills/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`,
      { next: { revalidate: 120 }, signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return null;
    return (await response.json()) as PackageDetail;
  } catch {
    return null;
  }
}
