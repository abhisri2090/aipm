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
    title: "Plain English Technical Guides",
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
        href: "/guides/share-ai-prompts-team",
        label: "Share team prompts",
        body: "Share useful AI prompts with teammates without losing context or versions.",
      },
      {
        href: "/guides/manage-cursor-rules-git",
        label: "Cursor rules in Git",
        body: "Keep Cursor rules in Git so teams can review, update, and reuse them.",
      },
      {
        href: "/guides/reusable-claude-skills",
        label: "Reusable Claude skills",
        body: "Turn repeated Claude workflows into simple skill packages.",
      },
      {
        href: "/guides/reuse-claude-code-workflows",
        label: "Reuse Claude Code workflows",
        body: "Turn repeated Claude Code tasks into reusable skill packages.",
      },
      {
        href: "/guides/package-mcp-server-setup",
        label: "Package MCP setup",
        body: "Document MCP server setup without sharing secret values.",
      },
      {
        href: "/guides/ai-agent-instructions-git",
        label: "AI instructions in Git",
        body: "Manage agent instructions in Git so teams can review and reuse them.",
      },
      {
        href: "/guides/aipm-vs-copying-prompts",
        label: "AIPM vs copy-paste",
        body: "Learn when AIPM is better than copying prompts by hand.",
      },
      {
        href: "/guides/ai-agent-configuration-files",
        label: "Agent config files",
        body: "Understand AGENTS.md, CLAUDE.md, Cursor rules, MCP config, and skills.",
      },
      {
        href: "/guides/agents-md-vs-claude-md-vs-cursor-rules",
        label: "AGENTS.md vs CLAUDE.md",
        body: "Compare the main instruction files used by AI coding agents.",
      },
      {
        href: "/guides/cursor-rules-best-practices",
        label: "Cursor rules best practices",
        body: "Write Cursor rules that are short, reviewable, and reusable.",
      },
      {
        href: "/guides/claude-code-skills-guide",
        label: "Claude Code skills",
        body: "Learn when to create skills and how to share them across repos.",
      },
      {
        href: "/guides/mcp-json-guide-cursor-claude",
        label: "mcp.json guide",
        body: "Manage MCP config safely for Cursor, Claude Code, and team repos.",
      },
      {
        href: "/guides/cursor-rules-vs-agents-md",
        label: "Cursor rules vs AGENTS.md",
        body: "Choose between shared AGENTS.md instructions and scoped Cursor project rules.",
      },
      {
        href: "/guides/cursor-rules-vs-agent-skills",
        label: "Cursor rules vs Agent Skills",
        body: "Choose between ongoing Cursor project instructions and a reusable task workflow.",
      },
      {
        href: "/guides/agents-md-vs-skill-md",
        label: "AGENTS.md vs SKILL.md",
        body: "Compare shared project instructions with a reusable Agent Skill file.",
      },
      {
        href: "/guides/claude-code-skills-vs-slash-commands",
        label: "Claude skills vs commands",
        body: "Understand how Claude Code skills and custom slash commands now fit together.",
      },
      {
        href: "/guides/share-ai-coding-agent-instructions",
        label: "Share agent instructions",
        body: "Keep AI coding instructions aligned across repos without manual copying.",
      },
      {
        href: "/guides/manage-ai-prompts-in-git",
        label: "Manage prompts in Git",
        body: "Store, review, version, and share important AI prompts in Git.",
      },
      {
        href: "/guides/mcp-server-config-best-practices",
        label: "MCP config best practices",
        body: "Configure MCP servers safely and reuse setup across projects.",
      },
      {
        href: "/guides/aipm-vs-skills-sh",
        label: "AIPM vs Skills.sh",
        body: "Compare two ways to discover and install reusable Agent Skills.",
      },
      {
        href: "/guides/claude-code-skills-vs-codex-skills",
        label: "Claude skills vs Codex skills",
        body: "Compare SKILL.md workflows, tool-specific locations, and team sharing.",
      },
      {
        href: "/guides/agent-skills-vs-mcp",
        label: "Agent Skills vs MCP",
        body: "Choose between reusable instructions and connections to tools or information.",
      },
      {
        href: "/guides/how-to-install-claude-code-skills",
        label: "Install Claude Code skills",
        body: "Install and review a Claude Code skill in one project.",
      },
      {
        href: "/guides/how-to-install-cursor-skills",
        label: "Install Cursor skills",
        body: "Install and test a reusable AI skill for Cursor.",
      },
      {
        href: "/guides/how-to-create-agent-skill",
        label: "Create an Agent Skill",
        body: "Write, test, package, and publish one reusable AI workflow.",
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
        href: "/publish/github",
        label: "Import from GitHub",
        body: "Publish a public GitHub skill you own into your AIPM org from the dashboard.",
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
        href: "/guides/components-of-an-ai-agent",
        label: "Components of an AI agent",
        body: "Understand the model, instructions, memory, tools, actions, and safety controls inside an AI agent.",
      },
      {
        href: "/compatibility",
        label: "AI agent file support",
        body: "See which instruction, skill, and MCP files work with Cursor, Claude Code, Codex, and other AI tools.",
      },
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
    title: "Research",
    items: [
      {
        href: "/research/state-of-agent-skills-2026",
        label: "State of AI Agent Skills 2026",
        body: "See current registry data, target support, trust signals, methods, and a downloadable dataset.",
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
