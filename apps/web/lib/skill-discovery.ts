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
  /** ISO date (YYYY-MM-DD) used for sitemap lastmod when content changes. */
  updatedAt?: string;
  installCommands?: readonly { label: string; code: string }[];
  faqs?: readonly { question: string; answer: string }[];
  relatedLinks?: readonly { label: string; href: string }[];
  sources?: readonly { label: string; href: string }[];
};

export const SKILL_DISCOVERY_PAGES = [
  {
    slug: "cursor",
    title: "Cursor Skills Registry — Browse & Install",
    h1: "Cursor skills you can review, version, and install.",
    description:
      "Browse a Cursor skills registry of reusable agent workflows. Inspect source and version, then install into your project with the AIPM CLI.",
    answer:
      "Cursor skills are reusable task instructions stored with a project. AIPM is a Cursor skills registry plus CLI: inspect a fixed skill version, then install it instead of copying instructions between projects by hand.",
    query: "cursor",
    registryQuery: "cursor",
    target: "cursor",
    updatedAt: "2026-09-23",
    keywords: [
      "Cursor skills",
      "Cursor agent skills",
      "Cursor skills registry",
      "install Cursor skills",
      "Cursor AI rules",
      "AIPM Cursor",
    ],
    useCases: [
      "Project rules for code review, testing, and refactoring",
      "Reusable prompts that live with the repository",
      "Team-approved Cursor workflows that can be installed with one command",
    ],
    installCommands: [
      { label: "Install the CLI", code: "npm install -g @aipm-registry/cli" },
      { label: "Initialize for Cursor", code: "aipm init --target cursor" },
      { label: "Add a skill", code: "aipm add @scope/name@1.0.0 --target cursor --ci" },
    ],
    faqs: [
      {
        question: "What are Cursor skills?",
        answer:
          "Cursor skills are reusable workflows and instructions your agent can load for a job—review, tests, docs, and more—instead of pasting the same prompt every time.",
      },
      {
        question: "How do I install a Cursor skill with AIPM?",
        answer:
          "Install the AIPM CLI, run aipm init --target cursor, then aipm add @scope/name@version --target cursor. Review the package source on its registry page before you install.",
      },
      {
        question: "How is AIPM different from copying skills by hand?",
        answer:
          "AIPM pins a named version, shows publisher and files, and writes target-specific paths into your repo so teammates get the same skill revision.",
      },
    ],
    relatedLinks: [
      { label: "Full install guide", href: "/install" },
      { label: "How to install Cursor skills", href: "/guides/how-to-install-cursor-skills" },
      { label: "Claude Code skills hub", href: "/skills/claude" },
      { label: "All agent skills", href: "/skills" },
      { label: "AIPM vs skills.sh", href: "/guides/aipm-vs-skills-sh" },
    ],
    sources: [
      { label: "Cursor documentation: Rules", href: "https://docs.cursor.com/context/rules-for-ai" },
    ],
  },
  {
    slug: "claude",
    title: "Claude Code Skills Marketplace & Library",
    h1: "Claude Code skills you can review, version, and install.",
    description:
      "Browse a Claude Code skills marketplace of versioned packages. Review source and files, then install into Claude Code projects with the AIPM CLI.",
    answer:
      "Claude Code skills are reusable instruction packages for repeated tasks. AIPM is a Claude Code skills marketplace plus package workflow: find a skill, review its source, and install the same version into one or more projects.",
    query: "claude",
    registryQuery: "claude",
    target: "claude",
    updatedAt: "2026-09-23",
    keywords: [
      "Claude Code skills marketplace",
      "Claude Code skills library",
      "Claude Code skills",
      "install Claude Code skills",
      "Claude skills directory",
      "Claude Code skills GitHub",
      "AIPM Claude",
    ],
    useCases: [
      "Claude Code workflows for debugging, releases, and documentation",
      "Reusable prompts for support, product, and engineering teams",
      "Installable project context that can be versioned with code",
    ],
    installCommands: [
      { label: "Install the CLI", code: "npm install -g @aipm-registry/cli" },
      { label: "Initialize for Claude Code", code: "aipm init --target claude" },
      { label: "Add a skill", code: "aipm add @scope/name@1.0.0 --target claude --ci" },
    ],
    faqs: [
      {
        question: "What is a Claude Code skill?",
        answer:
          "A Claude Code skill is a reusable SKILL.md-style package that teaches Claude a repeatable job—debugging, releases, docs—with steps and examples you can share across repos.",
      },
      {
        question: "How do I install Claude Code skills with AIPM?",
        answer:
          "Install the AIPM CLI, run aipm init --target claude, then aipm add @scope/name@version --target claude. Open the skill page first to review publisher, version, and files.",
      },
      {
        question: "Is this a Claude Code skills marketplace or a package manager?",
        answer:
          "Both angles matter: you browse a marketplace-style directory, then install with versions and targets like packages. That versioning is the main differentiator versus copy-paste directories.",
      },
    ],
    relatedLinks: [
      { label: "Full install guide", href: "/install" },
      { label: "How to install Claude Code skills", href: "/guides/how-to-install-claude-code-skills" },
      { label: "Cursor skills hub", href: "/skills/cursor" },
      { label: "All agent skills", href: "/skills" },
      { label: "AIPM vs skills.sh", href: "/guides/aipm-vs-skills-sh" },
      { label: "What are Claude skills?", href: "/guides/what-are-claude-skills" },
      { label: "Claude Code plugins vs skills", href: "/guides/claude-code-plugins-vs-skills" },
      { label: "Claude skills marketplaces compared", href: "/guides/claude-skills-marketplaces" },
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
    updatedAt: "2026-09-04",
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
    updatedAt: "2026-09-04",
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
    updatedAt: "2026-09-04",
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
    updatedAt: "2026-09-04",
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
