import React from "../apps/web/node_modules/react";
import { renderToStaticMarkup } from "../apps/web/node_modules/react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../apps/web/components/registry-search", () => ({
  RegistrySearch: () => React.createElement("div"),
}));

import sitemap from "../apps/web/app/sitemap";
import { metadata as homeMetadata } from "../apps/web/app/page";
import { generateMetadata as skillsMetadata } from "../apps/web/app/skills/page";
import { SkillsDirectoryPage } from "../apps/web/components/skills-directory-page";
import { SEO_GUIDES, getSeoGuide } from "../apps/web/lib/seo-guides";
import {
  FEATURED_SKILLS,
  SKILLS_HUB_FEATURED,
  featuredSkillPath,
  getFeaturedSkills,
} from "../apps/web/lib/featured-skills";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

const CTR_GUIDES = ["cursor-rules-vs-agent-skills", "agents-md-vs-skill-md", "cursor-rules-vs-agents-md"];

function expectSnippetFits(title, description) {
  // Page titles get " | AIPM" from the root layout template, so keep the full title under 60.
  expect(`${title} | AIPM`.length, title).toBeLessThan(60);
  expect(title, "brand is added by the layout").not.toMatch(/AIPM/);
  expect(description.length, description).toBeLessThanOrEqual(155);
}

describe("search snippets", () => {
  it("keep rewritten guide titles and descriptions short and brand-free", () => {
    for (const slug of CTR_GUIDES) {
      const guide = getSeoGuide(slug);
      expectSnippetFits(guide.title, guide.description);
      expect(guide.updatedAt).toBe("2026-10-05");
    }
  });

  it("/skills names Claude Code, Codex, and Cursor", async () => {
    const meta = await skillsMetadata({ searchParams: Promise.resolve({}) });
    expect(meta.title).toBe("Agent Skills for Claude, Codex & Cursor");
    expectSnippetFits(meta.title, meta.description);
    expect(meta.description).toMatch(/Claude Code, Codex, and Cursor/);
  });

  it("homepage carries the brand once (the layout template does not apply to it)", () => {
    expect(homeMetadata.title).toMatch(/^AIPM: /);
    expect(homeMetadata.title.match(/AIPM/g)).toHaveLength(1);
    expect(homeMetadata.title.length).toBeLessThan(60);
    expect(homeMetadata.description.length).toBeLessThanOrEqual(155);
  });
});

describe("featured skills", () => {
  it("are well-formed, version-pinned skill pages", () => {
    const names = new Set();
    for (const skill of FEATURED_SKILLS) {
      expect(names.has(skill.name), skill.name).toBe(false);
      names.add(skill.name);
      expect(featuredSkillPath(skill)).toMatch(/^\/skills\/[a-z0-9-]+\/[a-z0-9-]+\/\d+\.\d+\.\d+$/);
      expect(skill.summary.length).toBeLessThanOrEqual(110);
    }
    expect(getFeaturedSkills(SKILLS_HUB_FEATURED)).toHaveLength(SKILLS_HUB_FEATURED.length);
  });

  it("guides only reference featured skills, and every featured skill is linked somewhere", () => {
    const linked = new Set(SKILLS_HUB_FEATURED);
    for (const guide of SEO_GUIDES) {
      for (const name of guide.featuredSkills ?? []) {
        expect(getFeaturedSkills([name]), `${guide.slug} -> ${name}`).toHaveLength(1);
        linked.add(name);
      }
    }
    for (const skill of FEATURED_SKILLS) expect(linked.has(skill.name), skill.name).toBe(true);
  });
});

describe("guide next steps", () => {
  it("link only to pages that exist", async () => {
    const known = new Set((await sitemap()).map((entry) => new URL(entry.url).pathname));
    for (const guide of SEO_GUIDES) known.add(`/guides/${guide.slug}`);
    for (const guide of SEO_GUIDES) {
      for (const step of guide.nextSteps ?? []) {
        expect(known.has(step.href), `${guide.slug} links unknown page ${step.href}`).toBe(true);
        expect(step.href).not.toBe("/install");
      }
    }
  });

  it("where-are-claude-skills-stored points to /skills, the install guide and related guides", () => {
    const hrefs = getSeoGuide("where-are-claude-skills-stored").nextSteps.map((step) => step.href);
    expect(hrefs).toContain("/skills");
    expect(hrefs).toContain("/guides/how-to-install-claude-code-skills");
    expect(hrefs.filter((href) => href.startsWith("/guides/")).length).toBeGreaterThanOrEqual(3);
  });

  it("new copy avoids claims we must not make", () => {
    const text = JSON.stringify(
      SEO_GUIDES.map((guide) => [guide.title, guide.description, guide.nextSteps ?? []]),
    ) + JSON.stringify(FEATURED_SKILLS);
    expect(text).not.toContain(".cursor/aipm");
    expect(text).not.toContain("0.4.8");
    expect(text).not.toMatch(/install(ing)? (an )?MCP server/i);
  });
});

describe("/skills intro", () => {
  function stubListing() {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ packages: [{ name: "@team/skill-1", version: "1.0.0" }], nextCursor: null })),
    );
  }

  it("shows the plain intro, install steps, popular skills and guide links on page 1", async () => {
    stubListing();
    const html = renderToStaticMarkup(
      await SkillsDirectoryPage({ searchParams: Promise.resolve({}), canonicalPath: "/skills" }),
    );
    expect(html).toContain("Agent skills for Claude Code, Codex, and Cursor");
    expect(html).toContain("What is an agent skill?");
    expect(html).toContain("Install a skill in 3 steps");
    expect(html).toContain('href="/guides/how-to-install-claude-code-skills"');
    expect(html).toContain('href="/guides/where-are-claude-skills-stored"');
    for (const skill of getFeaturedSkills(SKILLS_HUB_FEATURED)) {
      expect(html).toContain(`href="${featuredSkillPath(skill)}"`);
    }
  });

  it("keeps search results and later pages focused on the listing", async () => {
    stubListing();
    const html = renderToStaticMarkup(
      await SkillsDirectoryPage({ searchParams: Promise.resolve({ q: "review" }), canonicalPath: "/skills" }),
    );
    expect(html).not.toContain("What is an agent skill?");
    expect(html).toContain("Agent skills for Claude Code, Codex, and Cursor");
  });
});
