#!/usr/bin/env node
/**
 * Generates apps/web/lib/prompt-noindex.json: prompt pages that are near-duplicates of
 * another prompt and should be `noindex, follow` and left out of /prompt-sitemap.xml.
 *
 * Rule (documented in docs/SEO_THIN_PAGE_RULE.md):
 *   1. Normalise each prompt's promptText: lowercase, strip {{variables}} and [placeholders],
 *      keep only [a-z0-9] words.
 *   2. Compare word 5-gram sets with Jaccard similarity.
 *   3. Walk prompts in keep-priority order (protected URL first, then one with a sample image,
 *      then the earliest published, then path order). A prompt whose similarity to an
 *      already-kept prompt is >= THRESHOLD (0.9) is noindexed; otherwise it is kept.
 *      At 0.9 this only catches entity-swap variants (same template, different product/role).
 *   4. Protected URLs are never noindexed: any prompt URL that has appeared in Google Search
 *      Console exports (--protect files; remembered in the JSON across runs) and every prompt
 *      curated on a /prompts/topics/* hub (read from lib/prompt-topics.ts).
 *
 * Usage:
 *   node apps/web/scripts/generate-prompt-noindex.mjs [--input prompts.json] [--protect file.csv ...]
 * Without --input, prompt details are fetched from the public registry API (4 at a time).
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const THRESHOLD = 0.9;
export const SHINGLE_SIZE = 5;
const API = process.env.AIPM_REGISTRY_API_URL ?? "https://api.aipm-registry.com";
const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), "../lib/prompt-noindex.json");

export function shingles(text, size = SHINGLE_SIZE) {
  const words = (text ?? "")
    .toLowerCase()
    .replace(/\{\{?[^}]*\}\}?|\[[^\]]*\]/g, " ")
    .match(/[a-z0-9]+/g) ?? [];
  const set = new Set();
  for (let i = 0; i + size <= words.length; i += 1) set.add(words.slice(i, i + size).join(" "));
  if (set.size === 0 && words.length > 0) set.add(words.join(" "));
  return set;
}

export function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of small) if (large.has(item)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/**
 * Greedy, chain-free clustering: walk prompts in "keep" priority order; a prompt is noindexed
 * only when it is >= threshold similar to a prompt that already stays indexable. Every
 * noindexed page therefore has an indexable near-twin (keptPath).
 * @param {{path: string, promptText: string, publishedAt?: string, hasSampleImage?: boolean}[]} prompts
 */
export function findNearDuplicates(prompts, { threshold = THRESHOLD, protectedPaths = new Set() } = {}) {
  const sets = prompts.map((prompt) => shingles(prompt.promptText));
  const rank = (i) => [
    protectedPaths.has(prompts[i].path) ? 0 : 1,
    prompts[i].hasSampleImage ? 0 : 1,
    Date.parse(prompts[i].publishedAt ?? "") || Number.MAX_SAFE_INTEGER,
    prompts[i].path,
  ];
  const compare = (a, b) => {
    const [ra, rb] = [rank(a), rank(b)];
    for (let k = 0; k < ra.length; k += 1) {
      if (ra[k] < rb[k]) return -1;
      if (ra[k] > rb[k]) return 1;
    }
    return 0;
  };
  const order = prompts.map((_, i) => i).sort(compare);

  const kept = [];
  const keptWithTwins = new Set();
  const noindex = [];
  for (const i of order) {
    let best = { index: -1, similarity: 0 };
    if (!protectedPaths.has(prompts[i].path)) {
      for (const k of kept) {
        const similarity = jaccard(sets[i], sets[k]);
        if (similarity >= threshold && similarity > best.similarity) best = { index: k, similarity };
      }
    }
    if (best.index === -1) {
      kept.push(i);
      continue;
    }
    keptWithTwins.add(best.index);
    noindex.push({
      path: prompts[i].path,
      keptPath: prompts[best.index].path,
      similarity: Math.floor(best.similarity * 1000) / 1000,
    });
  }
  noindex.sort((a, b) => a.path.localeCompare(b.path));
  return { clusters: keptWithTwins.size, noindex };
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

async function fetchAllPrompts() {
  const summaries = [];
  let cursor = null;
  do {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const page = await fetchJson(`${API}/v1/prompts?${params}`);
    summaries.push(...(page.prompts ?? []));
    cursor = page.nextCursor ?? null;
  } while (cursor);
  const details = [];
  for (let i = 0; i < summaries.length; i += 4) {
    const batch = summaries.slice(i, i + 4).map((summary) => {
      const [, , publisher, slug] = summary.path.split("/");
      return fetchJson(`${API}/v1/prompts/${publisher}/${slug}`).then((data) => data.prompt ?? data);
    });
    details.push(...(await Promise.all(batch)));
  }
  return details;
}

async function readProtectedPaths(files) {
  const paths = new Set();
  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/(\/prompts\/[a-z0-9-]+\/[a-z0-9-]+)/gi)) paths.add(match[1]);
  }
  return paths;
}

/** Prompts curated on /prompts/topics/* hubs are always kept indexable. */
async function readTopicHubPaths() {
  const source = await readFile(join(dirname(OUTPUT), "prompt-topics.ts"), "utf8");
  const paths = new Set();
  for (const hub of source.matchAll(/publisher:\s*"([^"]+)",\s*promptSlugs:\s*\[([^\]]*)\]/g)) {
    for (const slug of hub[2].matchAll(/"([^"]+)"/g)) paths.add(`/prompts/${hub[1]}/${slug[1]}`);
  }
  if (paths.size === 0) throw new Error("Could not read curated prompt paths from lib/prompt-topics.ts");
  return paths;
}

async function main() {
  const args = process.argv.slice(2);
  const input = args.includes("--input") ? args[args.indexOf("--input") + 1] : null;
  const protectFiles = args.flatMap((arg, i) => (arg === "--protect" ? [args[i + 1]] : []));

  let previous = { gscPaths: [] };
  try {
    previous = JSON.parse(await readFile(OUTPUT, "utf8"));
  } catch {
    // first run
  }
  // Protected = URLs seen in Google Search Console (kept across runs) + topic hub prompts.
  const gscPaths = new Set([...(previous.gscPaths ?? []), ...(await readProtectedPaths(protectFiles))]);
  const hubPaths = await readTopicHubPaths();
  const protectedPaths = new Set([...gscPaths, ...hubPaths]);
  const prompts = input ? JSON.parse(await readFile(input, "utf8")) : await fetchAllPrompts();
  const withText = prompts.filter((prompt) => prompt?.path && typeof prompt.promptText === "string");
  if (withText.length < prompts.length) throw new Error("Some prompts are missing promptText; refusing to write a partial list.");

  const { clusters, noindex } = findNearDuplicates(withText, { protectedPaths });
  const output = {
    generatedAt: new Date().toISOString().slice(0, 10),
    rule: `promptText word ${SHINGLE_SIZE}-gram Jaccard >= ${THRESHOLD}; keep one prompt per cluster; never noindex protected (GSC) URLs. See docs/SEO_THIN_PAGE_RULE.md.`,
    promptsAnalyzed: withText.length,
    clusters,
    gscPaths: [...gscPaths].sort(),
    topicHubPaths: [...hubPaths].sort(),
    noindex,
  };
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Analyzed ${withText.length} prompts: ${clusters} clusters, ${noindex.length} noindexed.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
