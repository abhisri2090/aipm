import React from "../apps/web/node_modules/react";
import { renderToStaticMarkup } from "../apps/web/node_modules/react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const directoryProps = vi.hoisted(() => ({ current: null }));
vi.mock("../apps/web/components/publishers-directory", () => ({
  PublishersDirectory: (props) => {
    directoryProps.current = props;
    return React.createElement(
      "div",
      null,
      props.initialPublishers.map((publisher) =>
        React.createElement("a", { key: publisher.slug, href: `/publishers/${publisher.slug}` }, publisher.name),
      ),
    );
  },
}));

import PublishersPage from "../apps/web/app/publishers/page";
import { GET as aiSkillsSitemap } from "../apps/web/app/ai-skills-sitemap.xml/route";
import sitemap from "../apps/web/app/sitemap";
import { filterPublishedPublishers, listPublishedPublisherSlugs } from "../apps/web/lib/registry";

beforeEach(() => {
  vi.stubGlobal("React", React);
  directoryProps.current = null;
});
afterEach(() => vi.unstubAllGlobals());

const publisher = (slug, packageCount = 1) => ({
  slug,
  name: slug,
  description: null,
  websiteUrl: null,
  avatarUrl: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  packageCount,
  user: { githubLogin: slug, name: slug, avatarUrl: null, verified: false },
});

const skill = (org, name, overrides = {}) => ({
  name: `@${org}/${name}`,
  version: "1.0.0",
  description: "A reusable agent skill with a long enough description to be indexable on AIPM.",
  sourceUrl: `https://github.com/${org}/skills`,
  createdAt: "2026-09-10T00:00:00.000Z",
  publisher: { org: { slug: org, name: org }, user: { verified: false } },
  ...overrides,
});

// `aipm` holds only a name reservation (counted by /v1/publishers, absent from /v1/skills).
// `thin` publishes only skills that fail the indexability gate, but its page still resolves.
const PUBLISHERS = [publisher("antfu", 2), publisher("aipm", 1), publisher("thin", 1)];
const SKILLS = [
  skill("antfu", "vitest"),
  skill("antfu", "unocss", { createdAt: "2026-09-12T00:00:00.000Z" }),
  skill("thin", "tiny", { description: "short", sourceUrl: null }),
];

function registryFetch({ skillsStatus = 200 } = {}) {
  return vi.fn(async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/v1/publishers") {
      return Response.json({ publishers: PUBLISHERS, nextCursor: null, nextOffset: null });
    }
    if (url.pathname === "/v1/skills") {
      if (skillsStatus !== 200) return new Response(null, { status: skillsStatus });
      return Response.json({ skills: SKILLS, nextCursor: null, nextOffset: null });
    }
    return new Response(null, { status: 404 });
  });
}

describe("publishers without published skills", () => {
  it("are kept out of the /publishers cards and JSON-LD", async () => {
    vi.stubGlobal("fetch", registryFetch());
    const html = renderToStaticMarkup(await PublishersPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('href="/publishers/antfu"');
    expect(html).toContain('href="/publishers/thin"');
    expect(html).not.toContain("/publishers/aipm");
    expect(html).toContain('"url":"https://www.aipm-registry.com/publishers/thin"');
    expect(html).toContain('"position":2');
    expect(html).not.toContain('"position":3');
    // The client directory gets the same allow-list for client-side search / load more.
    expect(directoryProps.current.publishedSlugs).toEqual(["antfu", "thin"]);
  });

  it("falls back to the unfiltered list when the skills listing cannot be read", async () => {
    vi.stubGlobal("fetch", registryFetch({ skillsStatus: 429 }));
    const html = renderToStaticMarkup(await PublishersPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('href="/publishers/aipm"');
    expect(directoryProps.current.publishedSlugs).toBeNull();
  });

  it("builds the published set across pages and rejects incomplete listings", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ skills: [skill("a", "one")], nextCursor: "two" }))
      .mockResolvedValueOnce(Response.json({ skills: [skill("b", "two")], nextCursor: null }));
    vi.stubGlobal("fetch", fetch);
    expect(await listPublishedPublisherSlugs()).toEqual(new Set(["a", "b"]));
    expect(fetch.mock.calls[1][0]).toContain("cursor=two");

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ skills: [skill("a", "one")], nextCursor: "two" }))
        .mockResolvedValueOnce(new Response(null, { status: 503 })),
    );
    expect(await listPublishedPublisherSlugs()).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ skills: [], nextCursor: null })));
    expect(await listPublishedPublisherSlugs()).toBeNull();

    expect(filterPublishedPublishers([publisher("x"), publisher("y")], null)).toHaveLength(2);
    expect(filterPublishedPublishers([publisher("x"), publisher("y")], ["y"]).map((p) => p.slug)).toEqual(["y"]);
  });
});

describe("publisher URLs in /ai-skills-sitemap.xml", () => {
  it("lists every publisher with a published skill, even if all its skill pages are noindexed", async () => {
    vi.stubGlobal("fetch", registryFetch());
    const xml = await (await aiSkillsSitemap()).text();
    expect(xml).toContain("<loc>https://www.aipm-registry.com/publishers/antfu</loc><lastmod>2026-09-12T00:00:00.000Z</lastmod>");
    expect(xml).toContain("<loc>https://www.aipm-registry.com/publishers/thin</loc>");
    expect(xml).not.toContain("/publishers/aipm");
    // Thin skill pages stay out of the sitemap.
    expect(xml).toContain("/skills/antfu/vitest/1.0.0");
    expect(xml).not.toContain("/skills/thin/tiny/1.0.0");
  });
});

describe("static /sitemap.xml", () => {
  it("includes /publish/github and keeps /registry out (canonical is /skills)", async () => {
    const entries = await sitemap();
    const github = entries.find((entry) => entry.url === "https://www.aipm-registry.com/publish/github");
    expect(github).toBeDefined();
    expect(github.lastModified).toEqual(new Date("2026-09-19T00:00:00.000Z"));
    expect(entries.some((entry) => /\/registry(\?|$)/.test(entry.url))).toBe(false);
  });
});
