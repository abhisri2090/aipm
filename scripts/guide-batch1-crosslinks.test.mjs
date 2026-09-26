import { describe, expect, it } from "vitest";
import { SEO_GUIDES } from "../apps/web/lib/seo-guides";
import { guideSectionId, internalGuideHrefs } from "../apps/web/lib/guide-inline";

// Follow-ups from the batch-1 guide PRs (#48, #49, #51, #52, #53): once all five were live,
// each guide links the siblings listed in its PR body.
const CROSS_LINKS = {
  "does-claude-code-read-agents-md": [
    "claude-code-skills-vs-mcp-vs-subagents-vs-hooks",
    "where-are-claude-skills-stored",
  ],
  "claude-code-skills-vs-mcp-vs-subagents-vs-hooks": [
    "does-claude-code-read-agents-md",
    "skill-md-frontmatter-reference",
    "share-claude-skills-with-team",
  ],
  "where-are-claude-skills-stored": [
    "skill-md-frontmatter-reference",
    "share-claude-skills-with-team",
    "claude-code-skills-vs-mcp-vs-subagents-vs-hooks",
  ],
  "skill-md-frontmatter-reference": [
    "where-are-claude-skills-stored",
    "claude-code-skills-vs-mcp-vs-subagents-vs-hooks",
    "share-claude-skills-with-team",
  ],
  "share-claude-skills-with-team": [
    "where-are-claude-skills-stored",
    "skill-md-frontmatter-reference",
    "claude-code-skills-vs-mcp-vs-subagents-vs-hooks",
  ],
};

function guide(slug) {
  const found = SEO_GUIDES.find((item) => item.slug === slug);
  expect(found, slug).toBeTruthy();
  return found;
}

describe("batch-1 guide cross-links", () => {
  for (const [from, targets] of Object.entries(CROSS_LINKS)) {
    it(`${from} links its sibling guides`, () => {
      const hrefs = internalGuideHrefs(JSON.stringify(guide(from)));
      for (const to of targets) expect(hrefs, `${from} -> ${to}`).toContain(`/guides/${to}`);
    });
  }

  it("deep links point at real section headings", () => {
    for (const from of Object.keys(CROSS_LINKS)) {
      const text = JSON.stringify(guide(from));
      for (const match of text.matchAll(/\]\(\/guides\/([a-z0-9-]+)#([a-z0-9-]+)\)/g)) {
        const [, slug, id] = match;
        const ids = guide(slug).sections.map((section) => guideSectionId(section.title));
        expect(ids, `${from} -> ${slug}#${id}`).toContain(id);
      }
    }
  });
});
