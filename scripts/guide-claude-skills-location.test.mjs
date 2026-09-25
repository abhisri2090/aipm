import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import { SEO_GUIDES, getSeoGuide } from "../apps/web/lib/seo-guides";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";
import { buildLlmsTxt } from "../apps/web/lib/llms-txt";

const SLUG = "where-are-claude-skills-stored";
const PATH = `/guides/${SLUG}`;
const guide = getSeoGuide(SLUG);
const text = JSON.stringify(guide);

describe(PATH, () => {
  it("exists with the brief's title, the master table and sources", () => {
    expect(guide).not.toBeNull();
    expect(guide.title).toBe("Where Are Claude Skills Stored? Folder Paths (2026)");
    expect(guide.lastChecked).toBe("2026-09-25");
    const master = guide.sections.find((section) => section.title === "All Claude skill locations at a glance");
    expect(master.table.rows.length).toBeGreaterThanOrEqual(12);
    expect(guide.faqs).toHaveLength(8);
    const hrefs = guide.sources.map((source) => source.href);
    expect(hrefs.some((href) => href.startsWith("https://code.claude.com/docs/en/skills"))).toBe(true);
    expect(hrefs).toContain("https://learn.chatgpt.com/docs/build-skills");
    expect(hrefs).toContain("https://cursor.com/docs/skills");
  });

  it("lists the documented paths and avoids the brief's do-not-claim list", () => {
    for (const path of [
      "~/.claude/skills/<name>/SKILL.md",
      ".claude/skills/<name>/SKILL.md",
      "~/.claude/skills/synced/",
      "~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/",
      "/etc/claude-code/.claude/skills/",
      "%USERPROFILE%",
      "$HOME/.agents/skills",
      "/etc/codex/skills",
    ]) {
      expect(text, path).toContain(path.replace(/\\/g, "\\\\"));
    }
    expect(text).toContain("Claude Code does not read `.agents/skills/`");
    expect(text).not.toMatch(/Codex (also )?reads `?\.codex\/skills/);
    expect(text).not.toContain(".cursor/aipm");
    expect(text).not.toContain("--target cursor");
    expect(text).not.toContain("(/install)");
    expect(text).not.toMatch(/Library\/Application Support\/ClaudeCode\/\.claude\/skills/);
  });

  it("is in the sitemap, docs nav and llms.txt, and linked from related pages", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain(`https://www.aipm-registry.com${PATH}`);
    const navHrefs = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    expect(navHrefs).toContain(PATH);
    expect(buildLlmsTxt({ siteUrl: "https://www.aipm-registry.com", cliVersion: "0.4.8" })).toContain(PATH);
    for (const slug of [
      "how-to-install-claude-code-skills",
      "claude-code-skills-guide",
      "what-are-claude-skills",
      "claude-code-plugins-vs-skills",
    ]) {
      expect(JSON.stringify(SEO_GUIDES.find((item) => item.slug === slug)), slug).toContain(`(${PATH})`);
    }
    expect(readFileSync(new URL("../apps/web/app/faq/page.tsx", import.meta.url), "utf8")).toContain(`href="${PATH}"`);
  });
});
