/**
 * Tiny inline markup for guide copy: `code` and [label](href).
 * Guides are plain strings; this keeps them plain while allowing paths,
 * commands and internal links to render properly.
 */
export type GuideInlineToken =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string }
  | { kind: "link"; label: string; href: string };

const INLINE_PATTERN = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function tokenizeGuideInline(text: string): GuideInlineToken[] {
  const tokens: GuideInlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ kind: "text", value: text.slice(last, index) });
    if (match[1] !== undefined) {
      tokens.push({ kind: "code", value: match[1] });
    } else {
      tokens.push({ kind: "link", label: match[2], href: match[3] });
    }
    last = index + match[0].length;
  }
  if (last < text.length) tokens.push({ kind: "text", value: text.slice(last) });
  return tokens;
}

/** Plain-text version for JSON-LD and meta fields. */
export function stripGuideInline(text: string): string {
  return tokenizeGuideInline(text)
    .map((token) => (token.kind === "link" ? token.label : token.value))
    .join("");
}

/** Internal hrefs used in guide copy, without #fragments. */
export function internalGuideHrefs(text: string): string[] {
  return tokenizeGuideInline(text)
    .filter((token): token is Extract<GuideInlineToken, { kind: "link" }> => token.kind === "link")
    .map((token) => token.href)
    .filter((href) => href.startsWith("/"))
    .map((href) => href.split("#")[0] || "/");
}

/** Section heading ids, e.g. "One table: which fields work where" -> "one-table-which-fields-work-where". */
export function guideSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[`'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
