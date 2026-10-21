import React from "../apps/web/node_modules/react";
import { renderToStaticMarkup } from "../apps/web/node_modules/react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkillDocument } from "../apps/web/components/skill-document.tsx";
import { formatSkillAge, skillPlainSummary } from "../apps/web/lib/skill-trust.ts";
import { SKILLS_SH_ALTERNATIVE_DESCRIPTION, SKILLS_SH_ALTERNATIVE_TITLE } from "../apps/web/app/skills-sh-alternative/page.tsx";

beforeEach(() => vi.stubGlobal("React", React));

describe("server-rendered skill text", () => {
  it("puts the summary and SKILL.md words in the HTML and drops raw script", () => {
    const html = renderToStaticMarkup(
      React.createElement(SkillDocument, {
        description: "Reviews a pull request. Then it lists the risks.",
        markdown: "# Review\n\nRead the diff before you comment.\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))",
      }),
    );
    expect(html).toContain('id="skill-summary"');
    expect(html).toContain("Reviews a pull request.");
    expect(html).toContain("Read the diff before you comment.");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
  });

  it("keeps a one or two sentence summary and a stable published age", () => {
    expect(skillPlainSummary("First sentence. Second sentence. Third sentence.")).toBe(
      "First sentence. Second sentence.",
    );
    expect(formatSkillAge("2026-09-04T00:00:00.000Z", new Date("2026-10-21T00:00:00.000Z"))).toBe(
      "1 month ago (Sep 4, 2026)",
    );
  });

  it("keeps the skills.sh alternative title and description inside the snippet budget", () => {
    expect(`${SKILLS_SH_ALTERNATIVE_TITLE} | AIPM`.length).toBeLessThan(60);
    expect(SKILLS_SH_ALTERNATIVE_DESCRIPTION.length).toBeLessThanOrEqual(155);
  });
});
