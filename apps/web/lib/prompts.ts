import { REGISTRY_API_BASE_URL, type ScanInfo } from "./registry";

export const PROMPT_CATEGORIES = [
  "All",
  "Productivity",
  "Work",
  "Photo",
  "Travel",
  "Fun",
  "Learning",
  "Marketing",
  "Coding",
  "Playground",
] as const;

export const PROMPT_INPUT_TYPES = ["text", "image", "document", "code", "audio"] as const;
export const PROMPT_OUTPUT_TYPES = [
  "text",
  "image",
  "code",
  "structured-data",
  "audio",
  "video",
] as const;
export const PROMPT_OUTPUT_FILTERS = ["all", ...PROMPT_OUTPUT_TYPES] as const;

export type PromptVariable = {
  name: string;
  description: string;
  example: string;
  required: boolean;
};

export type PromptPublisher = {
  scope: string;
  kind: "individual" | "organization";
  org: { slug: string | null; name: string | null } | null;
  user: {
    username: string;
    githubLogin: string | null;
    name: string | null;
    avatarUrl: string | null;
    verified: boolean;
  };
};

export type PromptSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  inputTypes: string[];
  outputTypes: string[];
  effort: "quick" | "guided" | "advanced";
  language: string;
  copyCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  publisher: PromptPublisher;
  path: string;
  hasSampleImage: boolean;
  canEdit?: boolean;
  scan: ScanInfo;
};

export type PromptDetail = PromptSummary & {
  promptText: string;
  testedModels: string[];
  variables: PromptVariable[];
  exampleInput: string | null;
  exampleOutput: string | null;
  usageNotes: string | null;
  sourceUrl: string | null;
  license: string;
  sampleImageAlt: string | null;
  sampleImageUrl: string | null;
};

export function promptPath(prompt: Pick<PromptSummary, "publisher" | "slug">): string {
  return `/prompts/${encodeURIComponent(prompt.publisher.scope)}/${encodeURIComponent(prompt.slug)}`;
}

export function displayPromptType(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPromptDate(value: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(value),
  );
}

export function formatCopyCount(count: number): string {
  if (count === 1) return "1 copy";
  if (count < 1000) return `${count} copies`;
  return `${(count / 1000).toFixed(count >= 10_000 ? 0 : 1)}K copies`;
}

export async function listPrompts(query = ""): Promise<PromptSummary[]> {
  const page = await listPromptsPage({ query, limit: 100 });
  return page.prompts;
}

/** Prompt sitemap generation must include every page or fail instead of publishing a partial list. */
export async function listAllPrompts(): Promise<PromptSummary[]> {
  const prompts = new Map<string, PromptSummary>();
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  let expectedTotal = 0;
  do {
    const page = await listPromptsPage({ limit: 100, cursor, throwOnError: true });
    expectedTotal = Math.max(expectedTotal, page.total);
    for (const prompt of page.prompts) prompts.set(prompt.id, prompt);
    cursor = page.nextCursor;
    if (cursor && (seenCursors.has(cursor) || page.prompts.length === 0)) {
      throw new Error("Prompt pagination did not advance");
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);
  if (prompts.size < expectedTotal) throw new Error("Prompt listing is incomplete");
  return [...prompts.values()];
}

export async function listPromptsPage(options: {
  query?: string;
  limit?: number;
  cursor?: string | null;
  offset?: number | null;
  category?: string;
  output?: string;
  sort?: string;
  throwOnError?: boolean;
}): Promise<{
  prompts: PromptSummary[];
  nextCursor: string | null;
  nextOffset: number | null;
  total: number;
}> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 40) });
  if (options.query) params.set("q", options.query);
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.offset != null && options.offset > 0) params.set("offset", String(options.offset));
  if (options.category && options.category !== "All") params.set("category", options.category);
  if (options.output && options.output !== "all") params.set("output", options.output);
  if (options.sort) params.set("sort", options.sort);
  try {
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/prompts?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      throw new Error(`Prompt listing failed (${response.status})`);
    }
    const data = (await response.json()) as {
      prompts?: PromptSummary[];
      nextCursor?: string | null;
      nextOffset?: number | null;
      total?: number;
    };
    if (options.throwOnError && !Array.isArray(data.prompts)) {
      throw new Error("Prompt listing response is invalid");
    }
    return {
      prompts: data.prompts ?? [],
      nextCursor: data.nextCursor ?? null,
      nextOffset: data.nextOffset ?? null,
      total: data.total ?? data.prompts?.length ?? 0,
    };
  } catch (error) {
    if (options.throwOnError) throw error;
    return { prompts: [], nextCursor: null, nextOffset: null, total: 0 };
  }
}

export async function getPrompt(
  publisher: string,
  slug: string,
): Promise<PromptDetail | null> {
  try {
    const response = await fetch(
      `${REGISTRY_API_BASE_URL}/v1/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`,
      { cache: "no-store", signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return null;
    return (await response.json()) as PromptDetail;
  } catch {
    return null;
  }
}
