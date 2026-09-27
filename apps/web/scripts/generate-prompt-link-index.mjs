#!/usr/bin/env node
/**
 * Generates apps/web/lib/prompt-link-index.json: a small snapshot of every published prompt
 * (path, title, summary, category) used to render internal links between prompt pages
 * ("More in this series", "Related prompts") and the series hubs under /prompts/topics/*.
 *
 * Why a committed snapshot: the registry API is rate limited (shared 120 req/min behind nginx),
 * so prompt pages must not fan out to the API to find their siblings at render time. The link
 * graph is also checked by scripts/prompt-internal-links.test.mjs, which needs stable data.
 *
 * Usage:
 *   node apps/web/scripts/generate-prompt-link-index.mjs [--input prompts.json]
 * Without --input the public listing is read 100 prompts per request (about 10 requests).
 * Re-run after publishing new prompts; prompts missing from the snapshot still render and get
 * outbound links, they just are not linked *to* until the snapshot is refreshed.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = process.env.AIPM_REGISTRY_API_URL ?? "https://api.aipm-registry.com";
const OUTPUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../lib/prompt-link-index.json",
);

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

async function fetchAllSummaries() {
  const prompts = new Map();
  let cursor = null;
  let total = 0;
  do {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const page = await fetchJson(`${API}/v1/prompts?${params}`);
    total = Math.max(total, page.total ?? 0);
    for (const prompt of page.prompts ?? []) prompts.set(prompt.path, prompt);
    const next = page.nextCursor ?? null;
    if (next && next === cursor) throw new Error("Prompt pagination did not advance");
    cursor = next;
    // Stay far below the shared API rate limit.
    if (cursor) await new Promise((resolve) => setTimeout(resolve, 500));
  } while (cursor);
  if (prompts.size < total)
    throw new Error(`Prompt listing is incomplete (${prompts.size}/${total})`);
  return [...prompts.values()];
}

export function toLinkRecord(prompt) {
  const [, , publisher, slug] = prompt.path.split("/");
  return {
    path: prompt.path,
    publisher: prompt.publisher?.scope ?? decodeURIComponent(publisher),
    slug: prompt.slug ?? decodeURIComponent(slug),
    title: prompt.title,
    summary: prompt.summary ?? "",
    category: prompt.category,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const input = args.includes("--input") ? args[args.indexOf("--input") + 1] : null;
  const prompts = input
    ? JSON.parse(await readFile(input, "utf8"))
    : await fetchAllSummaries();
  const records = prompts
    .filter((prompt) => prompt?.path && prompt.title && prompt.category)
    .map(toLinkRecord)
    .sort((a, b) => a.path.localeCompare(b.path));
  if (records.length < prompts.length)
    throw new Error("Some prompts are missing path/title/category; refusing to write.");
  const generatedAt =
    process.env.PROMPT_LINK_INDEX_DATE ?? new Date().toLocaleDateString("en-CA");
  // One prompt per line keeps diffs readable when the snapshot is refreshed.
  const body = records.map((record) => `  ${JSON.stringify(record)}`).join(",\n");
  const json =
    `{\n "generatedAt": ${JSON.stringify(generatedAt)},\n "source": ${JSON.stringify(`${API}/v1/prompts`)},\n` +
    ` "count": ${records.length},\n "prompts": [\n${body}\n ]\n}\n`;
  JSON.parse(json);
  await writeFile(OUTPUT, json);
  console.log(`Wrote ${records.length} prompts to ${OUTPUT}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
