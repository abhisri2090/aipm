const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 32;

export function normalizeUsernameCandidate(value: string): string {
  const collapsed = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  let candidate = collapsed;
  if (!candidate || candidate.length < MIN_USERNAME_LENGTH) {
    candidate = `user-${collapsed || "member"}`;
  }

  candidate = candidate.slice(0, MAX_USERNAME_LENGTH).replace(/^-|-$/g, "");
  if (!candidate || candidate.length < MIN_USERNAME_LENGTH) {
    candidate = "user-member";
  }

  return isValidAipmUsername(candidate) ? candidate : "user-member";
}

export function isValidAipmUsername(value: string): boolean {
  return (
    value.length >= MIN_USERNAME_LENGTH &&
    value.length <= MAX_USERNAME_LENGTH &&
    USERNAME_REGEX.test(value)
  );
}

export function nextUsernameCandidate(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  const suffix = `-${attempt}`;
  const trimmedBase = base.slice(0, Math.max(MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH - suffix.length));
  return `${trimmedBase}${suffix}`;
}
