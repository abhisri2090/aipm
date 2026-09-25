import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as promptSitemap } from "../apps/web/app/prompt-sitemap.xml/route";
import { listPromptsPage } from "../apps/web/lib/prompts";
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
