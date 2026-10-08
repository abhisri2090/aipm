import { stripGuideInline } from "./guide-inline";

export const FOR_TOOL_SLUGS = ["claude-code", "cursor", "codex"] as const;

export type ForToolSlug = (typeof FOR_TOOL_SLUGS)[number];

export type ForToolTarget = "claude" | "cursor" | "codex";

export type ForToolLink = {
  href: string;
  label: string;
};

export type ForToolFaq = {
  question: string;
  answer: string;
};

export type ForToolLanding = {
  slug: ForToolSlug;
  target: ForToolTarget;
  name: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  definition: string;
  tldr: string;
  skillPath: string;
  howSkillsLoad: string;
  goodFor: string;
  installCommand: string;
  faqs: ForToolFaq[];
  guides: ForToolLink[];
};

export type ForCompareTable = {
  caption: string;
  columns: string[];
  rows: string[][];
};

const INSTALL_PACKAGE = "aipm add @scope/name@version";

function installCommand(target: ForToolTarget): string {
  return `${INSTALL_PACKAGE} --target ${target}`;
}

export const FOR_TOOL_COMPARE: ForCompareTable = {
  caption: "Claude Code vs Cursor vs Codex: where skills go, and how AIPM installs them.",
  columns: ["", "Claude Code", "Cursor", "Codex"],
  rows: [
    [
      "What it is",
      "Anthropic's coding agent in the terminal or an IDE",
      "A code editor with a built-in coding agent",
      "OpenAI's coding agent",
    ],
    [
      "Skills path",
      "`.claude/skills/<name>/SKILL.md`",
      "`.cursor/skills/<name>/SKILL.md`",
      "`.agents/skills/<name>/SKILL.md`",
    ],
    [
      "How skills load",
      "Name and description first. Full file when the task matches.",
      "Name and description first. Full file when the task matches, or when you type /skill-name.",
      "Name and description first. Full file when the task matches.",
    ],
    [
      "AIPM target flag",
      "`--target claude`",
      "`--target cursor`",
      "`--target codex`",
    ],
    [
      "Install command",
      `\`${installCommand("claude")}\``,
      `\`${installCommand("cursor")}\``,
      `\`${installCommand("codex")}\``,
    ],
    [
      "Good for",
      "Claude Code sessions in a repo",
      "Day-to-day editing in Cursor",
      "Codex sessions in a repo",
    ],
  ],
};

export const AIPM_DIFFERENCES: string[] = [
  "You install a named version, such as @scope/name@1.2.0. The project file aipm.package.json remembers it, so the next person gets the same skill.",
  "AIPM writes the skill files into the repo. You can read them before anyone relies on them.",
  "The same skill can be installed for Claude Code, Cursor, or Codex. Change the --target flag and the folder changes with it.",
];

const SHARED_LINKS: ForToolLink[] = [
  { href: "/skills", label: "Browse skills" },
  { href: "/install", label: "Install the AIPM CLI" },
  { href: "/targets", label: "All install targets" },
  { href: "/for", label: "Skills for Claude Code, Cursor, and Codex" },
];

export const FOR_TOOLS: ForToolLanding[] = [
  {
    slug: "claude-code",
    target: "claude",
    name: "Claude Code",
    title: "Skills for Claude Code — Install with AIPM (2026)",
    description:
      "A short summary of Claude Code skills, how they compare with Cursor and Codex, and the install path .claude/skills with --target claude.",
    keywords: [
      "Claude Code skills",
      "install Claude Code skills",
      "Claude skills path",
      ".claude/skills",
      "AIPM Claude Code",
    ],
    h1: "Skills for Claude Code",
    definition:
      "Claude Code is Anthropic's coding agent. It runs in a terminal or an IDE and can follow a skill when a task matches that skill's description.",
    tldr:
      "A skill is a folder with a SKILL.md file. Claude Code reads project skills from .claude/skills/<name>/SKILL.md. Install one version with aipm add @scope/name@version --target claude, then review the files.",
    skillPath: ".claude/skills/<name>/SKILL.md",
    howSkillsLoad: "Name and description first. Full file when the task matches.",
    goodFor: "Claude Code sessions in a repo",
    installCommand: installCommand("claude"),
    faqs: [
      {
        question: "How do I install a skill for Claude Code with AIPM?",
        answer:
          "From the project folder, run aipm add @scope/name@version --target claude. AIPM writes .claude/skills/<name>/SKILL.md and records the version in aipm.package.json.",
      },
      {
        question: "Where does Claude Code load project skills from?",
        answer:
          "From .claude/skills/<name>/SKILL.md in the repo. Skills for every project on your machine live in ~/.claude/skills/. Anthropic's docs list more folders, including plugins. This page is the short map plus the install command.",
      },
      {
        question: "Can I use the same skill in Cursor or Codex?",
        answer:
          "Yes. Install it again with --target cursor or --target codex. Each flag writes the folder that tool reads. Cursor also reads .claude/skills, so a Claude Code install is often visible in Cursor too.",
      },
      {
        question: "Does this page replace Anthropic's skill docs?",
        answer:
          "No. Anthropic's docs are the full list of folders and settings. Use this page to compare Claude Code, Cursor, and Codex, and to install a skill with AIPM.",
      },
      {
        question: "How does a team keep the same version?",
        answer:
          "Commit aipm.package.json. Teammates run aipm install. For Git, plugins, and registries side by side, see the guide on sharing Claude skills.",
      },
    ],
    guides: [
      { href: "/guides/how-to-install-claude-code-skills", label: "How to install Claude skills" },
      { href: "/guides/where-are-claude-skills-stored", label: "Where Claude skills are stored" },
      { href: "/guides/claude-code-skills-vs-codex-skills", label: "Can Codex use Claude skills?" },
      { href: "/guides/share-claude-skills-with-team", label: "Share Claude skills with your team" },
    ],
  },
  {
    slug: "cursor",
    target: "cursor",
    name: "Cursor",
    title: "Skills for Cursor — Install with AIPM (2026)",
    description:
      "A short summary of Cursor skills, how they compare with Claude Code and Codex, and the install path .cursor/skills with --target cursor.",
    keywords: [
      "Cursor skills",
      "install Cursor skills",
      ".cursor/skills",
      "Cursor SKILL.md",
      "AIPM Cursor",
    ],
    h1: "Skills for Cursor",
    definition:
      "Cursor is a code editor with a built-in agent. It follows short project rules while you work, and loads a skill when a task needs that workflow.",
    tldr:
      "A Cursor skill is a folder with SKILL.md at .cursor/skills/<name>/SKILL.md. Install one version with aipm add @scope/name@version --target cursor, then review the files. Keep rules short, and put repeatable workflows in skills.",
    skillPath: ".cursor/skills/<name>/SKILL.md",
    howSkillsLoad:
      "Name and description first. Full file when the task matches, or when you type /skill-name.",
    goodFor: "Day-to-day editing in Cursor",
    installCommand: installCommand("cursor"),
    faqs: [
      {
        question: "How do I install a Cursor skill with AIPM?",
        answer:
          "Run aipm add @scope/name@version --target cursor. AIPM writes .cursor/skills/<name>/SKILL.md in the project.",
      },
      {
        question: "What is the difference between Cursor rules and skills?",
        answer:
          "Keep rules short. They apply while you work. Put a repeatable workflow, such as code review, in a skill. Cursor loads that skill when the task matches.",
      },
      {
        question: "Will Cursor see a skill installed for Claude Code?",
        answer:
          "Often yes. Cursor also reads .claude/skills and .agents/skills. --target cursor writes Cursor's own folder, .cursor/skills/<name>/SKILL.md.",
      },
      {
        question: "Does this page replace Cursor's docs?",
        answer:
          "No. Cursor's docs explain rules and skills in full. Use this page to compare Claude Code, Cursor, and Codex, and to copy the install command.",
      },
    ],
    guides: [
      { href: "/guides/how-to-install-cursor-skills", label: "How to install Cursor skills" },
      { href: "/guides/cursor-rules-vs-agent-skills", label: "Cursor rules vs skills" },
      { href: "/guides/agents-md-vs-skill-md", label: "AGENTS.md vs SKILL.md" },
    ],
  },
  {
    slug: "codex",
    target: "codex",
    name: "Codex",
    title: "Skills for Codex — Install with AIPM (2026)",
    description:
      "A short summary of Codex skills, how they compare with Claude Code and Cursor, and the install path .agents/skills with --target codex.",
    keywords: [
      "Codex skills",
      "install Codex skills",
      ".agents/skills",
      "Codex SKILL.md",
      "AIPM Codex",
    ],
    h1: "Skills for Codex",
    definition:
      "Codex is OpenAI's coding agent. It can follow a skill in the repo when a task matches that skill's description.",
    tldr:
      "Codex reads project skills from .agents/skills/<name>/SKILL.md. It does not read Claude's .claude/skills folder. Install the same SKILL.md with aipm add @scope/name@version --target codex, then review the files.",
    skillPath: ".agents/skills/<name>/SKILL.md",
    howSkillsLoad: "Name and description first. Full file when the task matches.",
    goodFor: "Codex sessions in a repo",
    installCommand: installCommand("codex"),
    faqs: [
      {
        question: "Can Codex use a skill written for Claude?",
        answer:
          "Yes, if that SKILL.md is installed into .agents/skills/<name>/SKILL.md. Codex does not read .claude/skills. Use aipm add @scope/name@version --target codex.",
      },
      {
        question: "How do I install a Codex skill with AIPM?",
        answer:
          "Run aipm add @scope/name@version --target codex. AIPM writes .agents/skills/<name>/SKILL.md and records the version in the project.",
      },
      {
        question: "Does this page replace OpenAI's Codex docs?",
        answer:
          "No. OpenAI's docs are the full reference. This page is a short summary, a comparison with Claude Code and Cursor, and the AIPM install path.",
      },
      {
        question: "Can one package serve Claude Code and Codex?",
        answer:
          "Yes. Install the same package once with --target claude and once with --target codex. Each command writes the folder that tool reads.",
      },
    ],
    guides: [
      { href: "/guides/claude-code-skills-vs-codex-skills", label: "Can Codex use Claude skills?" },
      { href: "/guides/agents-md-vs-skill-md", label: "AGENTS.md vs SKILL.md" },
      { href: "/guides/aipm-vs-skills-sh", label: "Skills.sh alternative" },
    ],
  },
];

export function isForToolSlug(slug: string): slug is ForToolSlug {
  return (FOR_TOOL_SLUGS as readonly string[]).includes(slug);
}

export function getForToolLanding(slug: string): ForToolLanding | null {
  return FOR_TOOLS.find((tool) => tool.slug === slug) ?? null;
}

export function forToolPageLinks(tool: ForToolLanding): ForToolLink[] {
  const others = FOR_TOOLS.filter((item) => item.slug !== tool.slug).map((item) => ({
    href: `/for/${item.slug}`,
    label: item.h1,
  }));
  return [...SHARED_LINKS, ...tool.guides, ...others];
}

export const FOR_INDEX = {
  title: "Skills for Claude Code, Cursor, and Codex",
  description:
    "Plain-English pages for Claude Code, Cursor, and Codex: what each tool is, where skills go, and how to install them with AIPM.",
  h1: "Skills for Claude Code, Cursor, and Codex",
  lede:
    "A short summary of each coding tool, a side-by-side comparison, and the install command. Official docs stay the full reference. These pages help you pick a path and install a skill.",
};

function markdownTable(table: ForCompareTable): string {
  const header = `| ${table.columns.join(" | ")} |`;
  const rule = `| ${table.columns.map(() => "---").join(" | ")} |`;
  const rows = table.rows.map(
    (row) => `| ${row.map((cell) => stripGuideInline(cell).replace(/\|/g, "\\|")).join(" | ")} |`,
  );
  return [table.caption, "", header, rule, ...rows].join("\n");
}

export function forIndexMarkdown(): string {
  const lines = [
    `# ${FOR_INDEX.h1}`,
    "",
    FOR_INDEX.lede,
    "",
    markdownTable(FOR_TOOL_COMPARE),
    "",
    "## Tools",
  ];
  for (const tool of FOR_TOOLS) {
    lines.push(
      "",
      `### ${tool.h1}`,
      "",
      tool.definition,
      "",
      tool.tldr,
      "",
      `- Page: /for/${tool.slug}`,
      `- Markdown: /for/${tool.slug}/md`,
      `- Install: \`${tool.installCommand}\``,
      `- Path: \`${tool.skillPath}\``,
    );
  }
  return `${lines.join("\n")}\n`;
}

export function forToolMarkdown(tool: ForToolLanding): string {
  const lines = [
    `# ${tool.h1}`,
    "",
    tool.definition,
    "",
    "## Short answer",
    "",
    tool.tldr,
    "",
    "## Compare",
    "",
    markdownTable(FOR_TOOL_COMPARE),
    "",
    "## Install",
    "",
    `AIPM writes \`${tool.skillPath}\`.`,
    "",
    "```sh",
    tool.installCommand,
    "```",
    "",
    "## What AIPM does differently",
    "",
    ...AIPM_DIFFERENCES.map((item) => `- ${item}`),
    "",
    "## Links",
    "",
    ...forToolPageLinks(tool).map((link) => `- [${link.label}](${link.href})`),
    "",
    "## FAQ",
  ];
  for (const faq of tool.faqs) {
    lines.push("", `### ${faq.question}`, "", faq.answer);
  }
  return `${lines.join("\n")}\n`;
}
