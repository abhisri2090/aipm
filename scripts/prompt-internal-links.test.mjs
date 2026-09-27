import { describe, expect, it } from "vitest";
import snapshot from "../apps/web/lib/prompt-link-index.json";
import noindexData from "../apps/web/lib/prompt-noindex.json";
import { PROMPT_TOPIC_HUBS } from "../apps/web/lib/prompt-topics";
import {
  getPromptInternalLinks,
  getPromptLinkGraph,
  listGeneratedSeriesHubs,
  listSeriesWithHubs,
} from "../apps/web/lib/prompt-links";
import {
  RELATED_LINK_CAP,
  SERIES_LINK_CAP,
  SERIES_META,
  buildPromptLinkGraph,
  midSentenceLabel,
  seriesHubDescription,
  seriesHubTitle,
} from "../apps/web/lib/prompt-series";
import sitemap from "../apps/web/app/sitemap";

const MIN_INBOUND = 3;
const MAX_CLICKS_FROM_PROMPTS = 3;
const noindexed = new Set(noindexData.noindex.map((entry) => entry.path));
const topicSlugs = new Set(PROMPT_TOPIC_HUBS.map((hub) => hub.slug));

/**
 * The internal-link graph a crawler sees, built only from links this repo renders server-side:
 * /prompts -> every series hub and curated topic hub; hubs -> their prompts and sibling hubs;
 * prompt pages -> series hub, "More in this series" and "Related prompts".
 * The paginated /prompts?page=N directory is deliberately left out (conservative).
 */
function buildCrawlGraph() {
  const graph = getPromptLinkGraph();
  const edges = new Map();
  const link = (from, to) => {
    if (!edges.has(from)) edges.set(from, new Set());
    edges.get(from).add(to);
  };
  const hubs = listSeriesWithHubs();
  for (const hub of PROMPT_TOPIC_HUBS) link("/prompts", `/prompts/topics/${hub.slug}`);
  for (const series of hubs) link("/prompts", series.hubPath);

  for (const hub of PROMPT_TOPIC_HUBS) {
    const from = `/prompts/topics/${hub.slug}`;
    for (const slug of hub.promptSlugs) link(from, `/prompts/${hub.publisher}/${slug}`);
    for (const other of PROMPT_TOPIC_HUBS)
      if (other.slug !== hub.slug) link(from, `/prompts/topics/${other.slug}`);
  }
  for (const series of hubs) {
    for (const member of series.members) link(series.hubPath, member.path);
    for (const sibling of hubs) {
      if (sibling.category === series.category && sibling.id !== series.id)
        link(series.hubPath, sibling.hubPath);
    }
  }
  for (const prompt of snapshot.prompts) {
    const links = getPromptInternalLinks(prompt);
    if (links.series?.hubPath) link(prompt.path, links.series.hubPath);
    for (const target of [...links.seriesLinks, ...links.relatedLinks])
      link(prompt.path, target.path);
  }
  return { graph, edges };
}

describe("prompt internal link graph", () => {
  const { graph, edges } = buildCrawlGraph();
  const indexablePrompts = snapshot.prompts.filter(
    (prompt) => !noindexed.has(prompt.path),
  );

  it("covers the whole snapshot", () => {
    expect(snapshot.prompts.length).toBe(snapshot.count);
    expect(indexablePrompts.length).toBe(graph.indexable.length);
    expect(indexablePrompts.length).toBeGreaterThan(900);
  });

  it("never links to a noindexed prompt (from any page, including noindexed ones)", () => {
    for (const [from, targets] of edges) {
      for (const to of targets) {
        if (noindexed.has(to)) throw new Error(`${from} links to noindexed ${to}`);
      }
    }
    for (const series of graph.series)
      for (const member of series.members) expect(noindexed.has(member.path)).toBe(false);
  });

  it(`gives every indexable prompt at least ${MIN_INBOUND} inbound links from other indexable pages`, () => {
    const inbound = new Map(indexablePrompts.map((prompt) => [prompt.path, new Set()]));
    for (const [from, targets] of edges) {
      if (noindexed.has(from)) continue; // noindex pages do not count as referrers
      for (const to of targets)
        if (to !== from && inbound.has(to)) inbound.get(to).add(from);
    }
    const weak = [...inbound]
      .filter(([, sources]) => sources.size < MIN_INBOUND)
      .map(([path, sources]) => `${path} (${sources.size})`);
    expect(weak).toEqual([]);
  });

  it(`reaches every indexable prompt from /prompts within ${MAX_CLICKS_FROM_PROMPTS} clicks`, () => {
    const depth = new Map([["/prompts", 0]]);
    const queue = ["/prompts"];
    while (queue.length) {
      const page = queue.shift();
      if (noindexed.has(page)) continue;
      for (const next of edges.get(page) ?? []) {
        if (depth.has(next)) continue;
        depth.set(next, depth.get(page) + 1);
        queue.push(next);
      }
    }
    const far = indexablePrompts
      .filter((prompt) => !(depth.get(prompt.path) <= MAX_CLICKS_FROM_PROMPTS))
      .map((prompt) => `${prompt.path} (${depth.get(prompt.path) ?? "unreachable"})`);
    expect(far).toEqual([]);
  });

  it("caps links per page and keeps related prompts outside the page's own series", () => {
    for (const prompt of snapshot.prompts) {
      const links = getPromptInternalLinks(prompt);
      expect(links.seriesLinks.length).toBeLessThanOrEqual(SERIES_LINK_CAP);
      expect(links.relatedLinks.length).toBeLessThanOrEqual(RELATED_LINK_CAP);
      const all = [...links.seriesLinks, ...links.relatedLinks].map((item) => item.path);
      expect(new Set(all).size).toBe(all.length);
      expect(all).not.toContain(prompt.path);
      for (const related of links.relatedLinks) {
        if (links.series)
          expect(graph.seriesByPath.get(related.path)).not.toBe(links.series);
      }
    }
  });

  it("is deterministic for the same snapshot", () => {
    const again = buildPromptLinkGraph(snapshot.prompts, noindexed, {
      topicHubSlugs: topicSlugs,
    });
    for (const prompt of indexablePrompts) {
      expect(again.linksFor(prompt).relatedLinks).toEqual(
        graph.linksFor(prompt).relatedLinks,
      );
      expect(again.linksFor(prompt).seriesLinks).toEqual(
        graph.linksFor(prompt).seriesLinks,
      );
    }
  });
});

describe("prompt series", () => {
  const graph = getPromptLinkGraph();
  const seriesOf = (slug) => graph.seriesByPath.get(`/prompts/aipm/${slug}`)?.id;

  it("groups by slug stem and category, with manual overrides", () => {
    expect(seriesOf("linkedin-dp-flat-vector")).toBe("Photo/linkedin-dp");
    expect(seriesOf("linkedin-banner-name-tagline")).toBe("Photo/linkedin-banner");
    expect(seriesOf("chatgpt-executive-headshot")).toBe("Photo/linkedin-headshot");
    expect(seriesOf("code-rate-limit-design-python")).toBe(
      "Coding/code-rate-limit-design",
    );
    expect(seriesOf("code-rate-limit-design-swift")).toBe(
      "Coding/code-rate-limit-design",
    );
    expect(seriesOf("edu-project-biology-grade-8")).toBe("Learning/edu-project");
    expect(seriesOf("edu-project-based-unit")).toBe("Learning/edu");
    expect(seriesOf("marketing-dental-cold-email")).toBe("Marketing/marketing-dental");
  });

  it("has unique hub slugs, curated copy for every series, and no clash with curated topic hubs", () => {
    const slugs = graph.series.map((series) => series.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const series of graph.series) {
      expect(SERIES_META[series.id], `add SERIES_META for ${series.id}`).toBeDefined();
      if (!series.curatedHub) expect(topicSlugs.has(series.slug)).toBe(false);
      expect(series.members.length).toBeGreaterThanOrEqual(3);
      expect(seriesHubTitle(series).length).toBeLessThanOrEqual(70);
      expect(seriesHubDescription(series).length).toBeLessThanOrEqual(240);
    }
  });

  it("keeps proper nouns when a label is used mid-sentence", () => {
    expect(midSentenceLabel("Old photo restoration prompts")).toBe(
      "old photo restoration prompts",
    );
    expect(midSentenceLabel("LinkedIn profile picture (DP) prompts")).toBe(
      "LinkedIn profile picture (DP) prompts",
    );
    expect(midSentenceLabel("Midjourney art style prompts")).toBe(
      "Midjourney art style prompts",
    );
    expect(midSentenceLabel("API rate limit design prompts")).toBe(
      "API rate limit design prompts",
    );
  });

  it("lists every generated series hub in the sitemap", async () => {
    const urls = new Set((await sitemap()).map((entry) => new URL(entry.url).pathname));
    for (const series of listGeneratedSeriesHubs())
      expect(urls.has(series.hubPath)).toBe(true);
  });
});
