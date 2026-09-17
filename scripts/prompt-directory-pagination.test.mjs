import React from "../apps/web/node_modules/react";
import { renderToStaticMarkup } from "../apps/web/node_modules/react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../apps/web/components/prompt-directory", () => ({
  PromptDirectory: () => React.createElement("div"),
}));

import PromptsPage, { generateMetadata } from "../apps/web/app/prompts/page";

vi.stubGlobal("React", React);

const prompt = (number) => ({
  id: `prompt-${number}`,
  slug: `prompt-${number}`,
  title: `Prompt ${number}`,
  summary: `Summary ${number}`,
  category: "Work",
  tags: [],
  inputTypes: ["text"],
  outputTypes: ["text"],
  copyCount: 0,
  updatedAt: "2026-09-14T00:00:00Z",
  publisher: {
    scope: "publisher",
    user: { username: "publisher", name: "Publisher", avatarUrl: null, verified: false },
    org: null,
  },
  path: `/prompts/publisher/prompt-${number}`,
});

afterEach(() => vi.unstubAllGlobals());

describe("crawlable prompt directory pagination", () => {
  it("renders page-2 structured data and sequential links in the HTML", async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        prompts: Array.from({ length: 40 }, (_, index) => prompt(index + 41)),
        total: 109,
        nextOffset: 80,
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const html = renderToStaticMarkup(
      await PromptsPage({ searchParams: Promise.resolve({ page: "2" }) }),
    );
    expect(fetch.mock.calls[0][0]).toContain("offset=40");
    expect(html).toContain('"url":"https://www.aipm-registry.com/prompts/publisher/prompt-41"');
    expect(html).toContain('"url":"https://www.aipm-registry.com/prompts/publisher/prompt-80"');
    expect(html).not.toContain('"url":"https://www.aipm-registry.com/prompts/publisher/prompt-1"');
    expect(html).toContain('href="/prompts"');
    expect(html).toContain('href="/prompts?page=3"');
    expect(html).toContain('"position":41');
    expect(html).toContain('"url":"https://www.aipm-registry.com/prompts?page=2"');
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ page: "2" }) });
    expect(metadata.alternates.canonical).toBe("https://www.aipm-registry.com/prompts?page=2");
  });

  it("keeps filtered combinations out of the index", async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ page: "2", category: "Work" }),
    });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates.canonical).toBe("https://www.aipm-registry.com/prompts");
  });
});
