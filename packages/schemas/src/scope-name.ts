/** @scope/name — lowercase scope and package segments */
export const SCOPE_NAME_REGEX =
  /^@[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

/** Matches @scope/name@version so search can use the package name alone. */
const PACKAGE_NAME_WITH_VERSION_REGEX =
  /^(@[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)@[^\s]+$/i;

export function isValidScopeName(name: string): boolean {
  return SCOPE_NAME_REGEX.test(name);
}

/** Normalize admin/registry search input; strips trailing @version when present. */
export function normalizePackageSearchQuery(query: string): string {
  const trimmed = query.trim().toLowerCase();
  const withVersion = trimmed.match(PACKAGE_NAME_WITH_VERSION_REGEX);
  if (withVersion?.[1]) return withVersion[1];
  return trimmed;
}

export function shortNameFromScopeName(name: string): string {
  const slash = name.indexOf("/");
  if (slash === -1) return name;
  return name.slice(slash + 1);
}

export function parseScopeName(name: string): { scope: string; package: string } {
  if (!isValidScopeName(name)) {
    throw new Error(`Invalid package name "${name}". Expected @scope/name.`);
  }
  const slash = name.indexOf("/");
  return {
    scope: name.slice(1, slash),
    package: name.slice(slash + 1),
  };
}
