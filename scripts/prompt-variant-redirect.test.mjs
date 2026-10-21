import { afterEach, describe, expect, it, vi } from "vitest";
import { baseSlugForRemovedVariant, redirectPathForMissingPrompt } from "../apps/web/lib/prompt-variant-redirect.ts";
import { proxy } from "../apps/web/proxy.ts";

function request(url) {
  return { url, nextUrl: new URL(url) };
}

afterEach(() => vi.unstubAllGlobals());

describe("removed numbered prompt variants", () => {
  it("reads the base slug for a trailing -2 through -9", () => {
    expect(baseSlugForRemovedVariant("life-time-block-week-founder-3")).toBe("life-time-block-week-founder");
    expect(baseSlugForRemovedVariant("weekly-plan-2")).toBe("weekly-plan");
    expect(baseSlugForRemovedVariant("weekly-plan-9")).toBe("weekly-plan");
    expect(baseSlugForRemovedVariant("weekly-plan-1")).toBeNull();
    expect(baseSlugForRemovedVariant("weekly-plan-10")).toBeNull();
    expect(baseSlugForRemovedVariant("weekly-plan")).toBeNull();
  });

  it("returns a 301 path only when the numbered slug is missing and the base prompt exists", async () => {
    const lookup = vi.fn(async (_publisher, slug) =>
      slug === "life-time-block-week-founder" ? { path: "/prompts/aipm/life-time-block-week-founder" } : null,
    );
    await expect(redirectPathForMissingPrompt("aipm", "life-time-block-week-founder-3", lookup)).resolves.toBe(
      "/prompts/aipm/life-time-block-week-founder",
    );
    await expect(redirectPathForMissingPrompt("aipm", "missing-thing-2", lookup)).resolves.toBeNull();
    await expect(redirectPathForMissingPrompt("aipm", "already-canonical", lookup)).resolves.toBeNull();
    expect(lookup).not.toHaveBeenCalledWith("aipm", "already-canonical");
  });

  it("sends a 301 when the numbered prompt is missing and the base prompt exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input) => {
        const url = String(input);
        if (url.endsWith("/life-time-block-week-founder-3")) return new Response(null, { status: 404 });
        if (url.endsWith("/life-time-block-week-founder")) {
          return Response.json({ path: "/prompts/aipm/life-time-block-week-founder" });
        }
        return new Response(null, { status: 404 });
      }),
    );
    const response = await proxy(
      request("https://www.aipm-registry.com/prompts/aipm/life-time-block-week-founder-3"),
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://www.aipm-registry.com/prompts/aipm/life-time-block-week-founder",
    );
  });

  it("returns 503 with Retry-After when a skill lookup fails transiently", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })));
    const response = await proxy(request("https://www.aipm-registry.com/skills/acme/review/1.0.0"));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
  });
});
