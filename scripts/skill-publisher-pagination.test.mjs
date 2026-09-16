import React from "../apps/web/node_modules/react";
import { renderToStaticMarkup } from "../apps/web/node_modules/react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../apps/web/components/registry-search", () => ({
  RegistrySearch: () => React.createElement("div"),
}));
vi.mock("../apps/web/components/publishers-directory", () => ({
  PublishersDirectory: () => React.createElement("div"),
}));

import { SkillsDirectoryPage } from "../apps/web/components/skills-directory-page";
import PublishersPage, { generateMetadata as publishersMetadata } from "../apps/web/app/publishers/page";
import { generateMetadata as skillsMetadata } from "../apps/web/app/skills/page";
import { generateMetadata as registryMetadata } from "../apps/web/app/registry/page";
import { loadCursorDirectoryPage } from "../apps/web/lib/directory-pagination";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

describe("skill and publisher directory pagination", () => {
  it("links distinct skill pages and keeps /registry canonicalized to /skills", async () => {
    const fetch = vi.fn(async (url) => {
      const cursor = new URL(url).searchParams.get("cursor");
      const start = cursor ? Number(cursor) : 0;
      return Response.json({
        packages: Array.from({ length: Math.min(20, 83 - start) }, (_, index) => ({
          name: `@team/skill-${start + index + 1}`,
          version: "1.0.0",
        })),
        nextCursor: start + 20 < 83 ? String(start + 20) : null,
      });
    });
    vi.stubGlobal("fetch", fetch);
    const html = renderToStaticMarkup(
      await SkillsDirectoryPage({ searchParams: Promise.resolve({ page: "3" }), canonicalPath: "/skills" }),
    );
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(html).toContain('"position":41');
    expect(html).toContain('"name":"@team/skill-41@1.0.0"');
    expect(html).toContain('href="/skills?page=2"');
    expect(html).toContain('href="/skills?page=4"');
    expect((await skillsMetadata({ searchParams: Promise.resolve({ page: "3" }) })).alternates.canonical)
      .toBe("https://www.aipm-registry.com/skills?page=3");
    expect((await registryMetadata({ searchParams: Promise.resolve({ page: "3" }) })).alternates.canonical)
      .toBe("https://www.aipm-registry.com/skills?page=3");
  });

  it("links a second publisher page when the directory grows past 24", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const start = new URL(url).searchParams.has("cursor") ? 24 : 0;
      return Response.json({
        publishers: Array.from({ length: Math.min(24, 30 - start) }, (_, index) => ({
          slug: `publisher-${start + index + 1}`,
          name: `Publisher ${start + index + 1}`,
        })),
        nextCursor: start === 0 ? "next" : null,
      });
    }));
    const html = renderToStaticMarkup(
      await PublishersPage({ searchParams: Promise.resolve({ page: "2" }) }),
    );
    expect(html).toContain('"position":25');
    expect(html).toContain('"name":"Publisher 25"');
    expect(html).toContain('href="/publishers"');
    expect(html).not.toContain('href="/publishers?page=3"');
    expect((await publishersMetadata({ searchParams: Promise.resolve({ page: "2" }) })).alternates.canonical)
      .toBe("https://www.aipm-registry.com/publishers?page=2");
  });

  it("rejects repeated cursors and noindexes faceted skill URLs", async () => {
    await expect(loadCursorDirectoryPage(3, async () => ({ items: ["same"], nextCursor: "same" })))
      .rejects.toThrow("did not advance");
    const metadata = await skillsMetadata({ searchParams: Promise.resolve({ category: "Work" }) });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates.canonical).toBe("https://www.aipm-registry.com/skills");
  });
});
