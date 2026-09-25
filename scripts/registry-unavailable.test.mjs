import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as promptSitemap } from "../apps/web/app/prompt-sitemap.xml/route";
import { RegistryUnavailableError, getPrompt, listPromptsPage } from "../apps/web/lib/prompts";
import { listPackagesPage } from "../apps/web/lib/registry";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const rateLimited = () =>
  new Response(JSON.stringify({ statusCode: 429, error: "Too Many Requests" }), {
    status: 429,
    headers: { "retry-after": "1" },
  });

describe("directory pages degrade instead of 500 when the registry API fails", () => {
  it("marks prompt listings as failed on 429 without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rateLimited()));
    await expect(listPromptsPage({ limit: 40, sort: "newest" })).resolves.toEqual({
      prompts: [],
      nextCursor: null,
      nextOffset: null,
      total: 0,
      failed: true,
    });
  });

  it("marks successful prompt listings as not failed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ prompts: [], total: 0, nextCursor: null })));
    await expect(listPromptsPage({ limit: 40 })).resolves.toMatchObject({ failed: false });
  });

  it("marks skill listings as failed on 429/503 without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rateLimited()));
    await expect(listPackagesPage({ limit: 20 })).resolves.toMatchObject({ packages: [], failed: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(listPackagesPage({ limit: 20 })).resolves.toMatchObject({ packages: [], failed: true });
  });

  it("serves /prompt-sitemap.xml as a temporary 503 (never a partial list) when the API rate-limits", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rateLimited()));
    const response = await promptSitemap();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("120");
    expect(await response.text()).not.toContain("<urlset");
  });
});

describe("prompt detail fetches never turn a registry failure into a 404", () => {
  it("returns null only when the registry says the prompt does not exist", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(getPrompt("aipm", "missing")).resolves.toBeNull();
  });

  it("throws (so ISR keeps the stale page) on 429, 5xx and network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rateLimited()));
    await expect(getPrompt("aipm", "x")).rejects.toBeInstanceOf(RegistryUnavailableError);
    await expect(getPrompt("aipm", "x")).rejects.toThrow("Prompt fetch failed (429)");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(getPrompt("aipm", "x")).rejects.toThrow("Prompt fetch failed (503)");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(getPrompt("aipm", "x")).rejects.toThrow("Prompt fetch failed: fetch failed");
  });

  it("uses ISR revalidation instead of no-store", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ slug: "x" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getPrompt("aipm", "x")).resolves.toEqual({ slug: "x" });
    const init = fetchMock.mock.calls[0][1];
    expect(init.cache).toBeUndefined();
    expect(init.next).toEqual({ revalidate: 60 });
  });
});
