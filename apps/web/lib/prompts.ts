import { REGISTRY_API_BASE_URL } from "./registry";

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
  const params = new URLSearchParams({ limit: "100" });
  if (query) params.set("q", query);
  try {
    const response = await fetch(`${REGISTRY_API_BASE_URL}/v1/prompts?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { prompts?: PromptSummary[] };
    return data.prompts ?? [];
  } catch {
    return [];
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
