import { afterEach, describe, expect, it, vi } from "vitest";
import { getPrompt } from "../apps/web/lib/prompts";

afterEach(() => vi.unstubAllGlobals());

describe("prompt availability", () => {
  it("returns a prompt when the registry finds it", async () => {
    const prompt = { slug: "code-review", title: "Code review" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(prompt)));
    await expect(getPrompt("team", "code-review")).resolves.toEqual(prompt);
  });

  it("returns null for a confirmed missing prompt", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(getPrompt("team", "missing")).resolves.toBeNull();
  });

  it.each([429, 500, 503])("does not turn a registry %s into a missing page", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(getPrompt("team", "code-review")).rejects.toThrow(`Prompt request failed (${status})`);
  });

  it("preserves a timeout instead of reporting a missing prompt", async () => {
    const error = new DOMException("Request timed out", "TimeoutError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
    await expect(getPrompt("team", "code-review")).rejects.toBe(error);
  });

  it("preserves invalid registry JSON as an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid json")));
    await expect(getPrompt("team", "code-review")).rejects.toBeInstanceOf(SyntaxError);
  });
});
