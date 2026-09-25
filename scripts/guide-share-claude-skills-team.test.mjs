import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import { SEO_GUIDES, getSeoGuide } from "../apps/web/lib/seo-guides";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";
import { buildLlmsTxt } from "../apps/web/lib/llms-txt";

const SLUG = "share-claude-skills-with-team";
const PATH = `/guides/${SLUG}`;
const guide = getSeoGuide(SLUG);
const text = JSON.stringify(guide);
const read = (path) => readFileSync(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

describe(PATH, () => {
  it("exists with the brief's title, comparison table, FAQs and sources", () => {
    expect(guide).not.toBeNull();
    expect(guide.title).toBe("How to Share Claude Skills With Your Team (2026 Guide)");
    expect(guide.lastChecked).toBe("2026-09-25");
    expect(guide.answerTable.rows).toHaveLength(5);
    expect(guide.faqs).toHaveLength(7);
    const hrefs = guide.sources.map((source) => source.href);
    expect(hrefs).toContain("https://code.claude.com/docs/en/plugins/org");
    expect(hrefs).toContain("https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization");
    expect(hrefs).toContain("https://learn.chatgpt.com/docs/build-skills");
  });

  it("keeps the documented plugin gotcha and only product-approved AIPM team claims", () => {
    expect(text).toContain("claude plugin install code-review@your-marketplace --scope project");
    expect(text).toContain("CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1");
    expect(text).toContain("aipm add @your-org/review-helper@1.2.0");
    expect(text).toContain("aipm-lock.json");
    expect(text).toContain("Version ranges aren't supported");
    // Not supported by the CLI (SEO_PRODUCT_ANSWERS_2026-09-25, Q4).
    expect(text).not.toMatch(/frozen|reproducible|integrity|verified install|lockfile-verified|npm ci/i);
    expect(text).not.toMatch(/aipm install (reads|from|uses) (the )?(aipm-)?lock/i);
    expect(text).not.toMatch(/\^1\.|~1\.|>=\s*1\./);
    expect(text).not.toContain("--target cursor");
    expect(text).not.toContain(".cursor/aipm");
    expect(text).not.toContain("(/install)");
    expect(text).not.toContain("/security");
  });

  it("is in the sitemap, docs nav and llms.txt, and linked from related pages", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`https://www.aipm-registry.com${PATH}`);
    const navHrefs = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    expect(navHrefs).toContain(PATH);
    expect(buildLlmsTxt({ siteUrl: "https://www.aipm-registry.com", cliVersion: "0.4.8" })).toContain(PATH);
    for (const slug of [
      "share-ai-prompts-team",
      "share-ai-coding-agent-instructions",
      "share-cursor-rules",
      "claude-code-plugins-vs-skills",
      "aipm-vs-skills-sh",
      "version-ai-prompts",
      "reusable-claude-skills",
    ]) {
      expect(JSON.stringify(SEO_GUIDES.find((item) => item.slug === slug)), slug).toContain(`(${PATH})`);
    }
    expect(read("app/use/page.tsx")).toContain(`href="${PATH}"`);
    expect(read("app/commands/page.tsx")).toContain(`href="${PATH}"`);
    for (const path of ["/use", "/commands"]) {
      const entry = entries.find((item) => item.url === `https://www.aipm-registry.com${path}`);
      expect(new Date(entry.lastModified).toISOString().slice(0, 10), path).toBe("2026-09-25");
    }
  });
});
