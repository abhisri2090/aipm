import { parse as parseYaml } from "yaml";

export type MarkdownFrontmatter = Record<string, unknown>;

export type MarkdownDocument = {
  frontmatter: MarkdownFrontmatter | null;
  body: string;
};

const FRONTMATTER_PATTERN = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function splitMarkdownDocument(source: string): MarkdownDocument {
  const normalized = source.replace(/^\uFEFF/, "");
  const match = FRONTMATTER_PATTERN.exec(normalized);
  if (!match) return { frontmatter: null, body: normalized };

  let parsed: unknown;
  try {
    parsed = parseYaml(match[1] ?? "");
  } catch {
    return { frontmatter: null, body: normalized };
  }

  if (!isRecord(parsed) || Object.keys(parsed).length === 0) {
    return { frontmatter: null, body: normalized };
  }

  return {
    frontmatter: parsed,
    body: normalized.slice(match[0].length),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
