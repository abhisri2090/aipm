import { REGISTRY_API_BASE_URL, type PackageSummary } from "./registry";

export const AGENT_SKILLS_REPORT_DATE = "2026-09-04";

export type AgentSkillsDatasetPackage = {
  name: string;
  version: string;
  description: string;
  targets: string[];
  license: string | null;
  sourceUrl: string | null;
  integrity: string;
  publishedAt: string;
  installs: number;
  publisher: string | null;
  verifiedPublisher: boolean;
  imported: boolean;
};

export type AgentSkillsSnapshot = {
  generatedAt: string;
  dataThrough: string | null;
  packages: AgentSkillsDatasetPackage[];
  totals: {
    packages: number;
    publishers: number;
    installs: number;
    sourceLinked: number;
    licenseDeclared: number;
    integrityProtected: number;
    imported: number;
    verifiedPublisher: number;
  };
  targets: Array<{ target: string; packages: number }>;
};

type PackageListResponse = {
  packages?: PackageSummary[];
  nextCursor?: string | null;
};

async function listAllPublicPackages(): Promise<PackageSummary[]> {
  const packages: PackageSummary[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/packages?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Registry returned ${response.status}`);

    const data = (await response.json()) as PackageListResponse;
    packages.push(...(data.packages ?? []));
    if (!data.nextCursor) break;
    cursor = data.nextCursor;
  }

  return packages;
}

export async function getAgentSkillsSnapshot(): Promise<AgentSkillsSnapshot> {
  const publicPackages = await listAllPublicPackages();
  const packages = publicPackages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    targets: pkg.targets,
    license: pkg.license,
    sourceUrl: pkg.sourceUrl ?? pkg.import?.sourceUrl ?? null,
    integrity: pkg.integrity,
    publishedAt: pkg.createdAt,
    installs: pkg.installCount ?? 0,
    publisher: pkg.publisher?.org.slug ?? null,
    verifiedPublisher: pkg.publisher?.user.verified === true,
    imported: pkg.import?.imported === true,
  }));
  const targetCounts = new Map<string, number>();

  for (const pkg of packages) {
    for (const target of pkg.targets) {
      const label = target === "*" ? "All supported tools" : target;
      targetCounts.set(label, (targetCounts.get(label) ?? 0) + 1);
    }
  }

  const publishedDates = packages
    .map((pkg) => Date.parse(pkg.publishedAt))
    .filter(Number.isFinite);

  return {
    generatedAt: new Date().toISOString(),
    dataThrough: publishedDates.length
      ? new Date(Math.max(...publishedDates)).toISOString()
      : null,
    packages,
    totals: {
      packages: packages.length,
      publishers: new Set(packages.map((pkg) => pkg.publisher).filter(Boolean)).size,
      installs: packages.reduce((total, pkg) => total + pkg.installs, 0),
      sourceLinked: packages.filter((pkg) => pkg.sourceUrl).length,
      licenseDeclared: packages.filter((pkg) => pkg.license?.trim()).length,
      integrityProtected: packages.filter((pkg) => pkg.integrity.startsWith("sha256-")).length,
      imported: packages.filter((pkg) => pkg.imported).length,
      verifiedPublisher: packages.filter((pkg) => pkg.verifiedPublisher).length,
    },
    targets: [...targetCounts]
      .map(([target, packageCount]) => ({ target, packages: packageCount }))
      .sort((a, b) => b.packages - a.packages || a.target.localeCompare(b.target)),
  };
}
