import { CLI_INSTALL_COMMAND } from "./registry";
import { FOR_TOOLS } from "./for-tool-landings";
import { SEO_GUIDES, getSeoGuide } from "./seo-guides";
import { stripGuideInline } from "./guide-inline";
import {
  LLMS_MIRROR_GUIDE_SLUGS,
  forIndexMarkdownPath,
  forToolMarkdownPath,
  guideMarkdownPath,
} from "./llms-mirrors";

const TARGET_LINES = [
  "- `--target claude` writes `.claude/skills/<name>/SKILL.md`. Command: `aipm add @scope/name@version --target claude`",
  "- `--target cursor` writes `.cursor/skills/<name>/SKILL.md`. Command: `aipm add @scope/name@version --target cursor`",
  "- `--target codex` writes `.agents/skills/<name>/SKILL.md`. Command: `aipm add @scope/name@version --target codex`",
];

export function buildLlmsFull(siteUrl: string): string {
  const site = siteUrl.replace(/\/$/, "");
  const lines: string[] = [
    "# AIPM Registry",
    "",
    "> Full text for agents. AIPM is a marketplace and command-line tool for agent skills. It installs a named version of a SKILL.md folder for Claude Code, Cursor, and Codex. Official docs from Anthropic, Cursor, and OpenAI remain the full reference. These pages summarize each tool and show the install path.",
    "",
    "## Homepage",
    "",
    "Find and install agent skills for Claude Code, Codex, and Cursor. See what each skill does, then add it with one command.",
    "",
    `${site}`,
    "",
    "## Install the CLI",
    "",
    "```sh",
    CLI_INSTALL_COMMAND,
    "```",
    "",
    "## Per-target paths",
    "",
    ...TARGET_LINES,
    "",
    "Cursor's folder is `.cursor/skills/<name>/SKILL.md`.",
    "",
    "## Skills for each tool",
    "",
    `Index: ${site}/for`,
    `Markdown: ${site}${forIndexMarkdownPath()}`,
    "",
  ];

  for (const tool of FOR_TOOLS) {
    lines.push(
      `### ${tool.h1}`,
      "",
      `${site}/for/${tool.slug}`,
      "",
      tool.definition,
      "",
      tool.tldr,
      "",
      `Install: \`${tool.installCommand}\``,
      `Path: \`${tool.skillPath}\``,
      `Markdown: ${site}${forToolMarkdownPath(tool.slug)}`,
      "",
      ...tool.faqs.flatMap((faq) => [`Q: ${faq.question}`, `A: ${faq.answer}`, ""]),
    );
  }

  lines.push("## Install and compare guides", "");

  for (const slug of LLMS_MIRROR_GUIDE_SLUGS) {
    const guide = getSeoGuide(slug);
    if (!guide) continue;
    lines.push(
      `### ${guide.h1}`,
      "",
      `${site}/guides/${guide.slug}`,
      `Markdown: ${site}${guideMarkdownPath(guide.slug)}`,
      "",
      stripGuideInline(guide.answer),
      "",
    );
    for (const faq of guide.faqs) {
      lines.push(`Q: ${faq.question}`, `A: ${stripGuideInline(faq.answer)}`, "");
    }
  }

  lines.push("## Markdown mirrors", "", `${site}${forIndexMarkdownPath()}`);
  for (const tool of FOR_TOOLS) {
    lines.push(`${site}${forToolMarkdownPath(tool.slug)}`);
  }
  for (const guide of SEO_GUIDES) {
    lines.push(`${site}${guideMarkdownPath(guide.slug)}`);
  }
  lines.push("");

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
