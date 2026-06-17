export type SkillDiscoveryPage = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  query: string;
  registryQuery: string;
  target?: "cursor" | "claude";
  keywords: readonly string[];
  useCases: readonly string[];
};

export const SKILL_DISCOVERY_PAGES = [
  {
    slug: "cursor",
    title: "Cursor Skills",
    h1: "Find Cursor skills for project-ready AI workflows.",
    description:
      "Browse AIPM skills that install reusable instructions, prompts, and tool files into Cursor projects.",
    query: "cursor",
    registryQuery: "cursor",
    target: "cursor",
    keywords: ["Cursor skills", "Cursor AI rules", "Cursor prompts", "AIPM Cursor"],
    useCases: [
      "Project rules for code review, testing, and refactoring",
      "Reusable prompts that live with the repository",
      "Team-approved Cursor workflows that can be installed with one command",
    ],
  },
  {
    slug: "claude",
    title: "Claude Skills",
    h1: "Find Claude skills for repeatable assistant workflows.",
    description:
      "Browse AIPM skills for Claude and Claude Code workflows, including project instructions and reusable prompts.",
    query: "claude",
    registryQuery: "claude",
    target: "claude",
    keywords: ["Claude skills", "Claude Code skills", "Claude prompts", "AIPM Claude"],
    useCases: [
      "Claude Code workflows for debugging, releases, and documentation",
      "Reusable prompts for support, product, and engineering teams",
      "Installable project context that can be versioned with code",
    ],
  },
  {
    slug: "code-review",
    title: "Code Review AI Skills",
    h1: "Find AI skills for code review.",
    description:
      "Browse AIPM skills that help AI assistants review pull requests, diffs, regressions, tests, and security risk.",
    query: "code review",
    registryQuery: "code review",
    keywords: ["AI code review", "code review skills", "pull request AI", "AIPM code review"],
    useCases: [
      "Review pull requests before they reach a human reviewer",
      "Catch missing tests, regressions, and risky changes",
      "Keep review output consistent across teams and repositories",
    ],
  },
  {
    slug: "issue-summarizer",
    title: "Issue Summarizer AI Skills",
    h1: "Find AI skills for issue summaries and triage.",
    description:
      "Browse AIPM skills that turn bugs, Sentry issues, tickets, logs, and user reports into clear engineering handoffs.",
    query: "issue summarizer",
    registryQuery: "issue summarizer",
    keywords: ["issue summarizer", "bug triage AI", "Sentry issue summary", "support ticket AI"],
    useCases: [
      "Summarize Sentry issues and production incidents",
      "Turn tickets into impact, evidence, and next steps",
      "Prepare consistent handoffs before debugging begins",
    ],
  },
  {
    slug: "testing",
    title: "Testing AI Skills",
    h1: "Find AI skills for test writing and verification.",
    description:
      "Browse AIPM skills that help assistants write tests, plan verification, and catch regressions before release.",
    query: "testing",
    registryQuery: "testing",
    keywords: ["AI test writer", "testing skills", "regression testing AI", "AIPM testing"],
    useCases: [
      "Generate focused unit, integration, and regression tests",
      "Plan manual and automated verification steps",
      "Review edge cases that should be covered before shipping",
    ],
  },
  {
    slug: "documentation",
    title: "Documentation AI Skills",
    h1: "Find AI skills for documentation.",
    description:
      "Browse AIPM skills for READMEs, changelogs, runbooks, onboarding guides, and docs maintenance.",
    query: "documentation",
    registryQuery: "documentation",
    keywords: ["documentation AI", "docs skills", "README AI", "AIPM documentation"],
    useCases: [
      "Keep docs aligned with code changes",
      "Generate onboarding notes and runbooks",
      "Draft changelogs, examples, and user-facing guides",
    ],
  },
] as const satisfies readonly SkillDiscoveryPage[];

export function getSkillDiscoveryPage(slug: string): SkillDiscoveryPage | null {
  return SKILL_DISCOVERY_PAGES.find((page) => page.slug === slug) ?? null;
}
