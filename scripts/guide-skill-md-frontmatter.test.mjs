import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import { SEO_GUIDES, getSeoGuide } from "../apps/web/lib/seo-guides";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";
import { buildLlmsTxt } from "../apps/web/lib/llms-txt";
import { guideSectionId } from "../apps/web/lib/guide-inline";

const SLUG = "skill-md-frontmatter-reference";
const PATH = `/guides/${SLUG}`;
const guide = getSeoGuide(SLUG);
const text = JSON.stringify(guide);
const read = (path) => readFileSync(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

describe(PATH, () => {
  it("exists with the brief's title, anchors the /templates page links to, and sources", () => {
    expect(guide).not.toBeNull();
    expect(guide.title).toBe("SKILL.md Frontmatter Reference: Every Field & Limit");
    expect(guide.lastChecked).toBe("2026-09-25");
    const ids = guide.sections.map((section) => guideSectionId(section.title));
    expect(ids).toContain("one-table-which-fields-work-where");
    expect(ids).toContain("frontmatter-errors-and-how-to-fix-them");
    const matrix = guide.sections.find((section) => section.title === "One table: which fields work where");
    expect(matrix.table.columns).toEqual(["Field", "Agent Skills spec", "Claude Code", "claude.ai upload / Skills API", "Cursor", "Codex"]);
    expect(guide.faqs).toHaveLength(7);
    const hrefs = guide.sources.map((source) => source.href);
    expect(hrefs).toContain("https://agentskills.io/specification");
    expect(hrefs).toContain("https://learn.chatgpt.com/docs/build-skills");
    expect(hrefs).toContain("https://cursor.com/docs/skills");
  });

  it("documents name and description as required without claiming the CLI enforces it", () => {
    expect(guide.answer).toContain("`name` and `description` are required");
    expect(guide.answer).toContain("AIPM documents them as required");
    expect(text).toContain(
      "Unexpected key(s) in SKILL.md frontmatter: argument-hint. Allowed properties are: allowed-tools, compatibility, description, license, metadata, name",
    );
    expect(text).toContain("aipm skill init --name @team/code-review --template code-review");
    expect(text).not.toMatch(/aipm publish validate (checks|enforces|rejects)/i);
    expect(text).not.toMatch(/templates? (now )?(generate|include|emit)s? (YAML )?frontmatter/i);
    expect(text).not.toContain("--target cursor");
    expect(text).not.toContain(".cursor/aipm");
    expect(text).not.toContain("(/install)");
    expect(text).not.toContain("/security");
    expect(text).not.toContain("zsh");
  });

  it("is in the sitemap, docs nav and llms.txt, and linked from related pages", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain(`https://www.aipm-registry.com${PATH}`);
    const navHrefs = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    expect(navHrefs).toContain(PATH);
    expect(buildLlmsTxt({ siteUrl: "https://www.aipm-registry.com", cliVersion: "0.4.8" })).toContain(PATH);
    for (const slug of ["how-to-create-agent-skill", "what-are-claude-skills", "agents-md-vs-skill-md"]) {
      expect(JSON.stringify(SEO_GUIDES.find((item) => item.slug === slug)), slug).toContain(`(${PATH})`);
    }
    const templates = read("app/templates/page.tsx");
    expect(templates).toContain(`href="${PATH}"`);
    expect(templates).toContain(`href="${PATH}#one-table-which-fields-work-where"`);
    expect(templates).toContain(`href="${PATH}#frontmatter-errors-and-how-to-fix-them"`);
    expect(templates).toContain("Frontmatter checklist before you publish");
    expect(read("app/publish/guide/page.tsx")).toContain(`href="${PATH}"`);
    expect(read("app/glossary/page.tsx")).toContain(`href: "${PATH}"`);
  });
});
