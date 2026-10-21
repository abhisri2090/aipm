const NUMBERED_VARIANT = /^(.+)-([2-9])$/;

/** Base slug for a removed duplicate such as `weekly-plan-3`. Null when the slug is not a -2..-9 copy. */
export function baseSlugForRemovedVariant(slug: string): string | null {
  const match = NUMBERED_VARIANT.exec(slug);
  const base = match?.[1];
  if (!base) return null;
  return base;
}

/**
 * Where to send a missing `/prompts/:publisher/:slug` when the slug is a numbered copy.
 * Returns null when this slug is not a -2..-9 variant, or when the base prompt is also missing.
 */
export async function redirectPathForMissingPrompt(
  publisher: string,
  slug: string,
  lookup: (publisher: string, slug: string) => Promise<{ path: string } | null>,
): Promise<string | null> {
  const base = baseSlugForRemovedVariant(slug);
  if (!base) return null;
  const canonical = await lookup(publisher, base);
  return canonical?.path ?? null;
}
