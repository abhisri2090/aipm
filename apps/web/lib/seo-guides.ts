import { CLAUDE_SKILLS_GUIDES } from "./seo-guides-claude-skills";
import { AGENTS_MD_CLAUDE_CODE_GUIDES } from "./seo-guides-agents-md-claude-code";
import { CLAUDE_CODE_FEATURE_COMPARISON_GUIDES } from "./seo-guides-claude-code-features";
import { CLAUDE_SKILLS_LOCATION_GUIDES } from "./seo-guides-claude-skills-location";
import { SKILL_MD_FRONTMATTER_GUIDES } from "./seo-guides-skill-md-frontmatter";
import { SHARE_CLAUDE_SKILLS_TEAM_GUIDES } from "./seo-guides-share-claude-skills-team";

export type SeoGuide = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  answer: string;
  keywords: string[];
  publishedAt?: string;
  updatedAt?: string;
  /** Optional date the third-party facts were last checked against official docs (YYYY-MM-DD). */
  lastChecked?: string;
  /** Optional compact table shown directly under the short answer. */
  answerTable?: GuideTable;
  /**
   * Section copy supports `code` and [label](href) inline markup (see lib/guide-inline.ts).
   * `body` is the first paragraph; `paragraphs`, `bullets`, `table` and `code` render after it, in that order.
   */
  sections: Array<{
    title: string;
    body: string;
    paragraphs?: string[];
    bullets?: string[];
    table?: GuideTable;
    code?: Array<{ label?: string; code: string }>;
  }>;
  steps: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  sources?: Array<{
    label: string;
    href: string;
  }>;
  /** Optional comparison table rendered after the explanation sections. */
  comparison?: GuideTable;
};

export type GuideTable = {
  caption: string;
  columns: string[];
  rows: string[][];
};

const BASE_SEO_GUIDES: SeoGuide[] = [
  {
    slug: "components-of-an-ai-agent",
    title: "Components of an AI Agent",
    h1: "What are the main components of an AI agent?",
    description:
      "Learn the main components of an AI agent in plain English, including the model, instructions, context, memory, tools, actions, safety, and feedback.",
    answer:
      "An AI agent needs a model to think, instructions to guide it, context and memory to understand the task, tools to get information, actions to do work, and safety checks to keep its work under control.",
    keywords: [
      "components of an AI agent",
      "AI agent components",
      "parts of an AI agent",
      "how AI agents work",
      "AI agent architecture",
    ],
    publishedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    sections: [
      {
        title: "1. Model",
        body:
          "The model is the part that understands words and decides what to do next. It can read a request, compare options, write an answer, or choose a tool. A stronger model can usually handle harder tasks, but it still needs clear instructions and good information.",
      },
      {
        title: "2. Instructions and goals",
        body:
          "Instructions tell the agent what job it has, what result it should produce, and what rules it must follow. A clear goal helps the agent stay focused. Without clear instructions, even a capable model may solve the wrong problem.",
      },
      {
        title: "3. Context",
        body:
          "Context is the information available for the current task. It may include the user's request, project files, documents, earlier messages, or search results. Useful context helps the agent give a relevant answer instead of guessing.",
      },
      {
        title: "4. Memory",
        body:
          "Memory keeps useful information from earlier work. Short-term memory follows the current conversation. Longer-term memory may keep approved preferences or facts for future tasks. Memory should be limited, accurate, and easy to correct.",
      },
      {
        title: "5. Tools",
        body:
          "Tools let the agent do more than write text. A tool may search the web, read a file, call an API, query a database, or use another application. Each tool needs a clear purpose and limited permission.",
      },
      {
        title: "6. Planning and decisions",
        body:
          "For a larger task, the agent breaks the goal into smaller steps. It checks what it already knows, chooses a tool when needed, reviews the result, and decides what to do next. Simple tasks may not need a long plan.",
      },
      {
        title: "7. Actions and results",
        body:
          "An action changes something outside the model. It may create a file, send a message, update a record, or run a command. The agent should check the result of each important action instead of assuming that it worked.",
      },
      {
        title: "8. Safety and human control",
        body:
          "Safety controls limit what the agent can see and do. They can block unsafe input, protect private data, restrict tools, ask for approval before important actions, and record what happened. People should remain in control of costly, private, or difficult-to-reverse decisions.",
      },
      {
        title: "9. Feedback and evaluation",
        body:
          "Feedback shows whether the agent completed the task correctly. Tests, user review, tool results, and quality checks help find mistakes. Teams can use this information to improve instructions, tools, and safety rules.",
      },
    ],
    steps: [
      "Give the agent one clear goal.",
      "Add only the context needed for that goal.",
      "Choose a model that can handle the task.",
      "Give the agent a small set of useful tools.",
      "Limit what each tool can read or change.",
      "Ask for human approval before important actions.",
      "Check the result and record useful feedback.",
    ],
    faqs: [
      {
        question: "Is a chatbot the same as an AI agent?",
        answer:
          "Not always. A chatbot mainly answers messages. An AI agent can also plan steps, use tools, take actions, and check whether the work was completed.",
      },
      {
        question: "Does every AI agent need memory?",
        answer:
          "No. A small agent may only need the current request and a tool result. Add memory only when earlier information is genuinely useful.",
      },
      {
        question: "What is the most important part of an AI agent?",
        answer:
          "There is no single most important part. A capable model still needs a clear goal, useful context, suitable tools, and safety controls to work reliably.",
      },
      {
        question: "How are AI agent skills related to these components?",
        answer:
          "A skill packages instructions, examples, and sometimes tool guidance for one repeated job. It gives the agent a reusable way to complete that job.",
      },
    ],
    sources: [
      {
        label: "OpenAI: A practical guide to building agents",
        href: "https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf",
      },
      {
        label: "Anthropic: Building effective agents",
        href: "https://www.anthropic.com/engineering/building-effective-agents",
      },
      {
        label: "Model Context Protocol: Introduction",
        href: "https://modelcontextprotocol.io/docs/getting-started/intro",
      },
    ],
  },
  {
    slug: "ai-package-manager",
    title: "What Is an AI Package Manager?",
    h1: "What is an AI package manager?",
    description:
      "Learn what an AI package manager does, why teams need one, and how AIPM installs versioned AI agent skills into Claude Code and Codex (which Cursor also reads).",
    answer:
      "An AI package manager helps teams install, update, and share reusable AI setup the way npm does for code. AIPM installs versioned agent skills (SKILL.md folders) into Claude Code and Codex, which Cursor also reads, and tracks AI prompts as Markdown snapshots. Rules, MCP servers, and hooks are planned, not installable today.",
    keywords: ["AI package manager", "AIPM", "AI skills", "agent package manager", "AI skills package manager"],
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "The simple idea",
        body:
          "Normal software teams use package managers to install code. AI teams also need reusable files, but the files are different: skill folders with a SKILL.md, examples, scripts, and prompts. An AI package manager gives those files a name, a version, and a clear install flow.",
      },
      {
        title: "Why it matters",
        body:
          "Without a package manager, people copy prompts from chat, paste rules by hand, and forget which version is current. That works for one person, but it breaks when a team grows.",
      },
      {
        title: "How AIPM fits",
        body:
          "AIPM gives you a registry and a CLI. You find a skill, run aipm add with an exact version, and AIPM writes the skill folder into the project: .claude/skills/<skill>/ for Claude Code (--target claude) or .agents/skills/<skill>/ for Codex (--target codex). Cursor also loads skills from both folders, so either target works in Cursor. The version is recorded in aipm.package.json and aipm-lock.json.",
      },
      {
        title: "What AIPM installs today",
        body:
          "Skills are the only installable package type. Prompts from the AIPM prompt library can be tracked with aipm add <prompt URL>, which saves a Markdown snapshot in .aipm/prompts/; prompts do not have version numbers. Rules, MCP server config, hooks, and other tool config files are planned but are not installable package types yet, so keep them in Git for now.",
      },
      {
        title: "Team workflow",
        body:
          "Commit aipm.package.json and aipm-lock.json. Teammates run aipm install to get the same pinned versions, aipm update moves a skill to its latest version, and aipm remove cleans it up. Private org packages work after aipm login, and CI can use an org install token. Pin exact versions: version ranges are not supported.",
      },
    ],
    steps: [
      "Find a skill in the AIPM registry.",
      "Install the AIPM CLI.",
      "Run aipm init in your project.",
      "Run aipm add @scope/name@version --target claude (or --target codex).",
      "Open Claude Code, Codex, or Cursor and use the installed skill.",
    ],
    faqs: [
      {
        question: "Is an AI package manager the same as npm?",
        answer:
          "No. npm installs code packages. AIPM installs versioned AI agent skills and tracks AI prompts. It does not install rules, MCP config, or hooks today.",
      },
      {
        question: "Who should use an AI package manager?",
        answer:
          "Developers and teams who use AI tools in more than one project should use one. It helps keep setup repeatable.",
      },
      {
        question: "Which AI tools does AIPM install skills into?",
        answer:
          "Claude Code (--target claude writes .claude/skills/<skill>/SKILL.md) and Codex (--target codex writes .agents/skills/<skill>/SKILL.md). Cursor loads skills from .claude/skills and .agents/skills too, so use either target for Cursor.",
      },
    ],
    sources: [
      { label: "How to install Claude skills", href: "https://www.aipm-registry.com/guides/how-to-install-claude-code-skills" },
      { label: "Cursor documentation: Agent Skills", href: "https://cursor.com/docs/skills" },
      { label: "OpenAI Codex: Agent Skills", href: "https://developers.openai.com/codex/skills/" },
    ],
  },
  {
    slug: "version-ai-prompts",
    title: "How to Version AI Prompts in a Repo",
    h1: "How do you version AI prompts in a repo?",
    description:
      "A simple guide for keeping AI prompts, rules, and skills in Git so teams can review changes.",
    answer:
      "Save important prompts in project files and record their changes with Git. Git history is the version record for a prompt; turn a prompt that has become a repeatable task into a versioned skill.",
    keywords: ["version AI prompts", "prompts in Git", "AI prompt versioning", "AIPM"],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "Move prompts out of chat",
        body:
          "Chat history is not a good source of truth. If a prompt matters, save it as a file in the project.",
      },
      {
        title: "Review prompt changes like code",
        body:
          "A small prompt change can change AI output. Use pull requests so teammates can read the change before it spreads.",
      },
      {
        title: "Use packages for shared prompts",
        body:
          "If many projects need the same repeatable workflow, turn it into a skill and publish it with AIPM so each project can pin an exact version. For prompts from the AIPM prompt library, aipm add <prompt URL> saves a Markdown snapshot in the project; prompt snapshots have no version numbers, and aipm update pulls the newest content.",
      },
    ],
    steps: [
      "Create a folder for AI files in the repo.",
      "Add the prompt, its purpose, and examples.",
      "Commit the file to Git.",
      "Review changes before merging.",
      "Turn shared, repeatable workflows into versioned AIPM skills.",
    ],
    faqs: [
      {
        question: "Why not keep prompts only in a shared document?",
        answer:
          "A shared document is easy to read, but it may not match the project. Git keeps the prompt near the code that uses it.",
      },
      {
        question: "When should a prompt become a skill?",
        answer:
          "When it is a repeatable task that is useful in more than one project or for more than one teammate. A skill gets a name, an exact version, and an install command.",
      },
    ],
  },
  {
    slug: "share-cursor-rules",
    title: "How to Share Cursor Rules Across a Team",
    h1: "How do you share Cursor rules across a team?",
    description:
      "Learn a simple way to package Cursor rules so every project can install the same AI workflow.",
    answer:
      "Save Cursor rules as .mdc files in .cursor/rules and share them through Git. AIPM does not install Cursor rules today; if a rule is really a repeatable task, turn it into a skill and install that with AIPM.",
    keywords: ["share Cursor rules", "Cursor rules", "Cursor skills", "AIPM Cursor"],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "Cursor rules should be visible",
        body:
          "If a rule changes how Cursor works, the team should be able to read it. Keep rules in files, not only in a private note.",
      },
      {
        title: "Reusable rules should have a name",
        body:
          "A rule for code review, test writing, or release notes can become a package. A name makes it easier to find and install.",
      },
      {
        title: "Where AIPM fits",
        body:
          "AIPM installs skills, not rules (rules packaging is planned). Cursor loads skills from .claude/skills and .agents/skills, so a skill installed with aipm add --target claude or --target codex works in Cursor and travels with the project.",
      },
    ],
    steps: [
      "Pick a Cursor rule the team uses often.",
      "Write what the rule does in simple words.",
      "Add a small example.",
      "Share always-on rules through Git; turn task-style rules into a skill.",
      "Install the skill in other projects with AIPM (--target claude or --target codex).",
    ],
    faqs: [
      {
        question: "Can Cursor rules be different per project?",
        answer:
          "Yes. Keep project-specific rules in that project. Package only the rules that are useful in many projects.",
      },
      {
        question: "Does AIPM replace Cursor?",
        answer:
          "No. AIPM installs versioned skills that Cursor, Claude Code, and Codex can load. It does not install Cursor rules.",
      },
    ],
  },
  {
    slug: "reusable-claude-skills",
    title: "How to Publish Reusable Claude Skills",
    h1: "How do you publish reusable Claude skills?",
    description:
      "Learn how to turn a repeated Claude workflow into a simple skill package that teams can install.",
    answer:
      "Save the steps in a skill file and add an example. Publish the skill with AIPM. Then install it in each project that needs it.",
    keywords: ["Claude skills", "Claude Code skills", "publish Claude skills", "AIPM Claude"],
    sections: [
      {
        title: "Start with one repeated job",
        body:
          "Good Claude skills are small. Pick one job, such as summarizing an issue, reviewing code, writing release notes, or explaining a module.",
      },
      {
        title: "Make the expected output clear",
        body:
          "Tell Claude what format to use. A checklist, table, or short report is easier to reuse than a vague instruction.",
      },
      {
        title: "Publish only safe files",
        body:
          "Do not include private prompts, customer data, logs, or secrets. Run a preview before publishing.",
      },
    ],
    steps: [
      "Create a skill folder.",
      "Write the skill goal and limits.",
      "Add one or two examples.",
      "Run aipm publish preview.",
      "Publish and install the package where needed.",
    ],
    faqs: [
      {
        question: "Can one Claude skill work in many repos?",
        answer:
          "Yes, if the skill is written for a common task and does not depend on private project details.",
      },
      {
        question: "What should a beginner include first?",
        answer:
          "Start with the goal, when to use the skill, what input is needed, and what output Claude should return.",
      },
    ],
  },
  {
    slug: "ai-agent-instructions-git",
    title: "How to Manage AI Agent Instructions in Git",
    h1: "How do you manage AI agent instructions in Git?",
    description:
      "A beginner-friendly guide to keeping AI agent instructions in Git so teams can review, reuse, and update them.",
    answer:
      "Keep important AI agent instructions as files in the repo. Review them in pull requests and package shared instructions with AIPM.",
    keywords: ["AI agent instructions", "AI instructions in Git", "agent skills", "AIPM"],
    sections: [
      {
        title: "Instructions are part of the project",
        body:
          "AI tools affect how work gets done. Their instructions should be visible to the team, just like tests, docs, and config files.",
      },
      {
        title: "Git gives you history",
        body:
          "When an instruction changes, Git shows who changed it and why. That makes it easier to fix mistakes later.",
      },
      {
        title: "Packages help across projects",
        body:
          "If the same instruction is useful in many repos, package it. Then the team can install it instead of copying it again and again.",
      },
    ],
    steps: [
      "Create a clear folder for AI instructions.",
      "Use simple file names.",
      "Explain what each instruction is for.",
      "Review changes in pull requests.",
      "Package shared instructions with AIPM.",
    ],
    faqs: [
      {
        question: "Should all AI instructions be public?",
        answer:
          "No. Keep private business details and secrets out of public packages.",
      },
      {
        question: "Why put AI instructions in Git?",
        answer:
          "Git makes the instructions easy to review, update, and roll back.",
      },
    ],
  },
  {
    slug: "share-ai-prompts-team",
    title: "How to Share AI Prompts With a Team",
    h1: "How do you share AI prompts with a team?",
    description:
      "A simple guide for sharing useful AI prompts with teammates without losing context or copying old versions.",
    answer:
      "Put important prompts in shared project files and explain when to use them. To share a prompt from the AIPM prompt library, run aipm add <prompt URL>: it saves a Markdown snapshot in .aipm/prompts/ and records the URL in aipm.package.json, so teammates restore it with aipm install.",
    keywords: ["share AI prompts", "team prompts", "prompt management", "AIPM prompts", "prompt package manager"],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "A shared prompt needs context",
        body:
          "A prompt is not just text. It should also explain when to use it, what input it needs, and what good output looks like.",
      },
      {
        title: "Files are better than chat history",
        body:
          "A prompt is hard to reuse when it is hidden in an old chat. A shared file gives the team one clear place to find it.",
      },
      {
        title: "Track library prompts with AIPM",
        body:
          "aipm add https://www.aipm-registry.com/prompts/<publisher>/<slug> saves the prompt as .aipm/prompts/<publisher>--<slug>.md and tracks its URL in aipm.package.json. Commit both, and teammates run aipm install to restore the same snapshots. aipm update rewrites a snapshot only when the published prompt changed, and aipm remove deletes it. Prompts do not have version numbers, so you cannot pin an older revision.",
      },
      {
        title: "Use a skill when you need a pinned version",
        body:
          "If a prompt has become a repeatable task that several projects rely on, turn it into a skill. Skills are published with exact versions, and each project pins the version it uses.",
      },
    ],
    steps: [
      "Pick one prompt the team uses often.",
      "Write the prompt in a project file, or find it in the AIPM prompt library.",
      "Add a short note that explains when to use it.",
      "Add one example input and output.",
      "For a library prompt, run aipm add <prompt URL> and commit aipm.package.json and .aipm/prompts/.",
    ],
    faqs: [
      {
        question: "Should team prompts be public?",
        answer:
          "Only publish prompts that are safe to share. Keep private business details, customer data, and secrets out of public prompts and packages.",
      },
      {
        question: "Why not paste prompts in Slack?",
        answer:
          "Slack is useful for discussion, but a project file is easier to review, update, and restore.",
      },
      {
        question: "Can I pin a prompt to a version?",
        answer:
          "No. Prompt snapshots are tracked by content, not version numbers, and aipm update pulls the newest content. Use a skill when you need an exact, pinned version.",
      },
    ],
  },
  {
    slug: "manage-cursor-rules-git",
    title: "How to Manage Cursor Rules in Git",
    h1: "How do you manage Cursor rules in Git?",
    description:
      "Learn how to keep Cursor rules in Git so a team can review, update, and reuse them safely.",
    answer:
      "Save Cursor rules as .mdc files in .cursor/rules, commit them to Git, and review changes in pull requests. For task-style instructions that many repos need, use a skill that AIPM can install.",
    keywords: ["Cursor rules Git", "manage Cursor rules", "Cursor AI rules", "AIPM Cursor"],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "Rules should be reviewable",
        body:
          "Cursor rules can change how AI suggestions behave. A team should be able to read and review those rules before they spread.",
      },
      {
        title: "Git shows what changed",
        body:
          "Git shows the team every change to a rule. People can discuss the change and undo it if the AI starts giving poor answers.",
      },
      {
        title: "Reusable rules can become packages",
        body:
          "Some instructions are useful in many projects. AIPM does not package Cursor rules today, but a task-style instruction can become a skill that AIPM installs into each project at a pinned version.",
      },
    ],
    steps: [
      "Create a clear folder for Cursor rules.",
      "Use names that explain the task.",
      "Commit the rules to Git.",
      "Review rule changes in pull requests.",
      "Turn task-style rules that many projects need into a skill.",
    ],
    faqs: [
      {
        question: "Should every Cursor rule be shared?",
        answer:
          "No. Keep project-only rules in that project. Share rules that help many repos.",
      },
      {
        question: "Can AIPM install Cursor rules?",
        answer:
          "Not today. AIPM installs skills (SKILL.md folders); Cursor rules packaging is planned. Cursor loads skills installed with --target claude or --target codex.",
      },
    ],
  },
  {
    slug: "reuse-claude-code-workflows",
    title: "How to Reuse Claude Code Workflows",
    h1: "How do you reuse Claude Code workflows?",
    description:
      "A beginner-friendly guide to turning repeated Claude Code tasks into reusable skill packages.",
    answer:
      "Save the repeated steps as a small skill and add an example. Use AIPM to install it in each project that needs it.",
    keywords: ["Claude Code workflows", "reuse Claude workflows", "Claude skills", "AIPM Claude"],
    sections: [
      {
        title: "Start with one job",
        body:
          "A reusable workflow should do one clear job. Good examples are code review, bug triage, release notes, test planning, and docs updates.",
      },
      {
        title: "Make the output predictable",
        body:
          "Claude works better when the skill says what format to use. Ask for a checklist, short report, or clear sections.",
      },
      {
        title: "Install the same workflow everywhere",
        body:
          "After a workflow is packaged, AIPM can install it into each project. The team no longer has to copy the same prompt by hand.",
      },
    ],
    steps: [
      "Choose one Claude Code task your team repeats.",
      "Write the goal, input, and output format.",
      "Add examples and safety limits.",
      "Publish the workflow as an AIPM package.",
      "Install it into projects that need the same task.",
    ],
    faqs: [
      {
        question: "What makes a good Claude Code workflow?",
        answer:
          "A good workflow is small, clear, and tested on real work. It tells Claude what to do and what not to do.",
      },
      {
        question: "Can different projects use different versions?",
        answer:
          "Yes. AIPM packages have versions, so projects can update when they are ready.",
      },
    ],
  },
  {
    slug: "package-mcp-server-setup",
    title: "How to Package MCP Server Setup",
    h1: "How do you package MCP server setup?",
    description:
      "Learn how to document MCP server setup so teams can install the same AI tool workflow without sharing secrets.",
    answer:
      "Package the public MCP setup notes, usage rules, and examples. Keep private tokens and secret values outside the package.",
    keywords: ["package MCP server setup", "MCP server setup", "MCP config", "AIPM MCP"],
    sections: [
      {
        title: "Separate public setup from secrets",
        body:
          "A package can explain which MCP server to use and how the assistant should use it. It should not include real secret values.",
      },
      {
        title: "Explain when to use the server",
        body:
          "Tell the assistant what the MCP server is for. Also say when not to use it, especially if it can access private systems.",
      },
      {
        title: "Give users a safe checklist",
        body:
          "A good MCP package gives users a short checklist. It says what to install, which settings to add, and how to test the connection.",
      },
    ],
    steps: [
      "Write what the MCP server does.",
      "List config files that are safe to share.",
      "List private values without including the values.",
      "Add a simple test command or check.",
      "Publish the safe setup notes as a package.",
    ],
    faqs: [
      {
        question: "Can I publish MCP tokens in a package?",
        answer:
          "No. Publish instructions, not secret values. Users should add their own tokens locally.",
      },
      {
        question: "Why package MCP setup at all?",
        answer:
          "It keeps the setup consistent, so every project does not need to rebuild the same notes from scratch.",
      },
    ],
  },
  {
    slug: "aipm-vs-copying-prompts",
    title: "AIPM vs Copying Prompts Manually",
    h1: "Why use AIPM instead of copying prompts manually?",
    description:
      "Compare AIPM with manual prompt copying and learn when a package manager is worth using.",
    answer:
      "Manual copying is fine for one quick prompt. AIPM is better when a skill needs to be reused, pinned to a version, reviewed, and updated across projects, or when you want to track prompts from the AIPM prompt library.",
    keywords: ["AIPM vs prompts", "copy prompts manually", "AI prompt management", "AI package manager"],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "Manual copying is fast at first",
        body:
          "Copying a prompt is easy when one person needs it once. The problem starts when many people copy different versions.",
      },
      {
        title: "AIPM gives the workflow a version",
        body:
          "A package has a name and version. That makes it easier to know which workflow a project uses.",
      },
      {
        title: "Teams need review and updates",
        body:
          "When a shared AI workflow changes, teammates should be able to review it. A package makes that change visible.",
      },
    ],
    steps: [
      "Use manual copying for a one-time experiment.",
      "Use project files when the prompt matters to one repo.",
      "Use AIPM when the workflow is reused across projects.",
      "Publish a new package version when the workflow changes.",
      "Update projects when the team is ready.",
    ],
    faqs: [
      {
        question: "Is AIPM always needed?",
        answer:
          "No. AIPM is useful when the workflow is shared, repeated, or important enough to review.",
      },
      {
        question: "What is the main benefit over copy-paste?",
        answer:
          "AIPM gives reusable AI setup a name, version, install command, and review path.",
      },
    ],
  },
  {
    slug: "ai-agent-configuration-files",
    title: "AI Agent Configuration Files Explained",
    h1: "What are AI agent configuration files?",
    description:
      "A practical guide to AGENTS.md, CLAUDE.md, Cursor rules, MCP config, skills, and other files used by AI coding agents.",
    answer:
      "AI agent configuration files are project files that tell coding agents how to work in a repo. They can define rules, workflows, tools, memory, skills, and MCP server setup.",
    keywords: [
      "AI agent configuration files",
      "coding agent configuration",
      "AGENTS.md",
      "CLAUDE.md",
      "Cursor rules",
      "MCP config",
    ],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "The problem developers hit",
        body:
          "AI coding tools use many setup files. A project may use AGENTS.md, CLAUDE.md, Cursor rules, MCP files, skill folders, and special commands. Without one clear system, the files may stop matching each other. For which Claude Code feature to use when, see [skills vs MCP vs subagents vs hooks](/guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks).",
      },
      {
        title: "The files have different jobs",
        body:
          "Context files explain the repo. Rules guide behavior. Skills package repeatable workflows. MCP config connects the agent to tools. Each file type has its own home, so keep them reviewed in Git.",
      },
      {
        title: "Why AIPM helps",
        body:
          "AIPM handles the skills part: it installs versioned skills into Claude Code and Codex (which Cursor also reads) and records the version for the team. It does not install AGENTS.md, CLAUDE.md, Cursor rules, or MCP config today; those stay in Git.",
      },
    ],
    steps: [
      "List the AI tools your repo supports.",
      "Find the config files each tool reads.",
      "Move shared instructions into one reviewed source.",
      "Keep tool-specific files small and clear.",
      "Install reusable skills with AIPM.",
    ],
    faqs: [
      {
        question: "Are AI agent configuration files code?",
        answer:
          "They are not normal app code, but they affect how work is done. Treat them like project config and review them in Git.",
      },
      {
        question: "Which file should a team start with?",
        answer:
          "Start with one shared instruction file for the repo, then add tool-specific files only when needed.",
      },
    ],
  },
  {
    slug: "agents-md-vs-claude-md-vs-cursor-rules",
    title: "AGENTS.md vs CLAUDE.md vs Cursor Rules",
    h1: "What is the difference between AGENTS.md, CLAUDE.md, and Cursor rules?",
    description:
      "Compare AGENTS.md, CLAUDE.md, and Cursor rules so developers can choose the right instruction files for AI coding agents.",
    answer:
      "AGENTS.md is a shared instruction file for coding agents. CLAUDE.md is mainly for Claude Code. Cursor rules are mainly for Cursor. Teams often use one shared source plus small tool-specific files.",
    keywords: [
      "AGENTS.md vs CLAUDE.md",
      "CLAUDE.md vs Cursor rules",
      "AGENTS.md Cursor",
      "AI coding agent instructions",
    ],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "AGENTS.md is the shared layer",
        body:
          "AGENTS.md gives coding agents a predictable place to read repo instructions. It is useful when a team wants one common file for agent behavior.",
      },
      {
        title: "CLAUDE.md is for Claude Code",
        body:
          "CLAUDE.md is useful when a repo has Claude Code-specific setup. It can include commands, project notes, and expectations that matter for Claude workflows.",
      },
      {
        title: "Cursor rules are for Cursor",
        body:
          "Cursor rules guide Cursor inside the editor. They are useful for file patterns, coding style, review behavior, and project-specific rules.",
      },
    ],
    steps: [
      "Put shared repo rules in one main instruction file.",
      "Add CLAUDE.md only for Claude-specific behavior.",
      "Add Cursor rules only for Cursor-specific behavior.",
      "Keep duplicated text short.",
      "Turn repeatable tasks into skills and install them with AIPM when several repos need them.",
    ],
    faqs: [
      {
        question: "Should I copy the same rules into every file?",
        answer:
          "No. The copies may stop matching each other. Keep one main file and add short notes only when a specific AI tool needs them.",
      },
      {
        question: "Can AIPM install these files?",
        answer:
          "No. AIPM does not install AGENTS.md, CLAUDE.md, or Cursor rules; keep those in Git. AIPM installs skills: --target claude writes .claude/skills/<skill>/SKILL.md and --target codex writes .agents/skills/<skill>/SKILL.md, and Cursor loads skills from both folders.",
      },
    ],
  },
  {
    slug: "cursor-rules-best-practices",
    title: "Cursor Rules Best Practices for Teams",
    h1: "What are the best practices for Cursor rules?",
    description:
      "A developer guide to writing Cursor rules that are clear, reviewable, and reusable across projects.",
    answer:
      "Good Cursor rules are short and clear. Keep them in Git so the team can review them. Package a rule when several projects need it.",
    keywords: ["Cursor rules best practices", "Cursor rules", ".cursor rules", "Cursor AI rules", "AIPM Cursor"],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "Keep rules small",
        body:
          "A rule should explain one behavior. Large rule files are harder to review and easier for an AI assistant to misunderstand.",
      },
      {
        title: "Use Git review",
        body:
          "Cursor rules can change generated code. Review rule changes like you review lint rules, tests, or build config.",
      },
      {
        title: "Package rules that repeat",
        body:
          "A rule may be useful in many projects. Share always-on rules through Git. If the rule is really a repeatable task, turn it into a skill that AIPM can install at a pinned version (AIPM does not install Cursor rules today).",
      },
    ],
    steps: [
      "Write one rule per job.",
      "Name files by task or code area.",
      "Avoid secrets and private customer data.",
      "Review changes in pull requests.",
      "Turn shared task-style rules into skills.",
    ],
    faqs: [
      {
        question: "Should Cursor rules live in Git?",
        answer:
          "Yes. If a rule affects project work, the team should be able to review and change it in Git.",
      },
      {
        question: "When should I package a Cursor rule?",
        answer:
          "Package it when the same rule is useful in more than one repo or team.",
      },
    ],
  },
  {
    slug: "claude-code-skills-guide",
    title: "Claude Code Skills Guide for Developers",
    h1: "How do Claude Code skills work?",
    description:
      "Learn what Claude Code skills are, when to use them, and how AIPM can help teams share reusable skills.",
    answer:
      "Claude Code skills are reusable instruction packages for Claude workflows. They help Claude do a specific job, such as review code, write tests, or update docs.",
    keywords: ["Claude Code skills", "Claude skills", "Claude Code skill package", "AIPM Claude Code"],
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "Skills are for repeatable work",
        body:
          "Use a skill when the same task happens often. Good examples are code review, issue triage, release notes, test writing, and migration steps. Not sure a skill is the right tool? Compare [skills vs MCP vs subagents vs hooks](/guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks).",
      },
      {
        title: "A skill should be focused",
        body:
          "A small skill is easier to trust. It should say what input it needs, what output to produce, and what limits to follow.",
      },
      {
        title: "AIPM helps distribute skills",
        body:
          "AIPM gives each skill a name and version number. This helps a team install the same skill in many projects.",
      },
    ],
    steps: [
      "Pick one repeated Claude Code task.",
      "Write the instructions and expected output.",
      "Add examples from real project work.",
      "Test the skill in one repo.",
      "Publish and install it with AIPM when it is ready.",
    ],
    faqs: [
      {
        question: "Is a Claude Code skill just a prompt?",
        answer:
          "It can include prompt-like instructions, but it is packaged as a reusable workflow instead of a one-time chat message.",
      },
      {
        question: "Should every workflow become a skill?",
        answer:
          "No. Start with tasks that repeat and have a clear output format.",
      },
    ],
  },
  {
    slug: "mcp-json-guide-cursor-claude",
    title: "mcp.json Guide for Cursor and Claude Code",
    h1: "How should teams manage mcp.json for Cursor and Claude Code?",
    description:
      "A practical guide to managing MCP config files safely across Cursor, Claude Code, and team repos.",
    answer:
      "Teams should keep safe MCP config and setup notes in Git and keep secret values local. Cursor reads .cursor/mcp.json and Claude Code reads .mcp.json at the project root. AIPM does not install MCP config today; MCP packaging is planned.",
    keywords: ["mcp.json", "MCP config", "Cursor MCP", "Claude Code MCP", "MCP server setup"],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "MCP config connects agents to tools",
        body:
          "MCP lets AI coding agents use external tools and data sources. That makes setup powerful, but it also means config needs review.",
      },
      {
        title: "Do not commit secrets",
        body:
          "A shared config can say which server to use and which environment variables are needed. It should not include real tokens, passwords, or private values.",
      },
      {
        title: "Reuse the same setup across repos",
        body:
          "Several projects may need the same MCP setup. Keep one reviewed copy of the safe settings and setup notes in Git and copy it into each repo; each project adds its own private values. AIPM installs skills today, not MCP config.",
      },
    ],
    steps: [
      "Write what the MCP server does.",
      "List the safe config files.",
      "List required environment variables without values.",
      "Add a test step so users can confirm setup.",
      "Review the shared config in Git before other repos copy it.",
    ],
    faqs: [
      {
        question: "Can mcp.json be shared in Git?",
        answer:
          "Yes, if it does not include secrets. Keep private values in local environment variables or ignored files.",
      },
      {
        question: "Can AIPM install MCP servers?",
        answer:
          "Not today. AIPM installs versioned skills into Claude Code and Codex (Cursor reads both folders) and tracks prompts. MCP server packaging is planned; until then, keep MCP config in Git.",
      },
    ],
  },
  {
    slug: "cursor-rules-vs-agents-md",
    title: "Does Cursor Read AGENTS.md? Cursor Rules vs AGENTS.md",
    h1: "Does Cursor read AGENTS.md, and should you use it or Cursor rules?",
    description:
      "Yes, Cursor reads AGENTS.md, including nested files. See when to use AGENTS.md vs Cursor project rules (.cursor/rules/*.mdc), and how Claude Code reads AGENTS.md too.",
    answer:
      "Yes. Cursor reads AGENTS.md in the project root and in subfolders. Use AGENTS.md for plain project instructions that Cursor, Codex, and (since v2.1.277) Claude Code can all read. Use Cursor project rules in .cursor/rules when you need Cursor-only control, such as rules that apply only to certain files. Many teams use both.",
    keywords: [
      "does Cursor read AGENTS.md",
      "Cursor AGENTS.md",
      "Cursor agents.md support",
      "Cursor rules vs AGENTS.md",
      "AGENTS.md vs Cursor rules",
      "Cursor project rules",
    ],
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "Does Cursor support AGENTS.md?",
        body:
          "Yes. Cursor documents AGENTS.md as a simple alternative to .cursor/rules. Put one AGENTS.md in the project root, and add more AGENTS.md files in subfolders when one part of the code needs its own instructions. Cursor combines nested files with their parent folders, and the more specific file wins when they conflict.",
      },
      {
        title: "AGENTS.md is the shared, plain-text option",
        body:
          "AGENTS.md is a normal Markdown file with no frontmatter. It can list build commands, test steps, code style, and limits. Because it is not tied to one editor, other coding agents can read it too. OpenAI Codex reads AGENTS.md, and Claude Code v2.1.277 and later reads it when the project has no CLAUDE.md or CLAUDE.local.md.",
      },
      {
        title: "Cursor rules give you more control",
        body:
          "Cursor project rules live in .cursor/rules as .mdc files. Each rule has frontmatter that decides when it applies: always, when the agent decides it is relevant, when a matching file is open (globs), or only when you @-mention it. A plain .md file in .cursor/rules is ignored, so use AGENTS.md if you want plain Markdown.",
      },
      {
        title: "Use both with one clear owner",
        body:
          "Keep shared repo facts in AGENTS.md. Put only Cursor-specific or file-scoped behavior in Cursor rules. AIPM does not install AGENTS.md or Cursor rules; if a repeatable task is used in many repos, make it a skill and install the same reviewed version with AIPM.",
      },
    ],
    steps: [
      "Write the instructions that every coding agent needs.",
      "Put those shared instructions in AGENTS.md at the project root.",
      "Add nested AGENTS.md files only where a folder needs different instructions.",
      "Add Cursor project rules (.mdc) only for Cursor-only or file-scoped behavior.",
      "If the project also has a CLAUDE.md, add @AGENTS.md to it so Claude Code reads the shared file.",
      "Review both files in Git and remove repeated text.",
    ],
    faqs: [
      {
        question: "Does Cursor read AGENTS.md?",
        answer:
          "Yes. Cursor supports AGENTS.md in the project root and in subdirectories. Nested files apply when Cursor works with files in that folder.",
      },
      {
        question: "Does Claude Code read AGENTS.md?",
        answer:
          "Yes, from Claude Code v2.1.277. By default it reads AGENTS.md only when there is no CLAUDE.md, .claude/CLAUDE.md, or CLAUDE.local.md in the working directory or above it. If you keep a CLAUDE.md, import the shared file with @AGENTS.md.",
      },
      {
        question: "Should I use AGENTS.md or Cursor rules?",
        answer:
          "Use AGENTS.md for plain instructions every agent should see. Use Cursor rules when you need Cursor-only features such as glob-scoped or manually attached rules.",
      },
      {
        question: "Are .cursorrules files still recommended?",
        answer:
          "No. Cursor treats .cursorrules as legacy. New projects should use project rules in .cursor/rules or a simple AGENTS.md file.",
      },
    ],
    sources: [
      { label: "Cursor documentation: Rules and AGENTS.md", href: "https://cursor.com/docs/rules" },
      { label: "Claude Code documentation: CLAUDE.md and AGENTS.md", href: "https://code.claude.com/docs/en/memory" },
      { label: "AGENTS.md", href: "https://agents.md" },
    ],
  },
  {
    slug: "claude-code-skills-vs-slash-commands",
    title: "Claude Code Skills vs Slash Commands",
    h1: "What is the difference between Claude Code skills and slash commands?",
    description:
      "Learn how Claude Code skills and slash commands work together. See which one to use for a new task.",
    answer:
      "Claude Code now treats a custom slash command as a skill. Old command files still work. For a new reusable task, create a SKILL.md file in the .claude/skills folder. You can start a skill with a slash command, or Claude can choose it when it matches your task.",
    keywords: [
      "Claude Code skills vs slash commands",
      "Claude Code custom commands",
      "Claude Code SKILL.md",
      ".claude skills",
    ],
    sections: [
      {
        title: "The old formats now work together",
        body:
          "A command file and a skill can both create a slash command. You do not need to change old command files now. Use the skill format for new tasks. To choose between skills, subagents, hooks and MCP, see [skills vs MCP vs subagents vs hooks](/guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks).",
      },
      {
        title: "Skills can hold more than one file",
        body:
          "A skill starts with a SKILL.md file. It can also include examples, small programs, and helpful documents. Claude reads these files only when it needs the skill.",
      },
      {
        title: "Package skills when teams reuse them",
        body:
          "Keep a one-repo skill in that repo. When several repos need it, use AIPM to give it a name, version, and repeatable install command.",
      },
    ],
    steps: [
      "Keep working custom command files if they still do the job.",
      "Create new workflows in .claude/skills with a SKILL.md file.",
      "Write a clear name and description so Claude knows when to use the skill.",
      "Test both direct slash use and automatic use.",
      "Publish shared skills with AIPM.",
    ],
    faqs: [
      {
        question: "Do old Claude Code custom commands still work?",
        answer:
          "Yes. Files in .claude/commands still work. Claude Code has merged custom commands into the Skills model.",
      },
      {
        question: "Can a skill be called with a slash command?",
        answer:
          "Yes. A skill can be called directly with its slash name, and Claude can also choose it when the task matches.",
      },
    ],
    sources: [
      {
        label: "Claude Code documentation: Extend Claude with skills",
        href: "https://code.claude.com/docs/en/slash-commands",
      },
    ],
  },
  {
    slug: "share-ai-coding-agent-instructions",
    title: "How to Share AI Coding Agent Instructions Across Repos",
    h1: "How do you share AI coding agent instructions across repos?",
    description:
      "Learn how to share AI instructions across projects without keeping many different copies.",
    answer:
      "Keep one reviewed source for shared instructions and keep repo-specific details in each repo. AIPM does not install AGENTS.md, CLAUDE.md, or Cursor rules, but shared task workflows can become skills that AIPM installs into every repo at the same pinned version.",
    keywords: [
      "share AI coding agent instructions",
      "share AGENTS.md across repos",
      "reuse CLAUDE.md",
      "sync Cursor rules",
    ],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "Copied files soon become different",
        body:
          "A copied instruction does not get later updates. After some time, each project may have different rules even when the team expects them to match.",
      },
      {
        title: "Split shared and local instructions",
        body:
          "Shared instructions should cover common review, testing, security, and documentation work. Repo-specific files should cover local commands, architecture, and limits.",
      },
      {
        title: "Install a reviewed version",
        body:
          "Turn shared task workflows into a skill. AIPM installs the same SKILL.md into .claude/skills (Claude Code) or .agents/skills (Codex), and Cursor loads both. Each repo pins a named version in aipm.package.json, so updates are visible and can be reviewed before they spread.",
      },
    ],
    steps: [
      "List the instructions repeated in several repos.",
      "Remove private and repo-specific details.",
      "Move shared task workflows into a SKILL.md.",
      "Publish the skill with AIPM.",
      "Install and update the package through normal Git review.",
    ],
    faqs: [
      {
        question: "Should every repo use exactly the same instructions?",
        answer:
          "No. Share the common base and keep local commands, architecture, and product rules in each repo.",
      },
      {
        question: "How do teams keep instructions the same?",
        answer:
          "Keep shared task workflows in one skill with a version number and update each project with aipm update instead of copying files by hand. Keep always-on instruction files (AGENTS.md, CLAUDE.md, Cursor rules) in Git.",
      },
    ],
    sources: [
      { label: "Cursor documentation: Rules", href: "https://docs.cursor.com/context/rules-for-ai" },
      {
        label: "Claude Code documentation: Memory files",
        href: "https://code.claude.com/docs/en/memory",
      },
    ],
  },
  {
    slug: "manage-ai-prompts-in-git",
    title: "How to Manage AI Prompts in Git",
    h1: "What is the best way to manage AI prompts in Git?",
    description:
      "Learn how to save, check, test, and share important AI prompts in a project folder.",
    answer:
      "Store important prompts as named files, explain their input and output, and review changes in pull requests so Git keeps the history. When a prompt becomes a repeatable task used in several repos, turn it into a versioned skill.",
    keywords: ["manage AI prompts in Git", "prompt version control", "AI prompts GitHub", "version prompts"],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "Treat important prompts like project settings",
        body:
          "A prompt can change generated code, tests, or documents. Put important prompts near the project, use clear file names, and let the team review changes.",
      },
      {
        title: "Record what good output means",
        body:
          "A prompt file should say when to use it and what information it needs. It should also describe the result. Add a small example when possible.",
      },
      {
        title: "Use packages across repositories",
        body:
          "Git handles history inside one repo. When the same workflow is needed in several repos, a skill gets a package name, an exact version, and an install command with AIPM. Prompts from the AIPM prompt library can be tracked as Markdown snapshots (no version numbers).",
      },
    ],
    steps: [
      "Move repeated prompts out of chat history.",
      "Give each prompt one clear job and file name.",
      "Add expected input, output, and a small example.",
      "Review prompt changes in pull requests.",
      "Turn workflows that must stay aligned across repos into a skill.",
    ],
    faqs: [
      {
        question: "Can Git version AI prompts?",
        answer:
          "Yes. Git records prompt changes, authors, review comments, and earlier versions just like other text files.",
      },
      {
        question: "When should a prompt become a skill?",
        answer:
          "When it is an important, repeatable task that a team reuses in more than one repo. Skills get versions; prompt snapshots do not.",
      },
    ],
  },
  {
    slug: "mcp-server-config-best-practices",
    title: "MCP Server Configuration Best Practices",
    h1: "What are the best practices for MCP server configuration?",
    description:
      "A simple checklist for setting up an MCP server safely and using the same setup in more than one project.",
    answer:
      "Do not put passwords or private tokens in MCP settings files. Give each server only the access it needs. Write down the private settings people must add, test the connection, and review shared files in Git. Package only files that are safe to share.",
    keywords: [
      "MCP server configuration best practices",
      "MCP config security",
      "mcp.json best practices",
      "MCP server setup",
    ],
updatedAt: "2026-09-25",
        sections: [
      {
        title: "Keep secret values local",
        body:
          "Config can name the environment variables a server needs, but it should not contain real tokens or passwords. Use local environment settings or a secret manager for values.",
      },
      {
        title: "Limit access and explain the purpose",
        body:
          "Add only the servers a project needs. Explain what each server can see and when the AI should use it. Also explain which actions need approval from a person.",
      },
      {
        title: "Make setup repeatable",
        body:
          "Store safe config and test steps in Git. If many repos need the same server, reuse one reviewed copy while each user supplies private values locally. AIPM does not install MCP config today.",
      },
    ],
    steps: [
      "Choose the smallest server access that completes the job.",
      "Move tokens and passwords into environment variables.",
      "Document the server purpose and required variables.",
      "Test a safe read action before allowing write actions.",
      "Package only public config and setup instructions.",
    ],
    faqs: [
      {
        question: "Should mcp.json contain API keys?",
        answer:
          "No. Refer to environment variable names and keep the real values outside files that can be committed or published.",
      },
      {
        question: "Can MCP configuration be shared across repos?",
        answer:
          "Yes. Share safe server definitions, setup notes, and tests. Keep secrets and repo-specific access choices local.",
      },
    ],
    sources: [
      {
        label: "Model Context Protocol documentation: Connect to local MCP servers",
        href: "https://modelcontextprotocol.io/docs/develop/connect-local-servers",
      },
      { label: "Cursor documentation: Model Context Protocol", href: "https://docs.cursor.com/context/model-context-protocol" },
    ],
  },
  {
    slug: "aipm-vs-skills-sh",
    title: "AIPM vs Skills.sh — Skills.sh Alternative for Versioned Agent Skills",
    h1: "Looking for a skills.sh alternative? Here is how AIPM compares.",
    description:
      "Honest AIPM vs skills.sh comparison: discovery vs versioned packages, install targets for Claude Code and Codex, and when a package-manager workflow fits better than a directory.",
    answer:
      "Both help people find and install Agent Skills. Skills.sh is a popular Agent Skills directory with its own install command. AIPM is a skills registry plus package-manager workflow for named, versioned packages and target-specific installs (Claude Code and Codex, which Cursor also reads). Use whichever has the skill you trust; AIPM is a strong skills.sh alternative when you need pinned versions and project-local installs.",
    keywords: [
      "skills.sh alternative",
      "AIPM vs Skills.sh",
      "Claude Code skills directory",
      "Agent Skills directory",
      "skillmd alternative",
      "AI skill package manager",
    ],
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "Where they overlap",
        body:
          "Both products help developers discover reusable Agent Skills instead of rebuilding the same instructions for every project. Both lead users from a public skill page to an installation workflow.",
      },
      {
        title: "How AIPM is different",
        body:
          "AIPM treats a skill as a named package with a publisher, version, manifest, install command, integrity value, source details, and target list. It can install files for supported tools and keep the selected package version clear.",
      },
      {
        title: "How to choose",
        body:
          "Use the directory that contains the skill you trust. AIPM is useful when your team wants package names, explicit versions, publisher ownership, project-local installation for Claude Code or Codex (Cursor loads both skill folders), and a workflow for publishing updates. Other catalogs (including Skills.sh and SkillMD) may list overlapping or different skills—always check the source and license before installing.",
      },
      {
        title: "What AIPM is not claiming",
        body:
          "AIPM does not claim a larger catalog than Skills.sh or identical safety scanning to every competitor. The honest differentiator is package-manager semantics: named scopes, pinned versions, integrity metadata, and target-aware installs into your repo.",
      },
    ],
    steps: [
      "Search both directories for the job you need.",
      "Read the skill source and license.",
      "Check which AI tools the skill supports.",
      "Compare the install command and version information.",
      "Test the skill in a non-critical project before team-wide use.",
    ],
    faqs: [
      {
        question: "Is AIPM a skills.sh alternative?",
        answer:
          "Yes, for teams that want a registry plus CLI with pinned versions and Claude Code or Codex install targets (Cursor loads skills from both folders). If you only need to browse and run a directory install command, Skills.sh may already fit. Choose based on the skill source you trust and the install workflow you need.",
      },
      {
        question: "Is AIPM connected to Skills.sh?",
        answer: "No. They are separate products and directories with separate publishing and installation workflows.",
      },
      {
        question: "Can the same public skill appear in both directories?",
        answer:
          "Yes, when its license and publisher allow it. Always follow the original source and avoid publishing someone else's work without clear attribution and permission.",
      },
    ],
    sources: [
      { label: "Skills.sh: The Agent Skills Directory", href: "https://skills.sh/" },
      { label: "AIPM publishing guide", href: "https://www.aipm-registry.com/publish/guide" },
    ],
  },
  {
    slug: "claude-code-skills-vs-codex-skills",
    title: "Claude Code Skills vs Codex Skills",
    h1: "What is the difference between Claude Code skills and Codex skills?",
    description:
      "Compare Claude Code skills and Codex skills, including SKILL.md, storage locations, automatic selection, commands, and team sharing.",
    answer:
      "Claude Code and Codex can both use reusable skills built around a SKILL.md file. The main differences are where each tool stores and discovers skills, how users start them, and which product-specific features surround the shared instructions.",
    keywords: ["Claude Code skills vs Codex skills", "Codex SKILL.md", "Claude SKILL.md", "Agent Skills comparison"],
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "The shared idea",
        body:
          "A skill gives an AI tool a reusable job description, steps, examples, and optional resources. Keeping one job per skill makes it easier for both people and agents to choose the right workflow.",
      },
      {
        title: "The important differences",
        body:
          "Claude Code and Codex read skills from their own supported locations and apply their own discovery rules. A skill should avoid product-specific assumptions unless it is intentionally made for one tool. Check each product's current documentation before choosing folders or optional fields.",
      },
      {
        title: "Sharing across a team",
        body:
          "Keep shared skill source in Git, review changes, and state which tools were tested. A package can hold common instructions plus target-specific files when the tools need different layouts.",
      },
    ],
    steps: [
      "Write one clear task in SKILL.md.",
      "Keep common instructions free of tool-specific wording.",
      "Add separate target files only when behavior differs.",
      "Test the skill in Claude Code and Codex.",
      "Record the tested tools and publish a new version when behavior changes.",
    ],
    faqs: [
      {
        question: "Can one SKILL.md work in both Claude Code and Codex?",
        answer:
          "Often yes, when it contains plain task instructions and uses files both tools can read. Product-specific tools, paths, or commands may need separate guidance.",
      },
      {
        question: "Does AIPM install directly into Codex?",
        answer:
          "Yes. aipm add @scope/name@version --target codex writes the skill to .agents/skills/<skill>/SKILL.md with its supporting files, the folder Codex loads project skills from. --target claude writes .claude/skills/<skill>/ for Claude Code.",
      },
    ],
    sources: [
      { label: "Anthropic: Extend Claude with skills", href: "https://code.claude.com/docs/en/skills" },
      { label: "OpenAI Codex: Agent Skills", href: "https://developers.openai.com/codex/skills/" },
    ],
  },
  {
    slug: "agent-skills-vs-mcp",
    title: "Agent Skills vs MCP",
    h1: "What is the difference between Agent Skills and MCP?",
    description:
      "Learn when to use an Agent Skill and when to use MCP. Compare reusable instructions with connections to external tools and information.",
    answer:
      "An Agent Skill teaches an AI how to complete a repeated task. MCP connects an AI application to tools and information. A skill explains the workflow; MCP provides capabilities the workflow may use.",
    keywords: ["Agent Skills vs MCP", "MCP vs skills", "AI agent skills", "Model Context Protocol tools"],
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "Use a skill for repeatable instructions",
        body:
          "A skill is a good fit for code review steps, release notes, testing checks, research methods, or documentation rules. It can include examples and reference files that explain what good work looks like.",
      },
      {
        title: "Use MCP for a connection",
        body:
          "MCP is useful when the AI needs to search a service, read a database, call an API, or use another application. The MCP server exposes approved tools or information to the AI application.",
      },
      {
        title: "Use both for a complete workflow",
        body:
          "A support-triage skill can explain how to investigate an issue, while an MCP connection can provide the ticket and monitoring data. Keep instructions in the skill and private credentials outside shared files. Deciding between skills, MCP, subagents, hooks and plugins in Claude Code? See [skills vs MCP vs subagents vs hooks](/guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks).",
      },
    ],
    steps: [
      "Write down the job the AI must complete.",
      "Create a skill when the missing part is instructions or examples.",
      "Add MCP when the missing part is access to a tool or information source.",
      "Give the MCP server only the access it needs.",
      "Test the full workflow and require approval for important write actions.",
    ],
    faqs: [
      {
        question: "Does an Agent Skill replace MCP?",
        answer: "No. A skill provides instructions. MCP provides a standard connection to tools and information.",
      },
      {
        question: "Can a skill explain how to use an MCP tool?",
        answer:
          "Yes. A skill can explain when to use a tool, what input to provide, how to check its result, and when a person must approve an action.",
      },
    ],
    sources: [
      { label: "Model Context Protocol: Introduction", href: "https://modelcontextprotocol.io/docs/getting-started/intro" },
      { label: "Anthropic: Extend Claude with skills", href: "https://code.claude.com/docs/en/skills" },
    ],
  },
  {
    slug: "how-to-install-claude-code-skills",
    title: "How to Install Claude Skills (App, Code, GitHub, npx)",
    h1: "How do you install Claude skills?",
    description:
      "Install Claude skills in the Claude app (upload a ZIP in Customize > Skills), in Claude Code (~/.claude/skills), from GitHub, with npx skills add, or with AIPM.",
    answer:
      "It depends on where you use Claude. In the Claude app (claude.ai or Claude Desktop), turn on Code execution and file creation, then go to Customize > Skills and upload the skill folder as a ZIP. In Claude Code, put the skill folder (the one that contains SKILL.md) in ~/.claude/skills/ for all projects or .claude/skills/ for one project. You can also install from a plugin marketplace with /plugin, from GitHub with npx skills add owner/repo, or as a pinned version with aipm add --target claude.",
    keywords: [
      "how to install Claude skills",
      "install Claude skills",
      "how to add skills to Claude",
      "install Claude Code skills",
      "install Claude skills from GitHub",
      "npx skills add",
      "upload skill to Claude",
      "where are Claude skills stored",
    ],
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "First, which Claude are you using?",
        body:
          "Skills install differently in each place. The Claude app (claude.ai in a browser or the Claude Desktop app) takes a ZIP upload in settings. Claude Code (the terminal tool and its IDE extensions) reads skill folders from disk. A skill itself is the same thing everywhere: a folder with a SKILL.md file that has name and description frontmatter, plus optional scripts and reference files.",
      },
      {
        title: "Install a skill in the Claude app (claude.ai or Claude Desktop)",
        body:
          "Skills are available on Free, Pro, Max, Team, and Enterprise plans and need code execution. On Free, Pro, or Max, open Settings > Capabilities and turn on Code execution and file creation. On Team or Enterprise, an owner enables Skills and code execution in Organization settings > Plugins & skills. Then open Customize > Skills, click +, choose Create skill > Upload a skill, and upload a ZIP of the skill folder. The skill appears in your list and can be toggled on or off. Uploads fail when the ZIP is too large, the folder name does not match the skill name, or SKILL.md is missing.",
      },
      {
        title: "Install a skill in Claude Code",
        body:
          "Copy the skill folder into ~/.claude/skills/<skill-name>/ to use it in every project on your machine, or into .claude/skills/<skill-name>/ inside a repository to share it with everyone who works there (commit it). The folder name becomes the command, so ~/.claude/skills/summarize-changes/SKILL.md is invoked with /summarize-changes, and Claude can also load it automatically when your request matches its description. Claude Code picks up new or edited skills during a session; if you created the top-level skills folder for the first time, restart Claude Code.",
      },
      {
        title: "Install skills from a plugin marketplace in Claude Code",
        body:
          "Many skill collections ship as Claude Code plugins. Run /plugin to browse Anthropic's official marketplace, or add another marketplace first. For example, Anthropic's own example skills install with /plugin marketplace add anthropics/skills and then /plugin install document-skills@anthropic-agent-skills. Plugin skills are namespaced, so they run as /plugin-name:skill-name.",
      },
      {
        title: "Install Claude skills from GitHub by hand",
        body:
          "Download or clone the repository, find the folder that directly contains SKILL.md, and copy that folder, not the whole repository, into ~/.claude/skills/ or .claude/skills/. A common mistake is an extra wrapper folder, such as ~/.claude/skills/repo-main/skills/pdf/SKILL.md, which Claude Code will not find. For the Claude app, ZIP that same skill folder and upload it.",
      },
      {
        title: "Install with npx skills add",
        body:
          "The open-source skills CLI from Vercel Labs installs skills from GitHub and other Git hosts into many agents, including Claude Code. Run npx skills add owner/repo from your project, add --skill <name> to pick one skill, -a claude-code to target Claude Code only, and -g to install globally instead of into the project. npx downloads and runs the package from npm, so read the source repository before installing a skill you do not know.",
      },
      {
        title: "Install a pinned version with AIPM",
        body:
          "AIPM installs a named, versioned skill package and records it in aipm.package.json so a team gets the same revision. Install the CLI with npm install -g @aipm-registry/cli, run aipm init --target claude in the project, then aipm add @scope/name@version --target claude. AIPM writes the skill to .claude/skills/<name>/ in the project; add -g to install under your home directory instead. Review the package source and files on its registry page first.",
      },
      {
        title: "If the skill does not show up or trigger",
        body:
          "In Claude Code, ask What skills are available? or run /skills. Check that SKILL.md is directly inside the skill folder, that the frontmatter starts on the first line, and that the description names the situations the skill is for. In the Claude app, check that the skill is toggled on in Customize > Skills and that code execution is enabled. You can always invoke a Claude Code skill directly with /skill-name.",
      },
    ],
    steps: [
      "Decide where you use Claude: the Claude app, Claude Code, or both.",
      "Get the skill folder (the folder that contains SKILL.md) from a trusted source and read its files.",
      "Claude app: enable code execution, then upload the folder as a ZIP in Customize > Skills.",
      "Claude Code: copy the folder to ~/.claude/skills/ (all projects) or .claude/skills/ (one project), or install it with /plugin, npx skills add, or aipm add --target claude.",
      "Ask Claude for the task the skill describes, or invoke it with /skill-name in Claude Code.",
      "Test on a small example before relying on the skill for important work.",
    ],
    faqs: [
      {
        question: "Where are Claude skills stored?",
        answer:
          "In Claude Code, personal skills are in ~/.claude/skills/ (on Windows, the .claude\\skills folder in your user profile) and project skills are in .claude/skills/ in the repository. Skills uploaded to the Claude app are stored in your Claude account, and Claude Code v2.1.273 or later syncs the skills enabled on your account into ~/.claude/skills/synced/ when you sign in with that account.",
      },
      {
        question: "Can I install Claude skills without Claude Code?",
        answer:
          "Yes. In the Claude app, upload the skill folder as a ZIP in Customize > Skills. You need code execution turned on in Settings > Capabilities (or enabled by your organization owner on Team and Enterprise).",
      },
      {
        question: "How do I install a Claude skill from GitHub?",
        answer:
          "Copy the folder that contains SKILL.md into ~/.claude/skills/ or .claude/skills/, or run npx skills add owner/repo. If the repository is a Claude Code plugin marketplace, add it with /plugin marketplace add owner/repo and install from /plugin.",
      },
      {
        question: "Do Claude skills work in Cursor or Codex?",
        answer:
          "Usually, because skills follow the open Agent Skills standard. Cursor also loads skills from .claude/skills and ~/.claude/skills. Codex loads skills from .agents/skills, so copy or install the folder there.",
      },
      {
        question: "Where does AIPM put a Claude skill?",
        answer:
          "aipm add @scope/name@version --target claude writes the skill to .claude/skills/<name>/ in the project, or under your home directory with -g, and records the version in aipm.package.json.",
      },
      {
        question: "Como instalar skills no Claude Code? / ¿Cómo instalar skills en Claude?",
        answer:
          "Copie a pasta da skill (com o SKILL.md) para ~/.claude/skills/ ou .claude/skills/ no projeto. / En la app de Claude, activa la ejecución de código y sube la carpeta de la skill en un ZIP desde Customize > Skills; en Claude Code, cópiala en ~/.claude/skills/.",
      },
    ],
    sources: [
      { label: "Claude Help Center: Use skills in Claude", href: "https://support.claude.com/en/articles/12512180-using-skills-in-claude" },
      { label: "Claude Code documentation: Extend Claude with skills", href: "https://code.claude.com/docs/en/skills" },
      { label: "Claude Code documentation: Plugins", href: "https://code.claude.com/docs/en/plugins" },
      { label: "anthropics/skills on GitHub", href: "https://github.com/anthropics/skills" },
      { label: "vercel-labs/skills (npx skills)", href: "https://github.com/vercel-labs/skills" },
      { label: "AIPM: Use skills", href: "https://www.aipm-registry.com/use" },
    ],
  },
  {
    slug: "how-to-install-cursor-skills",
    title: "How to Install Cursor AI Skills",
    h1: "How do you install an AI skill for Cursor?",
    description:
      "Install a reusable AI skill for Cursor with AIPM: use --target claude or --target codex so the skill lands in a folder Cursor loads, then review and test it.",
    answer:
      "Cursor loads skills from .cursor/skills and .agents/skills, and also reads .claude/skills and .codex/skills. Install the AIPM CLI, then run aipm add @scope/name@version --target claude (writes .claude/skills/<skill>/SKILL.md) or --target codex (writes .agents/skills/<skill>/SKILL.md). Cursor picks the skill up from either folder. Review the installed files before using them.",
    keywords: ["install Cursor skills", "Cursor AI skills", "add Cursor skill", "Cursor project skill"],
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "Start from the public package page",
        body:
          "Check the description, source, license, publisher, files, examples, and supported targets. A package should say what job it performs and what behavior it changes.",
      },
      {
        title: "Install into the project",
        body:
          "Run the command from the project root. AIPM writes the skill folder into the project and records the pinned version in aipm.package.json, instead of hiding the shared instructions in one person's chat history.",
      },
      {
        title: "Why not --target cursor?",
        body:
          "Today aipm add --target cursor saves the skill as a single file, .cursor/aipm/skills/<skill>.md, without supporting files. Cursor does not load skills from that folder automatically; it expects a folder with a SKILL.md. Until the Cursor target changes, install with --target claude or --target codex.",
      },
      {
        title: "Review before team use",
        body:
          "Read the installed file and test it on a small task. Commit it only when the team agrees that the instructions are safe and useful for the project.",
      },
    ],
    steps: [
      "Run npm install -g @aipm-registry/cli.",
      "Open the project folder in a terminal.",
      "Run aipm init --target claude (or --target codex).",
      "Run aipm add @scope/name@version --target claude --ci.",
      "Review the installed .claude/skills/<skill>/SKILL.md folder.",
      "Open Cursor and test the skill on a small task.",
    ],
    faqs: [
      {
        question: "Where should AIPM put a skill for Cursor?",
        answer:
          "Use --target claude (.claude/skills/<skill>/SKILL.md) or --target codex (.agents/skills/<skill>/SKILL.md); Cursor loads skills from both. --target cursor currently writes .cursor/aipm/skills/<skill>.md, which Cursor does not load automatically.",
      },
      {
        question: "Is a Cursor skill the same as a Cursor project rule?",
        answer:
          "Not exactly. Both provide reusable instructions, but project rules can be scoped to files or conditions while a skill usually describes a task or workflow.",
      },
    ],
    sources: [
      { label: "Cursor documentation: Agent Skills", href: "https://cursor.com/docs/skills" },
      { label: "Cursor documentation: Rules", href: "https://docs.cursor.com/context/rules-for-ai" },
      { label: "AIPM: Use skills", href: "https://www.aipm-registry.com/use" },
    ],
  },
  {
    slug: "how-to-create-agent-skill",
    title: "How to Create an Agent Skill",
    h1: "How do you create a reusable Agent Skill?",
    description:
      "Create a focused Agent Skill with SKILL.md, clear instructions, examples, safety limits, and package metadata that a team can review and share.",
    answer:
      "Choose one repeated job, create a SKILL.md file that explains when and how to do it, add a small example, test it on real tasks, and publish it with a clear name, version, source, and license.",
    keywords: ["how to create Agent Skill", "create AI agent skill", "write SKILL.md", "build Claude skill"],
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-01",
    sections: [
      {
        title: "Give the skill one job",
        body:
          "A focused skill is easier to discover, test, and trust. Use a clear job such as reviewing a pull request, writing release notes, or preparing a support handoff.",
      },
      {
        title: "Write instructions that can be checked",
        body:
          "Explain when to use the skill, the information it needs, the steps it follows, the output it should create, and the actions it must not take. Add one short example of useful input and output.",
      },
      {
        title: "Package and improve it",
        body:
          "Put the skill in Git, review changes, test it on several real tasks, and give shared releases version numbers. AIPM can create the package folder, validate public files, and publish the package page.",
      },
    ],
    steps: [
      "Choose one repeated task with a clear result.",
      "Run aipm publish init --name @your-org/skill-name.",
      "Edit SKILL.md with purpose, steps, limits, and examples.",
      "Add description, targets, license, source URL, and tags to the manifest.",
      "Run aipm publish add . and aipm publish validate.",
      "Test the skill before publishing version 1.0.0.",
    ],
    faqs: [
      {
        question: "How long should SKILL.md be?",
        answer:
          "Use the shortest file that explains the job clearly. Move long reference material into separate files and include it only when the task needs it.",
      },
      {
        question: "What should never be included in a public skill?",
        answer:
          "Do not include passwords, API keys, customer data, private prompts, confidential documents, or instructions that hide risky behavior.",
      },
    ],
    sources: [
      { label: "Anthropic: Extend Claude with skills", href: "https://code.claude.com/docs/en/skills" },
      { label: "OpenAI Codex: Agent Skills", href: "https://developers.openai.com/codex/skills/" },
      { label: "AIPM publishing guide", href: "https://www.aipm-registry.com/publish/guide" },
    ],
  },
  {
    slug: "cursor-rules-vs-agent-skills",
    title: "Cursor Rules vs Skills: Differences and When to Use",
    h1: "Cursor rules vs skills: what is the difference?",
    description:
      "Cursor rules vs skills: rules stay on for a project or file pattern; skills (SKILL.md) load only when a task needs them. See the difference, examples, and /migrate-to-skills.",
    answer:
      "In Cursor, rules are standing instructions: they apply always, to matching files, or when the agent decides they are relevant. Skills are task packages (a folder with SKILL.md) that the agent loads only when a task matches, or when you type /skill-name. Use rules for how the project should always be worked on, and skills for repeatable jobs such as code review or release notes.",
    keywords: [
      "Cursor rules vs skills",
      "Cursor skills vs rules",
      "difference between rules and skills in Cursor",
      "rules vs skills",
      "Cursor agent skills",
      "Cursor SKILL.md",
    ],
    publishedAt: "2026-09-04",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "Rules: standing instructions for normal work",
        body:
          "A Cursor project rule is an .mdc file in .cursor/rules. Its frontmatter decides when it applies: Always Apply, Apply Intelligently (the agent reads the description), Apply to Specific Files (globs), or Apply Manually (@-mention). Rules suit coding style, project structure, required checks, and limits that should stay active.",
      },
      {
        title: "Skills: one repeatable job, loaded on demand",
        body:
          "A Cursor skill is a folder with a SKILL.md file, plus optional scripts, references, and assets. Cursor loads skills from .cursor/skills and .agents/skills (and ~/.cursor/skills for your own machine), and also reads .claude/skills and .codex/skills for compatibility. The agent sees each skill's name and description and loads the full file only when the task matches.",
      },
      {
        title: "Quick way to decide",
        body:
          "Ask: should this instruction be in context for every chat, or only for one kind of task? Every chat or every matching file means a rule. One task, such as reviewing a pull request or writing a migration, means a skill. Skills also follow the open Agent Skills standard, so the same SKILL.md can work in Claude Code and Codex. Using Claude Code too? Compare [skills vs MCP vs subagents vs hooks](/guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks), with the Cursor and Codex equivalent of each.",
      },
      {
        title: "Moving from rules to skills",
        body:
          "Cursor includes a built-in /migrate-to-skills skill (Cursor 2.4) that converts dynamic rules and slash commands into skills. Rules with alwaysApply: true or globs are not migrated because they have explicit triggers. Review the generated files in .cursor/skills before committing them.",
      },
    ],
    steps: [
      "List the instructions that should apply during normal Cursor work.",
      "Keep those instructions in project rules (.cursor/rules/*.mdc) or AGENTS.md.",
      "List the longer tasks that happen only when needed.",
      "Create one focused skill folder with SKILL.md for each repeated task.",
      "Run /migrate-to-skills if you already have dynamic rules or slash commands.",
      "Test the rule and skill together, remove conflicting text, and use AIPM when another project needs the same reviewed skill version.",
    ],
    faqs: [
      {
        question: "Are skills replacing Cursor rules?",
        answer:
          "No. Rules and skills solve different problems. Rules control ongoing project behavior, while skills provide reusable steps for a task. Cursor keeps both.",
      },
      {
        question: "Where do Cursor skills go?",
        answer:
          "Project skills go in .cursor/skills or .agents/skills. Personal skills go in ~/.cursor/skills or ~/.agents/skills. Each skill is a folder named after the skill with a SKILL.md inside.",
      },
      {
        question: "Can a Cursor project use both rules and skills?",
        answer:
          "Yes. Keep the rule short and use the skill for detailed task steps. Make sure the two files do not give conflicting instructions.",
      },
      {
        question: "Can I use Claude skills in Cursor?",
        answer:
          "Yes. Cursor also loads skills from .claude/skills and ~/.claude/skills, so a SKILL.md written for Claude Code usually works without changes.",
      },
    ],
    sources: [
      { label: "Cursor documentation: Rules", href: "https://cursor.com/docs/rules" },
      { label: "Cursor documentation: Agent Skills", href: "https://cursor.com/docs/skills" },
      { label: "Agent Skills standard", href: "https://agentskills.io" },
    ],
  },
  {
    slug: "agents-md-vs-skill-md",
    title: "AGENTS.md vs SKILL.md: Which File Does What?",
    h1: "AGENTS.md vs SKILL.md: what is the difference?",
    description:
      "AGENTS.md is always-on project context; SKILL.md is a task skill loaded only when needed. Compare them with examples and see how Cursor, Claude Code, and Codex read each.",
    answer:
      "AGENTS.md is one Markdown file of project instructions (commands, code style, test rules) that a coding agent reads at the start of work. SKILL.md is the main file inside a skill folder and explains how to do one task; the agent loads it only when the task matches. Use AGENTS.md for project context and SKILL.md for focused, reusable workflows.",
    keywords: [
      "AGENTS.md vs SKILL.md",
      "agents.md vs skills.md",
      "agent.md vs skill.md",
      "skill.md vs agent.md",
      "AGENTS.md file",
      "SKILL.md format",
    ],
    publishedAt: "2026-09-04",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "AGENTS.md describes the project",
        body:
          "Use AGENTS.md for information an AI coding agent needs every time it works in a repository: build commands, test steps, folder rules, code style, and important limits. It has no required frontmatter. Keep it short, because it is loaded into context at the start of each session.",
      },
      {
        title: "SKILL.md describes a task",
        body:
          "A SKILL.md file lives in its own folder, such as .claude/skills/code-review/SKILL.md. It starts with YAML frontmatter (name and description) and then gives the steps for one job. Agents show only the name and description until the task matches, so many skills cost little context.",
      },
      {
        title: "Which tools read which file",
        body:
          "Cursor reads AGENTS.md (root and nested folders) and loads skills from .cursor/skills, .agents/skills, and .claude/skills. Codex reads AGENTS.md and loads skills from .agents/skills. Claude Code loads skills from .claude/skills and, from v2.1.277, reads AGENTS.md when the project has no CLAUDE.md or CLAUDE.local.md.",
      },
      {
        title: "A project can use both",
        body:
          "AGENTS.md tells the agent how the repository works. A skill then provides detailed steps for a task such as code review or release preparation. Do not repeat the same project facts in every skill. For the full decision in Claude Code, including subagents, hooks and MCP, see [skills vs MCP vs subagents vs hooks](/guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks).",
      },
    ],
    steps: [
      "Put shared repository facts and commands in AGENTS.md.",
      "Choose one repeated task that needs more detailed instructions.",
      "Create a folder for the skill and add SKILL.md with name and description frontmatter.",
      "Write the task purpose, inputs, steps, output, and safety limits.",
      "Test the skill while the project instructions are active.",
      "Package the skill when several projects need the same version.",
    ],
    faqs: [
      {
        question: "Should SKILL.md contain all project instructions?",
        answer:
          "No. Keep general repository instructions in AGENTS.md. Put only the information needed for the skill's task in SKILL.md.",
      },
      {
        question: "Is it AGENTS.md or AGENT.md, SKILL.md or SKILLS.md?",
        answer:
          "The file names tools look for are AGENTS.md (plural) for project instructions and SKILL.md (singular) inside each skill folder.",
      },
      {
        question: "Does Claude Code read AGENTS.md?",
        answer:
          "Yes, from v2.1.277, when there is no CLAUDE.md or CLAUDE.local.md in the working directory or above it. Otherwise, import it from CLAUDE.md with @AGENTS.md.",
      },
      {
        question: "Can one skill work in several repositories?",
        answer:
          "Yes, when the skill avoids project-specific assumptions or clearly explains the information each project must provide.",
      },
    ],
    sources: [
      { label: "AGENTS.md", href: "https://agents.md" },
      { label: "Agent Skills standard", href: "https://agentskills.io" },
      { label: "Claude Code documentation: CLAUDE.md and AGENTS.md", href: "https://code.claude.com/docs/en/memory" },
      { label: "Cursor documentation: Agent Skills", href: "https://cursor.com/docs/skills" },
      { label: "OpenAI Codex: Agent Skills", href: "https://developers.openai.com/codex/skills/" },
    ],
  },
] as const;

export function getSeoGuide(slug: string): SeoGuide | null {
  return SEO_GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export const SEO_GUIDES: SeoGuide[] = [
  ...BASE_SEO_GUIDES,
  ...CLAUDE_SKILLS_GUIDES,
  ...AGENTS_MD_CLAUDE_CODE_GUIDES,
  ...CLAUDE_CODE_FEATURE_COMPARISON_GUIDES,
  ...CLAUDE_SKILLS_LOCATION_GUIDES,
  ...SKILL_MD_FRONTMATTER_GUIDES,
  ...SHARE_CLAUDE_SKILLS_TEAM_GUIDES,
];
