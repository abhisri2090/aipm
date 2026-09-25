import type { SeoGuide } from "./seo-guides";

/**
 * Batch-1 guide: /guides/where-are-claude-skills-stored (SEO & AEO Desk brief, 2026-09-25).
 * Claude facts checked on 2026-09-25 against code.claude.com/docs/en/skills, /plugins/loading, /claude-directory,
 * /managed-settings, /agent-sdk/skills, the changelog (latest release 2.1.282) and Claude Help Center article 12512180.
 * Cursor: cursor.com/docs/skills. Codex: learn.chatgpt.com/docs/build-skills.
 */
export const CLAUDE_SKILLS_LOCATION_GUIDES: SeoGuide[] = [
  {
    slug: "where-are-claude-skills-stored",
    title: "Where Are Claude Skills Stored? Folder Paths (2026)",
    h1: "Where are Claude skills stored?",
    description:
      "Claude Code keeps skills in ~/.claude/skills (personal) and .claude/skills (project). See plugin, enterprise, synced and Claude app locations, plus Windows paths.",
    answer:
      "Claude Code loads personal skills from `~/.claude/skills/<name>/SKILL.md` (every project on your machine) and project skills from `.claude/skills/<name>/SKILL.md` (commit it to share). Plugin skills live in the plugin's `skills/` folder, with installed copies under `~/.claude/plugins/cache/`. Skills you add in the Claude app live in your claude.ai account, and Claude Code v2.1.273 or later downloads them to `~/.claude/skills/synced/` when you sign in with that account. On Windows, `~` is `%USERPROFILE%`, so personal skills are in `%USERPROFILE%\\.claude\\skills\\`.",
    keywords: [
      "where are claude skills stored",
      "claude skills folder",
      "claude code skills directory",
      "claude skills directory windows",
      "where to install claude skills",
      "where are claude code plugins installed",
      "claude skill location",
      "claude code commands folder",
    ],
    publishedAt: "2026-09-25",
    updatedAt: "2026-09-25",
    lastChecked: "2026-09-25",
    sections: [
      {
        title: "All Claude skill locations at a glance",
        body:
          "Where you save a skill decides which sessions load it. Claude rows come first; Cursor and Codex are at the bottom because they read some of the same folders. To add a skill in any of these places, see [how to install Claude skills](/guides/how-to-install-claude-code-skills).",
        table: {
          caption: "Every documented skills location (Claude Code, Cursor and Codex docs, checked 25 September 2026; latest Claude Code release 2.1.282).",
          columns: ["Location", "Path", "Loads in", "Notes"],
          rows: [
            ["Personal (Claude Code)", "`~/.claude/skills/<name>/SKILL.md`", "All your projects on this machine; not Cowork or cloud sessions", "Remove by deleting the folder"],
            ["Project (Claude Code)", "`.claude/skills/<name>/SKILL.md` in the repo", "Sessions in that repo, from the start folder and every parent up to the repo root", "Commit it to share with the team"],
            ["Nested (monorepo)", "`<subdir>/.claude/skills/<name>/SKILL.md`", "Once Claude reads or edits a file in `<subdir>`, or earlier with `/add-dir` (v2.1.257+)", "Same-name skills both load, e.g. `/apps/web:deploy`"],
            ["Additional directory", "`.claude/skills/` in a folder passed with `--add-dir`", "That session", "`permissions.additionalDirectories` grants file access only and loads no skills"],
            ["Plugin", "`<plugin>/skills/<name>/SKILL.md`; installed copies in `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`", "Wherever the plugin is enabled, as `/plugin-name:skill-name`", "Remove with `/plugin uninstall <plugin>@<marketplace>`"],
            ["Enterprise (managed)", "`.claude/skills/<name>/SKILL.md` inside the managed settings directory, e.g. `/etc/claude-code/.claude/skills/` on Linux", "All users on machines where it's deployed", "Admin-controlled"],
            ["claude.ai account (synced)", "Stored in your Claude account; downloaded to `~/.claude/skills/synced/`", "Cowork, cloud sessions, and terminal sessions signed in with that account", "Edits to the synced folder aren't uploaded and can be overwritten"],
            ["Legacy commands", "`.claude/commands/<name>.md` or `~/.claude/commands/<name>.md`", "Same as skills", "Still works; a skill with the same name wins"],
            ["Cursor (project)", "`.cursor/skills/` or `.agents/skills/`; also reads `.claude/skills/` and `.codex/skills/`", "That project; nested folders are scoped to their directory", "Each skill is a folder with `SKILL.md`, and `name` must match the folder"],
            ["Cursor (user)", "`~/.cursor/skills/` or `~/.agents/skills/`; also `~/.claude/skills/` and `~/.codex/skills/`", "All your projects on this machine", "Only `~/.cursor/skills/` can sync to Cloud Agents"],
            ["Codex (repo)", "`.agents/skills/<name>/SKILL.md` in the working folder and every parent up to the repo root", "That repo", "Symlinked folders are followed; same-name skills both appear"],
            ["Codex (user, admin, system)", "`$HOME/.agents/skills`, `/etc/codex/skills`, bundled with Codex", "All repos for that user; all users on the machine; everyone", "Disable one with `[[skills.config]]` and `enabled = false` in `~/.codex/config.toml`"],
          ],
        },
        paragraphs: [
          "Because Cursor also reads `.claude/skills/`, and Cursor and Codex both read `.agents/skills/`, one committed folder can serve more than one tool. Claude Code does not read `.agents/skills/`, and the Codex docs don't list `.codex/skills/`. Subagents, hooks and MCP servers live in other files; see [skills vs MCP vs subagents vs hooks](/guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks) for when to use each.",
        ],
      },
      {
        title: "Personal skills: ~/.claude/skills",
        body:
          "Skills in `~/.claude/skills/<name>/` are available in every project on this machine. On Windows the folder is `%USERPROFILE%\\.claude\\skills\\`. If you set `CLAUDE_CONFIG_DIR`, every `~/.claude` path moves under that folder instead. Cowork sessions, cloud sessions and routines don't read this folder; a routine that invokes a skill that exists only here reports that the skill was not found.",
      },
      {
        title: "Project skills: .claude/skills",
        body:
          "Claude Code loads `.claude/skills/` from the folder where you start it and every parent up to the repository root, so starting in `packages/frontend/` still picks up root skills. In a linked git worktree it searches only up to the worktree root, and on v2.1.277 or later it falls back to the main checkout's project skills when the worktree has no `.claude/skills` of its own. Moving the session with `/cd` (v2.1.246+) adds the new folder's skills.",
        paragraphs: [
          "Nested `.claude/skills/` folders below the start folder load the first time Claude reads or edits a file there, and stay for the rest of the session. Run `/add-dir` with the subfolder's path (v2.1.257+) to load them sooner. Folders added with `--add-dir` or `/add-dir` load their `.claude/skills/` (plus `.claude/commands/` and `.claude/agents/`).",
        ],
      },
      {
        title: "Enterprise (managed) skills",
        body:
          "Administrators deploy skills to `.claude/skills/` inside the managed settings directory. The Claude Code docs give the Linux example `/etc/claude-code/.claude/skills/<skill-name>/`. The managed settings directories themselves are `/Library/Application Support/ClaudeCode/` on macOS, `/etc/claude-code/` on Linux and WSL, and `C:\\Program Files\\ClaudeCode\\` on Windows; the docs show the `.claude/skills` sub-path only for Linux.",
      },
      {
        title: "What a skill folder looks like",
        body:
          "A skill is a folder that contains `SKILL.md` and, optionally, `scripts/`, `references/` and `assets/`. The folder can be a symlink to a folder elsewhere; Claude Code reads `SKILL.md` from the target and loads it once even if several locations point at it. Don't name a skill folder `synced`: Claude Code reserves `~/.claude/skills/synced/` for claude.ai skills and skips an authored skill with that name. For the frontmatter fields, see the [SKILL.md frontmatter reference](/guides/skill-md-frontmatter-reference); for a walkthrough, see [how to create an Agent Skill](/guides/how-to-create-agent-skill).",
        code: [
          {
            code: `~/.claude/skills/
└── summarize-changes/
    ├── SKILL.md          # required: frontmatter + instructions
    ├── scripts/          # optional
    ├── references/       # optional
    └── assets/           # optional`,
          },
        ],
      },
      {
        title: "Where plugin skills are installed",
        body:
          "Claude Code keeps plugin files under one plugins root, `~/.claude/plugins` unless you set `CLAUDE_CODE_PLUGIN_CACHE_DIR`. Marketplace plugins are copied into the cache at install; plugins loaded with `--plugin-dir`, from a local-directory marketplace by relative path, or from a skill folder with `.claude-plugin/plugin.json` (loaded as `<name>@skills-dir`) load in place. See [Claude Code plugins vs skills](/guides/claude-code-plugins-vs-skills) and [Claude skills marketplaces compared](/guides/claude-skills-marketplaces).",
        table: {
          caption: "Inside ~/.claude/plugins (Claude Code plugin docs).",
          columns: ["Path", "What it holds"],
          rows: [
            ["`cache/<marketplace>/<plugin>/<version>/`", "One folder per installed version of a marketplace plugin, including its `skills/`. The path changes with every version."],
            ["`data/<plugin-id>/`", "The plugin's persistent data folder (`${CLAUDE_PLUGIN_DATA}`)"],
            ["`marketplaces/<name>/`", "Clones or downloads of marketplaces added from GitHub, another Git host or a URL"],
            ["`synced/`", "Plugins synced from your claude.ai account"],
            ["`.trash/`", "Plugins the claude.ai sync removed"],
            ["`installed_plugins.json`, `known_marketplaces.json`", "Records of installed plugins and fetched marketplaces"],
          ],
        },
      },
      {
        title: "Skills in the Claude app, Cowork and claude.ai",
        body:
          "Skills you add in the Claude app (claude.ai or Claude Desktop) are stored in your Claude account, not in a folder you manage: you upload a ZIP of the skill folder in Customize, then Skills. Skills need code execution and are available on Free, Pro, Max, Team and Enterprise plans. Anthropic doesn't document a local folder for chat skills.",
        bullets: [
          "Cowork loads the skills enabled for your claude.ai account, synced at session start, and doesn't read `~/.claude/skills/`.",
          "Cloud sessions and routines load your account's skills plus the repository's committed `.claude/skills/`. Plugins declared in the repo's `.claude/settings.json` or enabled only in your user settings don't load there.",
          "In the terminal, Claude Code v2.1.273 or later downloads your account's skills to `~/.claude/skills/synced/` at session start and checks for changes about every 10 minutes. `/skills` lists them under claude.ai sync.",
          "The sync is one-way: editing a file under `~/.claude/skills/synced/` doesn't change the skill on claude.ai, and a later sync can overwrite it.",
          "No sync happens with API-key or token-variable sign-ins, on Amazon Bedrock, with `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, in bare mode or `--safe-mode`, or when managed settings lock skills to plugins. Set `syncClaudeAiSkills` to `false` in user settings to stop it.",
          "The Agent SDK loads skills from `~/.claude/skills/` and `.claude/skills/` through its user and project setting sources.",
        ],
      },
      {
        title: "Which location wins when two skills have the same name?",
        body: "Where each skill came from decides which one `/name` runs:",
        bullets: [
          "Enterprise beats personal, and personal beats project.",
          "A skill beats a `.claude/commands/` file with the same name.",
          "Your skill replaces a bundled command with that name, but not the bundled command's aliases.",
          "Plugin skills are namespaced as `/plugin-name:skill-name`, so both load.",
          "A root skill and a nested skill with the same name both load.",
          "A skill synced from claude.ai yields to any other skill or command with that name and still runs as `/anthropic-skills:<name>`. Since v2.1.282, skill folders in the `anthropic-skills` or `claude-ai` namespace no longer load.",
        ],
      },
      {
        title: "Where should you put a skill?",
        body: "Pick the location by who needs the skill:",
        bullets: [
          "Just for you, in every project: `~/.claude/skills/`.",
          "For everyone who works in this repo: `.claude/skills/`, committed.",
          "In Cowork, the Claude app or cloud sessions: enable it on your claude.ai account.",
          "Across several repos or for a team: a plugin marketplace, or a versioned package from a registry ([compare the team options](/guides/share-claude-skills-with-team)).",
          "For the whole organization: managed settings, or skills provisioned by an owner of your Claude organization.",
        ],
        paragraphs: [
          "AIPM installs versioned skills from the registry into the folder each tool reads and records them, so you can list, update or remove them later. `--target claude` writes `.claude/skills/<name>/SKILL.md`, `--target codex` writes `.agents/skills/<name>/SKILL.md`, and `-g` installs under your home folder instead of the project. Using Cursor? Install with `--target claude` or `--target codex`; Cursor reads both folders. [Browse Claude skills](/skills/claude) or see [all commands](/commands).",
        ],
        code: [
          {
            code: `npm install -g @aipm-registry/cli
aipm add @scope/name@1.0.0 --target claude   # -> .claude/skills/name/SKILL.md
aipm add @scope/name@1.0.0 --target codex    # -> .agents/skills/name/SKILL.md
aipm list
aipm remove @scope/name`,
          },
        ],
      },
      {
        title: "How to find and check your skills",
        body:
          "Run `/skills` in Claude Code to see every loaded skill grouped by source. From a shell, list the folders directly. To find SKILL.md files whose frontmatter doesn't parse, run `claude plugin validate` on the skills folder (it checks a bare `.claude/skills` folder from v2.1.233).",
        code: [
          {
            code: `ls ~/.claude/skills/*/SKILL.md
ls .claude/skills/*/SKILL.md
claude plugin validate .claude/skills
claude plugin validate ~/.claude/skills`,
          },
        ],
        paragraphs: [
          "Edits to an existing SKILL.md are picked up during the session. A top-level skills folder that didn't exist when the session started needs a restart. If personal skills disappeared, look in `~/.claude/skills/.trash/`; trash entries are deleted 30 days after they were moved by default. Before v2.1.280, a `manifest.json` in `~/.claude/skills/` could move the skills it listed into the trash.",
        ],
      },
      {
        title: "How to move or remove a skill",
        body: "How you remove a skill depends on where it came from:",
        bullets: [
          "Personal or project: delete `~/.claude/skills/<name>/` or `.claude/skills/<name>/`.",
          "Plugin: disable or uninstall the plugin with `/plugin uninstall <plugin>@<marketplace>`.",
          "Synced from claude.ai: turn it off on claude.ai; deleting the folder by hand just makes the next sync download it again.",
          "Enterprise: an administrator deletes it from the managed settings directory.",
          "Bundled: set `disableBundledSkills` to `true`, or set one skill to `off` in `skillOverrides`.",
          "Installed with AIPM: `aipm remove @scope/name` deletes the files it tracked.",
        ],
      },
      {
        title: "Cursor and Codex skill folders",
        body:
          "Cursor loads project skills from `.cursor/skills/` and `.agents/skills/`, and user skills from `~/.cursor/skills/` and `~/.agents/skills/`. For compatibility it also reads `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/` and `~/.codex/skills/`, so Claude Code project skills already work in Cursor. It walks the skills root recursively, scopes nested folders to their directory, and expects `name` to match the folder. See [how to install Cursor skills](/guides/how-to-install-cursor-skills).",
        paragraphs: [
          "Codex scans `.agents/skills` from your working folder up to the repository root, then `$HOME/.agents/skills`, `/etc/codex/skills` and its bundled skills. It doesn't read `.claude/skills/`. See [Claude Code skills vs Codex skills](/guides/claude-code-skills-vs-codex-skills).",
        ],
      },
    ],
    steps: [
      "Decide who needs the skill: just you, this repo, a team, or your claude.ai account.",
      "Copy the folder that contains `SKILL.md` into `~/.claude/skills/` or `.claude/skills/`.",
      "Run `/skills` in Claude Code and check the skill is listed.",
      "Commit `.claude/skills/` if the whole team should get it.",
      "For Cowork or the Claude app, upload the skill in Customize, then Skills.",
    ],
    faqs: [
      {
        question: "Where are Claude Code skills stored?",
        answer: "Personal skills are in ~/.claude/skills/<name>/SKILL.md and project skills are in .claude/skills/<name>/SKILL.md inside the repository.",
      },
      {
        question: "Where is the Claude skills folder on Windows?",
        answer: "In %USERPROFILE%\\.claude\\skills\\, because Claude Code resolves ~/.claude to the .claude folder in your user profile.",
      },
      {
        question: "Where are skills from the Claude app stored?",
        answer:
          "In your claude.ai account. Claude Code v2.1.273 or later, signed in with that account, downloads them to ~/.claude/skills/synced/.",
      },
      {
        question: "Where are Claude Code plugins installed?",
        answer: "Under ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/, unless you set CLAUDE_CODE_PLUGIN_CACHE_DIR.",
      },
      {
        question: "Do Cowork and cloud sessions use my ~/.claude/skills?",
        answer:
          "No. Enable the skill on your claude.ai account, or, for cloud sessions, commit it to the repository's .claude/skills/.",
      },
      {
        question: "Which skill wins if two have the same name?",
        answer: "Enterprise beats personal, and personal beats project. Plugin skills are namespaced, so they load alongside the others.",
      },
      {
        question: "My personal skills disappeared. Where did they go?",
        answer: "Check ~/.claude/skills/.trash/. Trash entries are kept for 30 days by default before the cleanup deletes them.",
      },
      {
        question: "Can Cursor or Codex use my Claude skills folder?",
        answer:
          "Cursor also reads .claude/skills/ and ~/.claude/skills/. Codex reads .agents/skills/, not .claude/skills/.",
      },
    ],
    sources: [
      { label: "Claude Code docs: Skills (where skills live)", href: "https://code.claude.com/docs/en/skills#where-skills-live" },
      { label: "Claude Code docs: Plugins on disk", href: "https://code.claude.com/docs/en/plugins/loading#find-plugins-on-disk" },
      { label: "Claude Code docs: The .claude directory", href: "https://code.claude.com/docs/en/claude-directory" },
      { label: "Claude Code docs: Managed settings", href: "https://code.claude.com/docs/en/managed-settings" },
      { label: "Claude Code docs: Agent SDK skills", href: "https://code.claude.com/docs/en/agent-sdk/skills" },
      { label: "Claude Code changelog", href: "https://code.claude.com/docs/en/changelog" },
      { label: "Claude Help Center: Use skills in Claude", href: "https://support.claude.com/en/articles/12512180-use-skills-in-claude" },
      { label: "Cursor docs: Agent Skills", href: "https://cursor.com/docs/skills" },
      { label: "OpenAI Codex docs: Build skills", href: "https://learn.chatgpt.com/docs/build-skills" },
      { label: "Agent Skills specification", href: "https://agentskills.io/specification" },
    ],
  },
];
