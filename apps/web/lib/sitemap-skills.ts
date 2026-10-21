import { REGISTRY_API_BASE_URL, skillListFromResponse, type PackageSummary } from "./registry";

type PackageListResponse = {
  skills?: PackageSummary[];
  packages?: PackageSummary[];
  nextCursor?: string | null;
};

/** Every public skill, or an error when a page cannot be read. Callers must not publish a partial list. */
export async function listSitemapSkills(): Promise<PackageSummary[]> {
  const packages: PackageSummary[] = [];
  let cursor: string | undefined;
  const seen = new Set<string>();

  for (let page = 0; page < 20; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/skills?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Skill listing failed (${response.status})`);
    const data = (await response.json()) as PackageListResponse;
    packages.push(...skillListFromResponse(data));
    if (!data.nextCursor) return packages;
    if (seen.has(data.nextCursor)) throw new Error("Skill listing cursor repeated");
    seen.add(data.nextCursor);
    cursor = data.nextCursor;
  }

  throw new Error("Skill listing did not finish");
}
