import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import { buildPromptSitemapXml } from "../apps/web/lib/prompt-sitemap";
import { listAllPrompts, listPromptsPage } from "../apps/web/lib/prompts";

afterEach(() => vi.unstubAllGlobals());
const prompt = (i) => ({
  id: String(i),
  path: `/prompts/team/prompt-${i}`,
  updatedAt: "2026-09-14T00:00:00Z",
});

describe("complete prompt sitemap", () => {
  it("lists every prompt in /prompt-sitemap.xml, including pages beyond the first 100", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          prompts: Array.from({ length: 100 }, (_, i) => prompt(i)),
          total: 109,
          nextCursor: "page-two",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          prompts: Array.from({ length: 9 }, (_, i) => prompt(i + 100)),
          total: 109,
          nextCursor: null,
        }),
      );
    vi.stubGlobal("fetch", fetch);

    const xml = await buildPromptSitemapXml();
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("/prompts/team/prompt-0");
    expect(xml).toContain("/prompts/team/prompt-108");
    expect(xml).toContain("<lastmod>2026-09-14T00:00:00.000Z</lastmod>");
    expect(fetch.mock.calls[1][0]).toContain("cursor=page-two");
  });

  it("keeps individual prompt URLs out of the static /sitemap.xml", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ prompts: [prompt(0)], total: 1, nextCursor: null })),
    );
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url.endsWith("/prompts"))).toBe(true);
    expect(entries.every((entry) => !/\/prompts\/[^/]+\/[^/]+/.test(entry.url))).toBe(true);
  });

  it("fails generation when a later API page fails instead of returning a partial sitemap", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ prompts: [prompt(0)], total: 2, nextCursor: "next" }))
        .mockResolvedValueOnce(new Response(null, { status: 429 })),
    );
    await expect(buildPromptSitemapXml()).rejects.toThrow("Prompt listing failed (429)");
  });

  it("stops repeated cursors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        Response.json({ prompts: [prompt(0)], nextCursor: "same", total: 2 }),
      ),
    );
    await expect(listAllPrompts()).rejects.toThrow("did not advance");
  });

  it("rejects missing prompts in a malformed API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "unavailable" })));
    await expect(listAllPrompts()).rejects.toThrow("response is invalid");
  });

  it("rejects early pagination termination when records are missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ prompts: [prompt(0)], total: 2, nextCursor: null })),
    );
    await expect(listAllPrompts()).rejects.toThrow("incomplete");
  });

  it("deduplicates the same prompt across pages", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ prompts: [prompt(0)], total: 2, nextCursor: "next" }))
        .mockResolvedValueOnce(
          Response.json({ prompts: [prompt(0), prompt(1)], total: 2, nextCursor: null }),
        ),
    );
    await expect(listAllPrompts()).resolves.toHaveLength(2);
  });

  it("allows an empty registry and retains graceful failures for normal directory reads", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ prompts: [], total: 0, nextCursor: null }))
        .mockResolvedValueOnce(new Response(null, { status: 503 })),
    );
    await expect(listAllPrompts()).resolves.toEqual([]);
    await expect(listPromptsPage({ limit: 20 })).resolves.toMatchObject({ prompts: [], total: 0 });
  });
});
