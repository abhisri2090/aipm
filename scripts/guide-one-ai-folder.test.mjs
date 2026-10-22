import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/lib/static-sitemap";
import { getSeoGuide } from "../apps/web/lib/seo-guides";
import { listGuideIndexEntries } from "../apps/web/lib/guide-index";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";

const SLUG = "one-ai-folder-for-every-ai-tool";
const PATH = `/guides/${SLUG}`;
const guide = getSeoGuide(SLUG);
const text = JSON.stringify(guide);

describe(PATH, () => {
  it("exists with the post's title, table, code, FAQs and sources", () => {
    expect(guide).not.toBeNull();
    expect(guide.title).toBe("One .ai Folder for Every AI Tool: Share Skills with Symlinks (2026)");
    expect(guide.h1).toBe("Keep AI skills in one .ai folder and link them into every tool");
    expect(guide.publishedAt).toBe("2026-10-22");
    expect(guide.updatedAt).toBe("2026-10-22");
    expect(guide.lastChecked).toBe("2026-10-22");
    const problem = guide.sections.find((section) => section.title === "The problem: three folders, three copies");
    expect(problem.table.rows).toHaveLength(3);
    expect(problem.table.rows.map((row) => row[0])).toEqual(["Cursor", "Claude Code", "Codex"]);
    expect(guide.faqs.length).toBeGreaterThanOrEqual(4);
    const hrefs = guide.sources.map((source) => source.href);
    expect(hrefs).toContain("https://cursor.com/docs/skills");
    expect(hrefs).toContain("https://code.claude.com/docs/en/skills");
    expect(hrefs).toContain("https://developers.openai.com/codex/skills");
    expect(hrefs).toContain("https://github.com/abhisri2090/aipm/blob/main/packages/engine/src/install-shared.ts");
  });

  it("keeps the post's symlink layout, --shared flow and gotchas", () => {
    expect(text).toContain(".ai/skills/");
    expect(text).toContain("ln -s ../../.ai/skills/review-helper");
    expect(text).toContain("aipm add @amplitude/review-agent-insights@1.0.0 --shared --ci");
    expect(text).toContain("Codex is detected by `.codex/` but linked at `.agents/skills/`");
    expect(text).toContain("`--shared` and `--target` can't be combined");
    expect(text).toContain("On Windows, turn on Developer Mode or run an admin shell, then retry.");
    expect(text).not.toContain(".cursor/aipm");
    expect(text).not.toContain("(/install)");
  });

  it("is in the sitemap, guides index and docs nav", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain(`https://www.aipm-registry.com${PATH}`);
    expect(listGuideIndexEntries().some((entry) => entry.slug === SLUG)).toBe(true);
    const navHrefs = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    expect(navHrefs).toContain(PATH);
  });
});
