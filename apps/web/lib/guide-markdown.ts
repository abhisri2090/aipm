import type { GuideTable, SeoGuide } from "./seo-guides";
import { stripGuideInline } from "./guide-inline";

function cell(value: string): string {
  return stripGuideInline(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function guideTableToMarkdown(table: GuideTable): string {
  const header = `| ${table.columns.map(cell).join(" | ")} |`;
  const rule = `| ${table.columns.map(() => "---").join(" | ")} |`;
  const rows = table.rows.map((row) => `| ${row.map(cell).join(" | ")} |`);
  return [stripGuideInline(table.caption), "", header, rule, ...rows].join("\n");
}

/** Title, short answer, sections, and FAQs as markdown for /guides/[slug]/md. */
export function guideToMarkdown(guide: SeoGuide): string {
  const parts: string[] = [
    `# ${guide.h1}`,
    "",
    guide.description,
    "",
    `Canonical: /guides/${guide.slug}`,
    "",
    "## Short answer",
    "",
    stripGuideInline(guide.answer),
  ];

  if (guide.answerTable) {
    parts.push("", guideTableToMarkdown(guide.answerTable));
  }

  for (const section of guide.sections) {
    parts.push("", `## ${section.title}`, "", stripGuideInline(section.body));
    for (const paragraph of section.paragraphs ?? []) {
      parts.push("", stripGuideInline(paragraph));
    }
    if (section.bullets?.length) {
      parts.push("", ...section.bullets.map((item) => `- ${stripGuideInline(item)}`));
    }
    if (section.table) {
      parts.push("", guideTableToMarkdown(section.table));
    }
    for (const block of section.code ?? []) {
      if (block.label) parts.push("", `**${stripGuideInline(block.label)}**`);
      parts.push("", "```", block.code, "```");
    }
  }

  if (guide.steps.length > 0) {
    parts.push("", "## Steps", "", ...guide.steps.map((step, index) => `${index + 1}. ${stripGuideInline(step)}`));
  }

  if (guide.faqs.length > 0) {
    parts.push("", "## FAQ");
    for (const faq of guide.faqs) {
      parts.push("", `### ${faq.question}`, "", stripGuideInline(faq.answer));
    }
  }

  return `${parts.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
