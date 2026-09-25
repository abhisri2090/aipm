import { describe, expect, it } from "vitest";
import sitemap from "../apps/web/app/sitemap";
import { SEO_GUIDES } from "../apps/web/lib/seo-guides";
import {
  guideSectionId,
  internalGuideHrefs,
  stripGuideInline,
  tokenizeGuideInline,
} from "../apps/web/lib/guide-inline";

describe("guide inline markup", () => {
  it("tokenizes code spans and links", () => {
    expect(tokenizeGuideInline("Run `aipm install`, then read [the reference](/commands#install).")).toEqual([
      { kind: "text", value: "Run " },
      { kind: "code", value: "aipm install" },
      { kind: "text", value: ", then read " },
      { kind: "link", label: "the reference", href: "/commands#install" },
      { kind: "text", value: "." },
    ]);
  });

  it("strips markup for JSON-LD", () => {
    expect(stripGuideInline("Put it in `.claude/skills/` ([docs](https://code.claude.com/docs/en/skills)).")).toBe(
      "Put it in .claude/skills/ (docs).",
    );
  });

  it("builds stable section ids", () => {
    expect(guideSectionId("One table: which fields work where")).toBe("one-table-which-fields-work-where");
    expect(guideSectionId("Where AGENTS.md differs from CLAUDE.md")).toBe("where-agents-md-differs-from-claude-md");
  });
});

describe("guide links", () => {
  it("only link to pages that exist, and never to /install", async () => {
    const known = new Set((await sitemap()).map((entry) => new URL(entry.url).pathname));
    for (const guide of SEO_GUIDES) known.add(`/guides/${guide.slug}`);
    for (const guide of SEO_GUIDES) {
      for (const href of internalGuideHrefs(JSON.stringify(guide))) {
        expect(href, `${guide.slug} links ${href}`).not.toBe("/install");
        expect(known.has(href), `${guide.slug} links unknown page ${href}`).toBe(true);
      }
    }
  });
});
