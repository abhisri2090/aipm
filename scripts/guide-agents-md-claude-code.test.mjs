import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import { SEO_GUIDES, getSeoGuide } from "../apps/web/lib/seo-guides";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";
import { buildLlmsTxt } from "../apps/web/lib/llms-txt";

const SLUG = "does-claude-code-read-agents-md";
const PATH = `/guides/${SLUG}`;
const guide = getSeoGuide(SLUG);
const text = JSON.stringify(guide);

describe(PATH, () => {
  it("exists with the brief's title, dates and sources", () => {
    expect(guide).not.toBeNull();
    expect(guide.title).toBe("Does Claude Code Read AGENTS.md? Rules, Setup & Fixes");
    expect(guide.publishedAt).toBe("2026-09-25");
    expect(guide.lastChecked).toBe("2026-09-25");
    const hrefs = guide.sources.map((source) => source.href);
    expect(hrefs.some((href) => href.startsWith("https://code.claude.com/docs/en/memory"))).toBe(true);
    expect(hrefs).toContain("https://code.claude.com/docs/en/changelog");
    expect(hrefs).toContain("https://learn.chatgpt.com/docs/agent-configuration/agents-md");
    expect(guide.faqs).toHaveLength(7);
  });

  it("states the current rule, including the v2.1.281 provider change", () => {
    expect(guide.answer).toContain("v2.1.277");
    expect(guide.answer).toContain("CLAUDE.local.md");
    expect(guide.answer).toContain("claude-md-and-agents-md");
    expect(text).toContain("v2.1.281");
    expect(text).toMatch(/Bedrock/);
    expect(text).toContain("agents-md@builtin");
    expect(text).toMatch(/ignores the key in project and local settings/);
    expect(guide.answerTable.rows).toHaveLength(3);
  });

  it("does not claim AIPM installs instruction files or that Cursor loads .cursor/aipm", () => {
    expect(text).toMatch(/AIPM doesn't install AGENTS.md or CLAUDE.md/);
    expect(text).not.toMatch(/aipm[^"]*install[^"]*AGENTS\.md files/i);
    expect(text).not.toContain(".cursor/aipm");
    expect(text).not.toContain("--target cursor");
    expect(text).not.toContain("(/install)");
  });

  it("is in the sitemap, docs nav and llms.txt, and linked from related guides", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain(`https://www.aipm-registry.com${PATH}`);
    const navHrefs = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    expect(navHrefs).toContain(PATH);
    expect(buildLlmsTxt({ siteUrl: "https://www.aipm-registry.com", cliVersion: "0.4.8" })).toContain(PATH);
    for (const slug of [
      "agents-md-vs-claude-md-vs-cursor-rules",
      "cursor-rules-vs-agents-md",
      "agents-md-vs-skill-md",
      "ai-agent-configuration-files",
    ]) {
      expect(JSON.stringify(SEO_GUIDES.find((item) => item.slug === slug)), slug).toContain(`(${PATH})`);
    }
  });
});
