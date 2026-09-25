import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import { SEO_GUIDES, getSeoGuide } from "../apps/web/lib/seo-guides";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";
import { buildLlmsTxt } from "../apps/web/lib/llms-txt";

const SLUG = "claude-code-skills-vs-mcp-vs-subagents-vs-hooks";
const PATH = `/guides/${SLUG}`;
const guide = getSeoGuide(SLUG);
const text = JSON.stringify(guide);

describe(PATH, () => {
  it("exists with the brief's title, the decision table and sources", () => {
    expect(guide).not.toBeNull();
    expect(guide.title).toBe("Claude Code Skills vs MCP vs Subagents vs Hooks");
    expect(guide.lastChecked).toBe("2026-09-25");
    expect(guide.answerTable.rows).toHaveLength(6);
    expect(guide.comparison.columns).toEqual(["Feature", "Claude Code", "Cursor", "Codex"]);
    expect(guide.faqs).toHaveLength(7);
    const hrefs = guide.sources.map((source) => source.href);
    expect(hrefs).toContain("https://code.claude.com/docs/en/features-overview");
    expect(hrefs.some((href) => href.startsWith("https://learn.chatgpt.com/docs/"))).toBe(true);
    expect(hrefs.some((href) => href.startsWith("https://cursor.com/docs/"))).toBe(true);
  });

  it("keeps the documented numbers and avoids claims the brief rules out", () => {
    expect(text).toContain("5,000 tokens");
    expect(text).toContain("25,000 tokens");
    expect(text).not.toMatch(/subagents can(no|')t spawn/i);
    expect(text).toMatch(/pre-approves the listed tools/);
    expect(text).not.toMatch(/AIPM (installs|packages) (hooks|MCP|subagents|plugins)/i);
    expect(text).toContain("AIPM installs skills today");
    expect(text).not.toContain(".cursor/aipm");
    expect(text).not.toContain("--target cursor");
    expect(text).not.toContain("(/install)");
  });

  it("is in the sitemap, docs nav and llms.txt, and linked from its spoke guides", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain(`https://www.aipm-registry.com${PATH}`);
    const navHrefs = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    expect(navHrefs).toContain(PATH);
    expect(buildLlmsTxt({ siteUrl: "https://www.aipm-registry.com", cliVersion: "0.4.8" })).toContain(PATH);
    for (const slug of [
      "agent-skills-vs-mcp",
      "claude-code-plugins-vs-skills",
      "claude-code-skills-vs-slash-commands",
      "cursor-rules-vs-agent-skills",
      "agents-md-vs-skill-md",
      "claude-code-skills-guide",
      "ai-agent-configuration-files",
      "what-are-claude-skills",
    ]) {
      expect(JSON.stringify(SEO_GUIDES.find((item) => item.slug === slug)), slug).toContain(`(${PATH})`);
    }
  });
});
