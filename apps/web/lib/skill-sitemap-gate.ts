import { humanizePackageSlug } from "./skill-serp";
import { packageShortName } from "./registry";

const MIN_DESCRIPTION_LENGTH = 40;
const YAML_ARTIFACTS = new Set([">", ">-", "|", "|-", "''", '""']);

export type SkillSitemapCandidate = {
  name: string;
  version: string;
  description: string;
  createdAt: string;
  installCount?: number | null;
  githubStars?: number | null;
  title?: string | null;
  displayName?: string | null;
  publisher?: { user?: { verified?: boolean | null } | null } | null;
  import?: { contentHash?: string | null } | null;
  scan?: { status?: string | null; scannedAt?: string | null } | null;
};

function normalizedTitle(value: string | null | undefined): string | null {
  const text = value?.trim().toLowerCase();
  return text ? text : null;
}

function hasRealDescription(skill: SkillSitemapCandidate): boolean {
  const description = skill.description.trim();
  if (description.length < MIN_DESCRIPTION_LENGTH) return false;
  if (YAML_ARTIFACTS.has(description)) return false;
  if (!/[a-z]/i.test(description)) return false;
  const short = packageShortName(skill.name);
  const titles = new Set(
    [skill.name, short, humanizePackageSlug(short), skill.title, skill.displayName]
      .map(normalizedTitle)
      .filter((value): value is string => Boolean(value)),
  );
  return !titles.has(description.toLowerCase());
}

function hasScanResult(skill: SkillSitemapCandidate): boolean {
  return skill.scan?.status === "clean" || skill.scan?.status === "flagged" || skill.scan?.status === "error";
}

function hasTrustSignal(skill: SkillSitemapCandidate, curated: ReadonlySet<string>): boolean {
  if (typeof skill.githubStars === "number" && skill.githubStars > 0) return true;
  if (typeof skill.installCount === "number" && skill.installCount > 0) return true;
  if (skill.publisher?.user?.verified === true) return true;
  return curated.has(skill.name);
}

function contentHash(skill: SkillSitemapCandidate): string | null {
  const hash = skill.import?.contentHash?.trim();
  return hash ? hash : null;
}

function time(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Earliest publish wins. The same timestamp keeps the most-starred copy. */
function isBetterOriginal(candidate: SkillSitemapCandidate, current: SkillSitemapCandidate): boolean {
  const candidateTime = time(candidate.createdAt);
  const currentTime = time(current.createdAt);
  if (candidateTime != null && currentTime != null && candidateTime !== currentTime) return candidateTime < currentTime;
  if (candidateTime != null && currentTime == null) return true;
  if (candidateTime == null && currentTime != null) return false;
  const stars = (candidate.githubStars ?? 0) - (current.githubStars ?? 0);
  if (stars !== 0) return stars > 0;
  return candidate.name.localeCompare(current.name) < 0;
}

/**
 * Skills that belong in the sitemap. Pages that fail stay live and linked;
 * they are only left out of the sitemap.
 */
export function selectSkillsForSitemap<T extends SkillSitemapCandidate>(
  skills: readonly T[],
  curatedNames: ReadonlySet<string>,
): T[] {
  const eligible = skills.filter(
    (skill) => hasRealDescription(skill) && hasScanResult(skill) && hasTrustSignal(skill, curatedNames),
  );
  const unique: T[] = [];
  const winners = new Map<string, T>();
  for (const skill of eligible) {
    const hash = contentHash(skill);
    if (!hash) {
      unique.push(skill);
      continue;
    }
    const current = winners.get(hash);
    if (!current || isBetterOriginal(skill, current)) winners.set(hash, skill);
  }
  return [...unique, ...winners.values()];
}

/** Later of version publish time and scan time. Null when neither is a real timestamp. */
export function skillSitemapLastmod(skill: {
  createdAt?: string | null;
  scan?: { scannedAt?: string | null } | null;
}): string | null {
  const times = [time(skill.createdAt), time(skill.scan?.scannedAt)].filter((value): value is number => value != null);
  if (times.length === 0) return null;
  return new Date(Math.max(...times)).toISOString();
}
