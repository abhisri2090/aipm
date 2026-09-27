import snapshot from "./prompt-link-index.json";
import noindexData from "./prompt-noindex.json";
import { PROMPT_TOPIC_HUBS } from "./prompt-topics";
import {
  buildPromptLinkGraph,
  type PromptInternalLinks,
  type PromptLinkGraph,
  type PromptLinkRecord,
  type PromptSeries,
} from "./prompt-series";

/**
 * Internal links for prompt pages, computed from the committed prompt snapshot
 * (lib/prompt-link-index.json, regenerate with `node apps/web/scripts/generate-prompt-link-index.mjs`).
 * No registry API calls: the graph is built once per server process from static data.
 */

const KEPT_PATH_BY_NOINDEX = new Map(
  noindexData.noindex.map((entry) => [entry.path, entry.keptPath]),
);

let graph: PromptLinkGraph | null = null;

export function getPromptLinkGraph(): PromptLinkGraph {
  graph ??= buildPromptLinkGraph(
    snapshot.prompts as PromptLinkRecord[],
    new Set(KEPT_PATH_BY_NOINDEX.keys()),
    { topicHubSlugs: new Set(PROMPT_TOPIC_HUBS.map((hub) => hub.slug)) },
  );
  return graph;
}

export function getPromptInternalLinks(
  prompt: Pick<PromptLinkRecord, "path" | "slug" | "category">,
): PromptInternalLinks {
  return getPromptLinkGraph().linksFor(prompt, {
    keptPath: KEPT_PATH_BY_NOINDEX.get(prompt.path),
  });
}

/** Series with their own generated hub page (curated topic hubs are served from lib/prompt-topics.ts). */
export function listGeneratedSeriesHubs(): PromptSeries[] {
  return getPromptLinkGraph().series.filter(
    (series) => series.hubPath && !series.curatedHub,
  );
}

/** Every series with a hub (generated or curated), for the /prompts index. */
export function listSeriesWithHubs(): PromptSeries[] {
  return getPromptLinkGraph().series.filter((series) => series.hubPath);
}

export function getGeneratedSeriesHub(slug: string): PromptSeries | undefined {
  const series = getPromptLinkGraph().seriesBySlug.get(slug);
  return series && series.hubPath && !series.curatedHub ? series : undefined;
}

/** The series that shares a curated topic hub (e.g. linkedin-headshots), if any. */
export function getSeriesForTopicHub(topicSlug: string): PromptSeries | undefined {
  const series = getPromptLinkGraph().seriesBySlug.get(topicSlug);
  return series?.curatedHub ? series : undefined;
}

export const PROMPT_LINK_SNAPSHOT_DATE = snapshot.generatedAt;
