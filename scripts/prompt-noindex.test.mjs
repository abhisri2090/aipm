import { afterEach, describe, expect, it, vi } from "vitest";
import noindexData from "../apps/web/lib/prompt-noindex.json";
import { PROMPT_TOPIC_HUBS } from "../apps/web/lib/prompt-topics";
import { buildPromptSitemapXml } from "../apps/web/lib/prompt-sitemap";
import { findNearDuplicates, jaccard, shingles } from "../apps/web/scripts/generate-prompt-noindex.mjs";

afterEach(() => vi.unstubAllGlobals());

const template = (item) =>
  `Create a studio product photo of a ${item} on a seamless backdrop. Use soft key light from the left, ` +
  "a subtle rim light, a clean reflection, and a shallow depth of field. Keep labels readable and do not " +
  "invent logos. Output one square hero image and one vertical crop for social media.";

describe("near-duplicate prompt rule", () => {
  it("ignores {{variables}} and measures word 5-gram overlap", () => {
    expect(jaccard(shingles("one two three four five {{x}}"), shingles("one two three four five {{y}}"))).toBe(1);
    expect(jaccard(shingles("alpha beta gamma delta epsilon"), shingles("zeta eta theta iota kappa"))).toBe(0);
  });

  it("keeps one prompt per template family and never noindexes protected paths", () => {
    const prompts = [
      { path: "/prompts/aipm/mug", promptText: template("ceramic mug"), publishedAt: "2026-09-02" },
      { path: "/prompts/aipm/bottle", promptText: template("water bottle"), publishedAt: "2026-09-01" },
      { path: "/prompts/aipm/lamp", promptText: template("desk lamp"), publishedAt: "2026-09-03" },
      { path: "/prompts/aipm/unique", promptText: "Write a weekly budget review that compares planned and actual spend by category." },
    ];
    const { noindex } = findNearDuplicates(prompts, { threshold: 0.6, protectedPaths: new Set(["/prompts/aipm/lamp"]) });
    expect(noindex.map((entry) => entry.path)).toEqual(["/prompts/aipm/bottle", "/prompts/aipm/mug"]);
    expect(noindex.every((entry) => entry.keptPath === "/prompts/aipm/lamp")).toBe(true);
  });

  it("generated list never contains GSC or topic hub prompts, and every noindexed page has an indexable twin", () => {
    const noindexed = new Set(noindexData.noindex.map((entry) => entry.path));
    for (const path of noindexData.gscPaths) expect(noindexed.has(path)).toBe(false);
    for (const hub of PROMPT_TOPIC_HUBS) {
      for (const slug of hub.promptSlugs) expect(noindexed.has(`/prompts/${hub.publisher}/${slug}`)).toBe(false);
    }
    for (const entry of noindexData.noindex) {
      expect(noindexed.has(entry.keptPath)).toBe(false);
      expect(entry.similarity).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("leaves near-duplicate prompts out of /prompt-sitemap.xml", async () => {
    const duplicate = noindexData.noindex[0].path;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          prompts: [
            { id: "1", path: duplicate, updatedAt: "2026-09-14T00:00:00Z" },
            { id: "2", path: noindexData.noindex[0].keptPath, updatedAt: "2026-09-14T00:00:00Z" },
          ],
          total: 2,
          nextCursor: null,
        }),
      ),
    );
    const xml = await buildPromptSitemapXml();
    expect(xml).not.toContain(duplicate);
    expect(xml).toContain(noindexData.noindex[0].keptPath);
  });
});
