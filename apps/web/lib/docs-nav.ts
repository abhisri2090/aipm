export type DocNavItem = {
  href: string;
  label: string;
  body: string;
};

export type DocNavSection = {
  title: string;
  items: DocNavItem[];
};

export const DOC_NAV_SECTIONS: DocNavSection[] = [
  {
    title: "Plain-English guides",
    items: [
      {
        href: "/guides/ai-package-manager",
        label: "What is an AI package manager?",
        body: "A simple explanation of AI package managers, AI skills, and reusable setup.",
      },
      {
        href: "/guides/agent-package-manager",
        label: "Agent package manager",
        body: "Learn how packages help AI agents reuse project workflows.",
      },
      {
        href: "/guides/prompt-package-manager",
        label: "Prompt package manager",
        body: "See how teams can manage prompts with names, versions, and install steps.",
      },
      {
        href: "/guides/mcp-package-manager",
        label: "MCP package manager",
        body: "Learn how MCP setup can be documented and shared safely.",
      },
      {
        href: "/guides/version-ai-prompts",
        label: "Version AI prompts",
        body: "Keep important prompts in Git and publish shared prompts as packages.",
      },
      {
        href: "/guides/share-cursor-rules",
        label: "Share Cursor rules",
        body: "Package reusable Cursor rules so teams can install them across projects.",
      },
      {
        href: "/guides/reusable-claude-skills",
        label: "Reusable Claude skills",
        body: "Turn repeated Claude workflows into simple skill packages.",
      },
      {
        href: "/guides/ai-agent-instructions-git",
        label: "AI instructions in Git",
        body: "Manage agent instructions in Git so teams can review and reuse them.",
      },
    ],
  },
  {
    title: "Getting started",
    items: [
      {
        href: "/resources",
        label: "Documentation home",
        body: "Start here for all AIPM guides, references, and troubleshooting.",
      },
      {
        href: "/install",
        label: "Install the CLI",
        body: "Install the AIPM CLI with npm, Homebrew, standalone scripts, Windows PowerShell, or Scoop.",
      },
      {
        href: "/use",
        label: "Use AIPM",
        body: "Install skills into a project and keep them with your code.",
      },
      {
        href: "/commands",
        label: "CLI commands",
        body: "See every use, publish, token, and diagnostic command with options.",
      },
    ],
  },
  {
    title: "Publish package",
    items: [
      {
        href: "/publish/guide",
        label: "Publishing guide",
        body: "Create a package, reserve a name, get a token, and publish with the CLI.",
      },
      {
        href: "/examples",
        label: "Skill publishing examples",
        body: "Copy full scenario walkthroughs for publishing and installing common skills.",
      },
      {
        href: "/popular-skills",
        label: "Starter ideas to publish",
        body: "Browse a curated catalog of popular skill ideas with copy-ready prompts.",
      },
      {
        href: "/templates",
        label: "Skill templates",
        body: "Start from a blank, code review, issue summary, or release notes template.",
      },
    ],
  },
  {
    title: "Guides",
    items: [
      {
        href: "/targets",
        label: "Supported targets",
        body: "See where AIPM installs files for Cursor and Claude.",
      },
      {
        href: "/glossary",
        label: "Glossary",
        body: "Learn simple meanings for skills, manifests, targets, orgs, and tokens.",
      },
    ],
  },
  {
    title: "Quality & discovery",
    items: [
      {
        href: "/ai-practices",
        label: "AI best practices",
        body: "How to write AI skills that are clear, safe, and easy to reuse.",
      },
      {
        href: "/discoverability",
        label: "Discoverability",
        body: "Write names, descriptions, and examples that help users find the right skill.",
      },
      {
        href: "/skills/cursor",
        label: "Browse Cursor packages",
        body: "Find public skills that install reusable AI workflows into Cursor projects.",
      },
      {
        href: "/skills/claude",
        label: "Browse Claude packages",
        body: "Find public skills for Claude and Claude Code project workflows.",
      },
      {
        href: "/skills/code-review",
        label: "Browse code review packages",
        body: "Browse skills for pull request reviews, regressions, missing tests, and security checks.",
      },
      {
        href: "/skills/issue-summarizer",
        label: "Browse issue summarizer packages",
        body: "Browse skills for bugs, incidents, Sentry issues, support tickets, and handoff notes.",
      },
      {
        href: "/skills/testing",
        label: "Browse testing packages",
        body: "Browse skills for test writing, verification plans, and regression coverage.",
      },
      {
        href: "/skills/documentation",
        label: "Browse documentation packages",
        body: "Browse skills for READMEs, changelogs, runbooks, examples, and onboarding docs.",
      },
      {
        href: "/security",
        label: "Security & safety",
        body: "Publish public skills without leaking secrets, customer data, or private notes.",
      },
    ],
  },
  {
    title: "Reference",
    items: [
      {
        href: "/faq",
        label: "FAQ & troubleshooting",
        body: "Answers for install, registry, package, token, and publishing issues.",
      },
      {
        href: "/status",
        label: "Service status",
        body: "Check registry health and dependency readiness.",
      },
      {
        href: "/changelog",
        label: "Changelog",
        body: "See recent changes to the CLI, registry API, website, and dashboard.",
      },
      {
        href: "/roadmap",
        label: "Roadmap",
        body: "See what works now and what is planned next.",
      },
    ],
  },
  {
    title: "Legal",
    items: [
      {
        href: "/privacy",
        label: "Privacy",
        body: "Learn what data AIPM uses for accounts, packages, tokens, and local settings.",
      },
      {
        href: "/terms",
        label: "Terms of use",
        body: "Understand what is allowed when publishing public packages.",
      },
    ],
  },
  {
    title: "Project",
    items: [
      {
        href: "/about",
        label: "About AIPM",
        body: "Learn what AIPM is, what it is for, and what it is not.",
      },
      {
        href: "/thanks",
        label: "Acknowledgements",
        body: "People, research, and public work that helped make modern AI tools possible.",
      },
    ],
  },
];

export const DOC_PATHS = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));

export function isDocPath(pathname: string): boolean {
  return DOC_PATHS.includes(pathname);
}
