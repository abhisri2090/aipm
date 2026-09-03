export type SkillDiscoveryPage = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  answer: string;
  query: string;
  registryQuery: string;
  target?: "cursor" | "claude";
  keywords: readonly string[];
  useCases: readonly string[];
  sources?: readonly { label: string; href: string }[];
};

export const SKILL_DISCOVERY_PAGES = [
  {
    slug: "cursor",
    title: "Cursor Skills for Reusable AI Workflows",
    h1: "Find Cursor skills you can review and install.",
    description:
      "Browse reusable Cursor skills for project workflows. Review the source, version, and files before installing with AIPM.",
    answer:
      "Cursor skills are reusable task instructions stored with a project. AIPM lets you inspect and install a fixed skill version instead of copying instructions between projects by hand.",
    query: "cursor",
    registryQuery: "cursor",
    target: "cursor",
    keywords: ["Cursor skills", "Cursor AI rules", "Cursor prompts", "AIPM Cursor"],
    useCases: [
      "Project rules for code review, testing, and refactoring",
      "Reusable prompts that live with the repository",
      "Team-approved Cursor workflows that can be installed with one command",
    ],
    sources: [
      { label: "Cursor documentation: Rules", href: "https://docs.cursor.com/context/rules-for-ai" },
    ],
  },
  {
    slug: "claude",
    title: "Claude Code Skills Marketplace and Library",
    h1: "Find Claude Code skills you can review and install.",
    description:
      "Browse reusable Claude Code skills with clear versions, sources, install commands, and project-ready instructions.",
    answer:
      "Claude Code skills are reusable instruction packages for repeated tasks. AIPM helps you find a skill, review its source, and install the same version into one or more projects.",
    query: "claude",
    registryQuery: "claude",
    target: "claude",
    keywords: [
      "Claude Code skills marketplace",
      "Claude Code skills library",
      "Claude Code skills GitHub",
      "Claude skills",
      "AIPM Claude",
    ],
    useCases: [
      "Claude Code workflows for debugging, releases, and documentation",
      "Reusable prompts for support, product, and engineering teams",
      "Installable project context that can be versioned with code",
    ],
    sources: [
      { label: "Anthropic documentation: Extend Claude with skills", href: "https://code.claude.com/docs/en/skills" },
    ],
  },
  {
    slug: "code-review",
    title: "Code Review AI Skills",
    h1: "Find AI skills for code review.",
    description:
      "Browse AIPM skills that help AI assistants review pull requests, diffs, regressions, tests, and security risk.",
    answer:
      "Code review skills give an AI assistant a repeatable checklist and output format for reviewing changes. Review the skill source and test it on a small pull request before team use.",
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
    answer:
      "Issue summarizer skills turn raw bug reports and logs into a consistent summary with impact, evidence, possible causes, and next steps.",
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
    answer:
      "Testing skills give an AI assistant repeatable steps for finding edge cases, writing focused tests, and checking a change before release.",
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
    answer:
      "Documentation skills give an AI assistant a repeatable structure for writing and updating project documents such as READMEs, runbooks, and changelogs.",
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
