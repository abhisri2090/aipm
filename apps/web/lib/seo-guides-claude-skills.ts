import type { SeoGuide } from "./seo-guides";

/**
 * Claude skills guides added in the 2026-09-25 SEO plan (PR C).
 * Facts were checked against official Anthropic docs and each tool's own site on 2026-09-25;
 * keep the Sources lists current when anything changes.
 */
export const CLAUDE_SKILLS_GUIDES: SeoGuide[] = [
  {
    slug: "what-are-claude-skills",
    title: "What Are Claude Skills? How They Work, With Examples",
    h1: "What are Claude skills?",
    description:
      "Claude skills are folders of instructions (SKILL.md), scripts, and files that Claude loads only when a task needs them. See how they work, examples, and where to get them.",
    answer:
      "Claude skills are folders that teach Claude how to do a specific, repeatable task. Each skill has a SKILL.md file with a name, a description, and instructions, and it can include scripts, templates, or reference files. Claude only sees the short descriptions until a request matches one, then loads that skill in full. Skills work in the Claude app, Claude Code, and the Claude API, and follow the open Agent Skills standard, so the same folder can also work in tools such as Cursor and Codex.",
    keywords: [
      "what are Claude skills",
      "Claude skills explained",
      "how Claude skills work",
      "Claude skills examples",
      "Claude skills tutorial",
      "Anthropic skills",
    ],
    publishedAt: "2026-09-25",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "How a Claude skill works",
        body:
          "A skill is a folder such as brand-guidelines/ containing SKILL.md. The top of SKILL.md is YAML frontmatter with a name and a description; the rest is Markdown instructions. At the start of a conversation Claude sees each enabled skill's name and description. When your request matches a description, Claude reads the full SKILL.md and any files it points to. Because the full text loads only when needed, you can have many skills without filling the context window.",
      },
      {
        title: "What a skill can contain",
        body:
          "Instructions and checklists for a task, example inputs and outputs, templates (for example a slide or document template), reference material such as a style guide or API notes, and scripts that Claude can run with code execution. Keep SKILL.md focused and move long reference material into separate files that SKILL.md links to.",
      },
      {
        title: "Built-in skills from Anthropic",
        body:
          "Anthropic provides skills for creating and editing Excel spreadsheets, Word documents, PowerPoint presentations, and PDFs. With code execution and file creation turned on, Claude uses them automatically when your request needs them. Anthropic also publishes example skills (creative, technical, and enterprise workflows) and a skill-creator skill in the anthropics/skills GitHub repository.",
      },
      {
        title: "Examples of skills people build",
        body:
          "Marketing: apply brand voice and formatting rules to every draft. Operations: turn meeting notes into a standard status report. Documents: fill a company template or check a contract against a checklist. Engineering: review a pull request, write release notes, or follow a deployment runbook. Data: clean a CSV and produce the same chart every week. Good skills do one job and say clearly when they should be used.",
      },
      {
        title: "Skills vs prompts, projects, CLAUDE.md, and MCP",
        body:
          "A prompt is text you paste each time; a skill is saved and loaded automatically when relevant. CLAUDE.md (in Claude Code) is always loaded project context, while a skill loads only for its task. MCP connects Claude to outside tools and data, while a skill teaches Claude how to do a task, and a skill can tell Claude to use an MCP tool. Use a skill whenever you keep repeating the same instructions.",
      },
      {
        title: "Where Claude skills work",
        body:
          "In the Claude app (claude.ai and Claude Desktop) on Free, Pro, Max, Team, and Enterprise plans, with code execution enabled; you manage them in Customize > Skills. In Claude Code, skills live in ~/.claude/skills/ or a project's .claude/skills/, and can also arrive through plugins. In the Claude API, skills are available with the code execution tool. Skills you enable in the Claude app also sync into Claude Code when you sign in with the same account.",
      },
      {
        title: "Only install skills you trust",
        body:
          "A skill can include scripts and instructions that Claude follows, so a malicious skill could try to run unwanted actions or leak data. Anthropic's guidance is to install skills only from trusted sources and to read a skill's files, especially scripts and any network access, before enabling it.",
      },
    ],
    steps: [
      "Try Anthropic's built-in skills: turn on code execution and ask Claude to create a spreadsheet or slide deck.",
      "Pick one task you repeat every week.",
      "Find an existing skill for it, or write a folder with a SKILL.md that has a clear name and description.",
      "Install it: upload a ZIP in Customize > Skills (Claude app) or copy it to ~/.claude/skills/ (Claude Code).",
      "Ask Claude for that task and check the result on a small example.",
      "Improve the description if Claude does not pick the skill up, then share it with your team.",
    ],
    faqs: [
      {
        question: "Are Claude skills free?",
        answer:
          "Skills are available on the Free, Pro, Max, Team, and Enterprise plans. They need code execution to be enabled. Many community skills are open source; check each skill's license.",
      },
      {
        question: "What is the difference between Claude skills and MCP?",
        answer:
          "MCP gives Claude a connection to an outside tool or data source. A skill gives Claude instructions and files for a task. They work together: a skill can describe how and when to use an MCP tool.",
      },
      {
        question: "Do I need to code to use Claude skills?",
        answer:
          "No. You can enable Anthropic's skills with a toggle and upload a skill as a ZIP in the Claude app. Writing a skill is mostly writing clear instructions in Markdown; scripts are optional.",
      },
      {
        question: "What is the skill-creator skill?",
        answer:
          "skill-creator is an Anthropic skill that helps you write and test new skills. In Claude Code you can install it with /plugin install skill-creator@claude-plugins-official.",
      },
      {
        question: "Are Claude skills the same as agent skills?",
        answer:
          "Claude skills follow the open Agent Skills standard (agentskills.io). Claude Code adds some extra frontmatter fields, but a skill that uses the standard fields can also work in other agents that support the standard.",
      },
    ],
    sources: [
      { label: "Claude Help Center: What are skills?", href: "https://support.claude.com/en/articles/12512176-what-are-skills" },
      { label: "Claude Help Center: Use skills in Claude", href: "https://support.claude.com/en/articles/12512180-using-skills-in-claude" },
      { label: "Claude Code documentation: Extend Claude with skills", href: "https://code.claude.com/docs/en/skills" },
      { label: "anthropics/skills on GitHub", href: "https://github.com/anthropics/skills" },
      { label: "Agent Skills standard", href: "https://agentskills.io" },
    ],
  },
  {
    slug: "claude-code-plugins-vs-skills",
    title: "Claude Code Plugins vs Skills: Differences Explained",
    h1: "Claude Code plugins vs skills: which do you need?",
    description:
      "A Claude Code skill is one SKILL.md folder; a plugin bundles skills, subagents, hooks, and MCP servers you install from a marketplace with /plugin. See when to use each.",
    answer:
      "A skill is a single folder with a SKILL.md that teaches Claude one task. A plugin is a package that can bundle several skills plus subagents, hooks, and MCP servers, and is installed as one unit from a marketplace with /plugin. Use a standalone skill for your own workflow. Use a plugin to install a setup someone else built, or to give your setup to a team with versions and updates.",
    keywords: [
      "Claude Code plugins vs skills",
      "Claude Code plugins",
      "Claude Code plugin marketplace",
      "install Claude Code plugins",
      "Claude Code skills vs plugins",
      "best Claude Code plugins",
    ],
    publishedAt: "2026-09-25",
    updatedAt: "2026-09-25",
    sections: [
      {
        title: "What a skill is",
        body:
          "A skill is a folder containing SKILL.md, saved in ~/.claude/skills/ (all your projects), .claude/skills/ (one repository), or inside a plugin. Claude loads it when your request matches its description, or you run it with /skill-name. Custom slash commands have been merged into skills: a file in .claude/commands/ still works, but new work should use a skill folder.",
      },
      {
        title: "What a plugin is",
        body:
          "A plugin is a directory with a manifest at .claude-plugin/plugin.json and one or more components: skills, agents (subagents), hooks that run at points in Claude Code's lifecycle, and MCP servers. Claude Code installs and loads it as one unit. Plugin skills are namespaced, so a review skill in my-plugin runs as /my-plugin:review.",
      },
      {
        title: "What a plugin marketplace is",
        body:
          "A marketplace is a repository or folder with a .claude-plugin/marketplace.json file that lists plugins and where to fetch each one. It is a catalog, not a hosted store. Claude Code adds Anthropic's official marketplace (claude-plugins-official) the first time you start an interactive session; you add others with /plugin marketplace add owner/repo. Anthropic's official and community marketplace names are only accepted from github.com/anthropics repositories; every other marketplace is third-party. To share plugins with a team through repo settings, see [how to share Claude skills with your team](/guides/share-claude-skills-with-team).",
      },
      {
        title: "How to install a Claude Code plugin",
        body:
          "Run /plugin and install from the Discover tab, or run /plugin install plugin-name@marketplace-name. For example, /plugin marketplace add anthropics/skills and then /plugin install document-skills@anthropic-agent-skills installs Anthropic's document skills. Choose a scope: user (you, every project), project (everyone in the repository, via .claude/settings.json), or local (you, this repository only). Remove a plugin with /plugin uninstall.",
      },
      {
        title: "When to use which",
        body:
          "Write a standalone skill when the workflow is yours, small, or specific to one repository; commit it to .claude/skills/ to share it with the team. Use a plugin when you need several skills together, need a hook or MCP server alongside the skill, or want other people to install and update your setup with one command. Subagents are different again: they run a task in a separate context window and can be shipped inside a plugin.",
      },
      {
        title: "What an enabled plugin costs",
        body:
          "An enabled plugin is part of every session. The name and description of each skill, agent, and command it contains are in Claude's context on every turn, its MCP servers run alongside the session, and its hooks fire at their events. Whatever a plugin runs, it runs with your user permissions, so review a plugin before installing it and disable ones you no longer use.",
      },
    ],
    steps: [
      "Decide whether you need one task (a skill) or a bundle with hooks, subagents, or MCP servers (a plugin).",
      "For a skill, create .claude/skills/<name>/SKILL.md or copy an existing skill folder there.",
      "For a plugin, run /plugin and browse the Discover tab, or add a marketplace with /plugin marketplace add owner/repo.",
      "Install with /plugin install plugin-name@marketplace-name and pick user, project, or local scope.",
      "Test the skills with /plugin-name:skill-name or by asking for the task.",
      "Disable or uninstall plugins you do not use to keep context small.",
    ],
    faqs: [
      {
        question: "Is a Claude Code plugin just a folder of skills?",
        answer:
          "It can be, but a plugin can also include subagents, hooks, and MCP servers. A plugin can even contain a single SKILL.md at its root.",
      },
      {
        question: "Are Claude Code plugins safe?",
        answer:
          "A plugin can run code with your user permissions, whichever marketplace it comes from. Install plugins from sources you trust, read what they contain, and check the context cost that Anthropic's official marketplace shows before installing.",
      },
      {
        question: "Where are Claude Code plugins stored?",
        answer:
          "Your settings list the marketplaces you added and the plugins you enabled, and Claude Code keeps fetched plugin files under ~/.claude/plugins/.",
      },
      {
        question: "Are slash commands, skills, and plugins the same?",
        answer:
          "Custom slash commands are now skills: .claude/commands/deploy.md and .claude/skills/deploy/SKILL.md both create /deploy. A plugin is the package format that can distribute skills and other components.",
      },
      {
        question: "Do plugins work in the Claude app?",
        answer:
          "The same plugin format also installs on claude.ai and in Cowork, where a different set of components loads. Claude Code cloud sessions do not load plugins from your local settings.",
      },
    ],
    sources: [
      { label: "Claude Code documentation: Plugins overview", href: "https://code.claude.com/docs/en/plugins" },
      { label: "Claude Code documentation: Extend Claude with skills", href: "https://code.claude.com/docs/en/skills" },
      { label: "anthropics/claude-plugins-official on GitHub", href: "https://github.com/anthropics/claude-plugins-official" },
      { label: "anthropics/skills on GitHub", href: "https://github.com/anthropics/skills" },
    ],
  },
  {
    slug: "claude-skills-marketplaces",
    title: "Claude Skills Marketplaces Compared: Where to Get Skills",
    h1: "Where can you find Claude skills? Marketplaces compared",
    description:
      "Compare places to get Claude skills: the Claude app skills directory, Claude Code plugin marketplaces, GitHub, skills.sh, SkillsMP, and AIPM. Install method, updates, and trust.",
    answer:
      "There is no single Claude skills store. Claude app users enable Anthropic's skills and upload or install their own in Customize > Skills. Claude Code users install plugins from marketplaces with /plugin, starting with Anthropic's official one. Beyond Anthropic, skills live in GitHub repositories and are indexed by directories such as skills.sh (with the npx skills CLI), SkillsMP, and AIPM. Pick based on where you use Claude, how you want updates, and how much review you need.",
    keywords: [
      "Claude skills marketplace",
      "Claude Code skills marketplace",
      "Claude Code plugin marketplace",
      "agent skills marketplace",
      "skills marketplace",
      "SkillsMP",
      "skills.sh",
      "where to find Claude skills",
    ],
    publishedAt: "2026-09-25",
    updatedAt: "2026-09-25",
    comparison: {
      caption: "Where to get Claude skills (checked 25 September 2026; details come from each source's own docs or site)",
      columns: ["Source", "What it is", "How you install", "Versions and updates", "Review signals"],
      rows: [
        [
          "Claude app: Customize > Skills",
          "Anthropic's built-in skills, skills you upload, and on Team/Enterprise an organization library",
          "Toggle on, upload a ZIP, or install from your organization's directory",
          "Shared skills update for recipients; org-published updates go through the org's review",
          "Owner controls; optional skill scanning on Enterprise",
        ],
        [
          "Claude Code plugin marketplaces (e.g. claude-plugins-official, anthropics/skills)",
          "Catalogs (marketplace.json) of plugins that bundle skills, agents, hooks, and MCP servers",
          "/plugin marketplace add owner/repo, then /plugin install name@marketplace",
          "Plugins update from their marketplace",
          "Official vs third-party tiers by name; context cost shown for official plugins",
        ],
        [
          "GitHub repos and awesome lists",
          "Source repositories (e.g. anthropics/skills) and curated link lists",
          "Copy the folder with SKILL.md, or use npx skills add owner/repo",
          "Whatever the repository's commits and tags provide",
          "Read the source; stars and maintainers",
        ],
        [
          "skills.sh + npx skills (Vercel Labs)",
          "A skills directory with an install leaderboard, plus an open-source CLI",
          "npx skills add owner/repo (project, or -g global), for Claude Code and many other agents",
          "Tracks the Git source you install from",
          "Install counts; source repository",
        ],
        [
          "SkillsMP",
          "Describes itself as a community-driven marketplace that aggregates skills from GitHub, with search, categories, and a free API and MCP server",
          "From the linked source repository",
          "Follows the source repository",
          "Links to source; categories and search",
        ],
        [
          "AIPM (this site)",
          "A registry of named, versioned skill packages for Claude Code, Cursor, and Codex",
          "aipm add @scope/name@version --target claude (writes .claude/skills/<name>/)",
          "Pinned versions recorded in aipm.package.json; update when you choose",
          "Package page shows source, files, publisher, and a basic security scan",
        ],
      ],
    },
    sections: [
      {
        title: "If you use the Claude app (claude.ai, Claude Desktop, Cowork)",
        body:
          "Start in Customize > Skills. Anthropic's document skills (Excel, Word, PowerPoint, PDF) are built in once code execution is on. To add a skill from anywhere else, get the skill folder, ZIP it, and upload it. On Team and Enterprise plans, colleagues can share skills with you or publish them to your organization's library, which owners can review before publishing.",
      },
      {
        title: "If you use Claude Code",
        body:
          "Run /plugin to browse Anthropic's official marketplace, which Claude Code adds automatically in your first interactive session. Add other marketplaces with /plugin marketplace add owner/repo. For single skills, copy the folder into ~/.claude/skills/ or .claude/skills/, or use a CLI such as npx skills or aipm. Note that Claude Marketplace at claude.com/marketplace is a website for browsing plugins, connectors, and partners, not something you add with /plugin.",
      },
      {
        title: "Directories and aggregators",
        body:
          "Directories help with discovery across thousands of GitHub repositories. skills.sh ranks skills by installs made through its npx skills CLI. SkillsMP indexes skills from GitHub and offers category and occupation browsing. Awesome lists on GitHub are curated by their maintainers. In every case the skill itself still comes from a repository you should read before installing.",
      },
      {
        title: "Where AIPM fits, and its limits",
        body:
          "AIPM is for people who want a fixed, named version of a skill and the same install across Claude Code, Cursor, and Codex, recorded in the project so a team gets the same revision. Its catalog is much smaller than GitHub-wide directories, and it needs the AIPM CLI. If you only want to try a popular skill once, copying the folder or using npx skills is simpler.",
      },
      {
        title: "A quick trust checklist",
        body:
          "Before installing from any marketplace: read SKILL.md and every script, look for network calls or commands you do not expect, check who maintains the source repository and when it last changed, and prefer a pinned version for team use. Anthropic's own guidance is to install skills only from trusted sources.",
      },
    ],
    steps: [
      "Decide where you use Claude: the Claude app, Claude Code, or both.",
      "Claude app: check Customize > Skills first, then upload skills you trust as ZIPs.",
      "Claude Code: browse /plugin, then add other marketplaces you trust.",
      "Use directories (skills.sh, SkillsMP, awesome lists, AIPM) to discover skills, and open the source repository.",
      "Read the skill's files before installing it.",
      "For team use, pin a version and keep the installed files in Git.",
    ],
    faqs: [
      {
        question: "Is there an official Claude skills marketplace?",
        answer:
          "For Claude Code, Anthropic runs an official plugin marketplace (claude-plugins-official) that Claude Code adds automatically. In the Claude app, skills are managed in Customize > Skills, with organization libraries on Team and Enterprise. Claude Marketplace (claude.com/marketplace) is a website for browsing plugins, connectors, and partners.",
      },
      {
        question: "What is SkillsMP?",
        answer:
          "SkillsMP (skillsmp.com) describes itself as a community-driven marketplace that aggregates open-source agent skills from GitHub repositories and makes them searchable by category and occupation. It is not run by Anthropic.",
      },
      {
        question: "What is skills.sh?",
        answer:
          "skills.sh is a directory of agent skills with an install leaderboard. It pairs with the open-source npx skills CLI from Vercel Labs, which installs skills from Git repositories into Claude Code and many other agents.",
      },
      {
        question: "Are skills from marketplaces safe?",
        answer:
          "Not automatically. A skill can contain scripts and instructions that Claude follows. Read the files, prefer sources you trust, and pin versions for team use.",
      },
      {
        question: "How is AIPM different from skills.sh?",
        answer:
          "Both help you install skills from the command line. AIPM installs named, versioned packages and records them in the project; skills.sh installs from Git sources and ranks skills by installs. See the AIPM vs skills.sh guide for details.",
      },
    ],
    sources: [
      { label: "Claude Help Center: Use skills in Claude", href: "https://support.claude.com/en/articles/12512180-using-skills-in-claude" },
      { label: "Claude Code documentation: Plugins overview", href: "https://code.claude.com/docs/en/plugins" },
      { label: "anthropics/skills on GitHub", href: "https://github.com/anthropics/skills" },
      { label: "skills.sh", href: "https://skills.sh" },
      { label: "vercel-labs/skills (npx skills)", href: "https://github.com/vercel-labs/skills" },
      { label: "SkillsMP", href: "https://skillsmp.com" },
      { label: "AIPM vs skills.sh", href: "https://www.aipm-registry.com/guides/aipm-vs-skills-sh" },
    ],
  },
];
