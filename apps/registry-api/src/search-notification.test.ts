import { afterEach, describe, expect, it, vi } from "vitest";
import { notifySearchEngines, packagePublicUrl, promptPublicUrl } from "./search-notification.js";

describe("search notifications", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.AIPM_PUBLIC_SITE_URL;
    delete process.env.INDEXNOW_ENABLED;
    delete process.env.NODE_ENV;
  });

  it("builds canonical prompt and package URLs", () => {
    process.env.AIPM_PUBLIC_SITE_URL = "https://aipm-registry.com/";
    expect(promptPublicUrl("a publisher", "use photos")).toBe(
      "https://www.aipm-registry.com/prompts/a%20publisher/use%20photos",
    );
    expect(packagePublicUrl("@team/code review", "1.0.0-beta.1")).toBe(
      "https://www.aipm-registry.com/packages/team/code%20review/1.0.0-beta.1",
    );
  });

  it("submits unique URLs to IndexNow", async () => {
    process.env.NODE_ENV = "production";
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const url = "https://www.aipm-registry.com/prompts/team/example";

    await expect(notifySearchEngines([url, url])).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      host: "www.aipm-registry.com",
      urlList: [url],
    });
  });

  it("does not contact IndexNow during tests", async () => {
    process.env.NODE_ENV = "test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(notifySearchEngines([
      "https://www.aipm-registry.com/prompts/team/example",
    ])).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
