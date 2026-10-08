/** Guides mirrored at /guides/{slug}/md and summarized in llms.txt / llms-full.txt. */
export const LLMS_MIRROR_GUIDE_SLUGS = [
  "skill-md-frontmatter-reference",
  "agents-md-vs-skill-md",
  "claude-code-skills-vs-codex-skills",
  "how-to-install-claude-code-skills",
  "how-to-install-cursor-skills",
  "share-claude-skills-with-team",
  "aipm-vs-skills-sh",
  "claude-skills-marketplaces",
  "cursor-rules-vs-agent-skills",
  "where-are-claude-skills-stored",
  "does-claude-code-read-agents-md",
] as const;

export function guideMarkdownPath(slug: string): string {
  return `/guides/${slug}/md`;
}

export function forIndexMarkdownPath(): string {
  return "/for/md";
}

export function forToolMarkdownPath(slug: string): string {
  return `/for/${slug}/md`;
}
