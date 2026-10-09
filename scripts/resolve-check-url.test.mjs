import { describe, expect, it } from "vitest";
import { resolveCheckUrl } from "../apps/web/scripts/resolve-check-url.mjs";

describe("resolveCheckUrl", () => {
  it("keeps query strings out of the pathname so /v1 rewrites still match", () => {
    const url = resolveCheckUrl("http://127.0.0.1:3000", "/v1/prompts?limit=1");
    expect(url.pathname).toBe("/v1/prompts");
    expect(url.search).toBe("?limit=1");
    expect(url.href).toBe("http://127.0.0.1:3000/v1/prompts?limit=1");
    expect(url.href).not.toContain("%3F");
  });

  it("resolves sitemap paths against the local origin", () => {
    const url = resolveCheckUrl("http://127.0.0.1:3000/", "/prompt-sitemap.xml");
    expect(url.href).toBe("http://127.0.0.1:3000/prompt-sitemap.xml");
  });

  it("preserves a base path prefix when joining", () => {
    const url = resolveCheckUrl("http://127.0.0.1:3000/preview", "/v1/skills?limit=1");
    expect(url.href).toBe("http://127.0.0.1:3000/preview/v1/skills?limit=1");
  });
});
