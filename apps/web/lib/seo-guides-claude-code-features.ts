import type { SeoGuide } from "./seo-guides";

/**
 * Batch-1 guide: /guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks (SEO & AEO Desk brief, 2026-09-25).
 * Claude Code facts checked on 2026-09-25 against code.claude.com/docs/en/features-overview, /skills, /sub-agents,
 * /hooks, /mcp and /plugins-reference (latest release 2.1.282). Cursor: cursor.com/docs. Codex: learn.chatgpt.com/docs.
 */
export const CLAUDE_CODE_FEATURE_COMPARISON_GUIDES: SeoGuide[] = [
  {
    slug: "claude-code-skills-vs-mcp-vs-subagents-vs-hooks",
    title: "Claude Code Skills vs MCP vs Subagents vs Hooks",
    h1: "CLAUDE.md vs skills vs subagents vs hooks vs MCP vs plugins: which one should you use?",
    description:
      "When to use CLAUDE.md, skills, subagents, hooks, MCP or plugins in Claude Code, what each costs in context, and the Cursor and Codex equivalent of each one.",
    answer:
      "Use CLAUDE.md for short facts Claude needs every session, skills for procedures and reference loaded on demand, subagents for side tasks that need their own context, hooks for rules that must run every time, MCP to connect external tools and data, and plugins to package and share all of these across repos. Cursor and Codex have close equivalents for each.",
    answerTable: {
      caption: "One-glance decision table. Context column follows the Claude Code features overview (checked 25 September 2026).",
      columns: ["If you need…", "Use", "What loads into context", "Enforced?"],
      rows: [
        ["Facts and conventions in every session", "CLAUDE.md (or AGENTS.md)", "The full file, every request", "No, it is guidance"],
        ["A repeatable procedure or reference, sometimes", "Skill", "Name and description until used, then the full SKILL.md", "No"],
        ["A side task that would flood your conversation", "Subagent", "A separate context; only a summary comes back", "No"],
        ["Something that must happen every time", "Hook", "Nothing, unless the hook returns output", "Yes, it runs on every matching event"],
        ["External data or actions (database, Slack, browser)", "MCP server", "Tool names; full schemas load when a tool is needed", "Through permissions"],
        ["The same setup in another repo or for a team", "Plugin", "Whatever it bundles", "n/a"],
      ],
    },
    keywords: [
      "skills vs mcp vs subagents",
      "claude code skills vs subagents",
      "claude code hooks vs skills",
      "skills vs mcp vs plugins",
      "claude code plugins vs skills vs agents",
      "can claude code subagents use skills",
      "cursor skills vs subagents",
      "CLAUDE.md vs skills",
    ],
    publishedAt: "2026-09-25",
    updatedAt: "2026-09-25",
    lastChecked: "2026-09-25",
    sections: [
      {
        title: "The short version: one sentence per feature",
        body: "Each extension point solves a different problem. The examples below are the ones Anthropic's features overview uses.",
        bullets: [
          "CLAUDE.md: persistent context loaded every conversation, for example \"Use pnpm, not npm. Run tests before committing.\"",
          "Skill: instructions, knowledge and workflows Claude uses when relevant, for example a `/deploy` skill that runs your deployment checklist.",
          "Subagent: an isolated worker that returns a summary, for example a research task that reads many files but reports only the key findings.",
          "Hook: a script, HTTP request, MCP tool call, prompt or subagent that runs on a lifecycle event, for example ESLint after every file edit.",
          "MCP: a connection to an external service, for example querying your database or posting to Slack.",
          "Plugin: the packaging layer that bundles skills, hooks, subagents and MCP servers so you can reuse them across repos or share them through a marketplace.",
        ],
        paragraphs: [
          "Claude Code also has output styles, code intelligence and dynamic workflows; they are out of scope here. For every file these features use, see [AI agent configuration files explained](/guides/ai-agent-configuration-files).",
        ],
      },
      {
        title: "A decision flow: where should this instruction go?",
        body:
          "Ask these questions in order. They follow the trigger table in Anthropic's \"Build your setup over time\" section.",
        bullets: [
          "1. Must it happen every time, whatever the model decides? Use a hook or a permissions rule.",
          "2. Does Claude need it in every session? Put it in CLAUDE.md or AGENTS.md, and keep it short.",
          "3. Only sometimes, or is it a multi-step procedure you keep pasting? Make it a skill.",
          "4. Would doing it flood the main conversation with output you won't reference again? Route it through a subagent, optionally preloaded with skills.",
          "5. Does it need a system outside the repo, such as a browser tab Claude can't see? Connect an MCP server.",
          "6. Does a second repository or a teammate need the same setup? Package it as a plugin, or install shared skills from a registry (see the end of this guide).",
        ],
      },
      {
        title: "Context cost and precedence: why placement matters",
        body:
          "Every feature uses some of Claude's context, and when the same name is defined twice, each feature resolves it differently.",
        table: {
          caption: "Context cost and duplicate-name rules (Claude Code features overview, skills and MCP docs).",
          columns: ["Feature", "Context cost", "Same thing defined twice"],
          rows: [
            ["CLAUDE.md", "Full content every request. The docs suggest under 200 lines per file.", "Additive: every level contributes."],
            ["Skills", "Descriptions every request, full content when used. After auto-compaction, invoked skills are re-attached with the first 5,000 tokens of each, within 25,000 tokens combined.", "One wins by name: managed over user over project. Plugin skills are namespaced as `/plugin-name:skill-name`."],
            ["Subagents", "Separate window; only the summary returns to your conversation.", "One wins by name: managed, CLI flag, project, user, plugin."],
            ["MCP servers", "Tool names at start; full schemas deferred (tool search is on by default).", "Local over project over user; the whole entry from the winning scope is used."],
            ["Hooks", "Zero, unless the hook returns output.", "Merge: every registered hook fires for its event."],
          ],
        },
      },
      {
        title: "CLAUDE.md vs skills",
        body:
          "CLAUDE.md is for facts Claude should always know; a skill is for a procedure or reference it needs only sometimes. A 30-line deployment procedure in CLAUDE.md costs context on every request, while the same text as a skill costs only its description until you run it. Path-scoped rules in `.claude/rules/` sit in between: they load when Claude works with matching files. The same split applies to AGENTS.md, which Claude Code now reads on its own only when no CLAUDE.md is present ([does Claude Code read AGENTS.md?](/guides/does-claude-code-read-agents-md)); see [AGENTS.md vs SKILL.md](/guides/agents-md-vs-skill-md) and [AGENTS.md vs CLAUDE.md vs Cursor rules](/guides/agents-md-vs-claude-md-vs-cursor-rules). Custom commands in `.claude/commands/` still work, but [commands are now skills](/guides/claude-code-skills-vs-slash-commands).",
      },
      {
        title: "Skills vs subagents: when to use each, and how they combine",
        body:
          "Use a skill when you want to watch and steer each step in your main conversation. Use a subagent for deep searches, log analysis or dependency audits whose intermediate output you won't need again, and for parallel work.",
        table: {
          caption: "Skills vs subagents in Claude Code.",
          columns: ["", "Skill", "Subagent"],
          rows: [
            ["Where it runs", "In your main conversation", "In its own context window"],
            ["What you see", "Every step", "A summary of the result"],
            ["Best for", "Reference material and workflows you steer", "Tasks that read many files, parallel work, specialised workers"],
            ["Defined in", "`.claude/skills/<name>/SKILL.md`", "`.claude/agents/<name>.md` (or `~/.claude/agents/`)"],
          ],
        },
        paragraphs: [
          "They combine in two ways. First, a subagent's `skills:` frontmatter preloads the full content of the listed skills at startup; without it, the subagent can still invoke project, user and plugin skills through the Skill tool. Skills with `disable-model-invocation: true` can't be preloaded. Second, a skill with `context: fork` and an `agent:` field runs itself in a new subagent of that type. Despite the name, that subagent does not see your conversation history, so the skill must stand on its own. Every field involved (`context`, `agent`, `disable-model-invocation` and the rest) is in the [SKILL.md frontmatter reference](/guides/skill-md-frontmatter-reference).",
          "Cursor keeps subagents in `.cursor/agents/` (and also reads `.claude/agents/` and `.codex/agents/`). Codex custom agents are TOML files in `.codex/agents/` or `~/.codex/agents/`. Both tools also support skills.",
        ],
        code: [
          {
            label: "`.claude/agents/api-developer.md`: a subagent that preloads two skills (pattern from the Claude Code docs)",
            code: `---
name: api-developer
description: Implement API endpoints following team conventions
skills:
  - api-conventions
  - error-handling-patterns
---

Implement API endpoints. Follow the conventions and patterns from the preloaded skills.`,
          },
        ],
      },
      {
        title: "Skills vs hooks",
        body:
          "A hook is deterministic: Claude Code runs it on every matching event. An instruction in a skill or CLAUDE.md is guidance the model may not follow. So \"never read or edit .env files\" belongs in a PreToolUse hook or a permissions deny rule, not in a skill. A PreToolUse hook that exits with code 2 blocks the tool call and shows its stderr to Claude.",
        paragraphs: [
          "Hooks live in `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed settings, a plugin's `hooks/hooks.json`, or skill and subagent frontmatter. A skill's `hooks` field registers hooks when the skill is invoked. Hooks from every level merge, and `disableAllHooks` can't turn off managed hooks.",
        ],
        code: [
          {
            label: "`.claude/settings.json`",
            code: `{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Edit|Write",
        "hooks": [
          { "type": "command", "command": "\${CLAUDE_PROJECT_DIR}/.claude/hooks/block-env.sh" }
        ]
      }
    ]
  }
}`,
          },
          {
            label: "`.claude/hooks/block-env.sh` (make it executable with `chmod +x`; needs `jq`)",
            code: `#!/bin/sh
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  *.env|*/.env.*) echo "Blocked: $file is a secrets file" >&2; exit 2 ;;
esac
exit 0`,
          },
        ],
      },
      {
        title: "Skills vs MCP",
        body:
          "MCP gives Claude capabilities: tools and data from other systems. A skill gives it know-how, including how to use those tools well. A common pattern is an MCP server for your database plus a skill that documents your schema and query patterns. Project-scoped servers live in `.mcp.json` at the repo root (commit it; each teammate approves it on first run), while local and user servers live in `~/.claude.json`. For the full comparison, read [Agent Skills vs MCP](/guides/agent-skills-vs-mcp); for config files, the [mcp.json guide](/guides/mcp-json-guide-cursor-claude) and the [MCP config checklist](/guides/mcp-server-config-best-practices).",
      },
      {
        title: "Where plugins fit (the packaging layer)",
        body:
          "A plugin bundles skills, subagents, hooks and MCP servers (plus LSP servers and monitors) into one installable unit, and its skills are namespaced as `/plugin-name:skill-name`. A `CLAUDE.md` at the plugin root is not loaded as context, and `claude plugin validate` warns about it; ship instructions as a skill instead. Plugins are distributed through marketplaces. See [Claude Code plugins vs skills](/guides/claude-code-plugins-vs-skills) and [Claude skills marketplaces compared](/guides/claude-skills-marketplaces).",
      },
      {
        title: "Common mistakes",
        body: "These are the placement errors that cost the most context or reliability:",
        bullets: [
          "A multi-step procedure pasted into CLAUDE.md, where it loads on every request. Make it a skill.",
          "A safety rule written as an instruction. If it must always hold, use a hook or a deny rule.",
          "A subagent for work you need to steer step by step. Use a skill in the main conversation.",
          "An MCP server added where an existing CLI plus a skill that explains it would do the job.",
          "Copying `.claude/` folders between repos by hand. Package the shared parts as a plugin, or install versioned skills.",
          "Assuming `allowed-tools` in a skill restricts tools. It pre-approves the listed tools for the turn that invokes the skill; use `disallowed-tools` or permissions to remove tools.",
        ],
      },
      {
        title: "Share skills across repos",
        body:
          "AIPM installs skills today; MCP and hooks packaging is on the roadmap. When a skill needs to reach more repos, install it as a versioned package instead of copying folders. `--target claude` writes `.claude/skills/<name>/SKILL.md` and `--target codex` writes `.agents/skills/<name>/SKILL.md`; Cursor reads both folders. For every team option (a committed folder, a plugin marketplace, the Claude app, managed settings, a registry), see [how to share Claude skills with your team](/guides/share-claude-skills-with-team). [Browse Claude skills](/skills/claude) or see the [CLI commands](/commands).",
        code: [
          {
            code: `npm install -g @aipm-registry/cli
aipm add @scope/name@1.0.0 --target claude   # or --target codex
aipm list                                     # what is installed (reads aipm-lock.json)`,
          },
        ],
      },
    ],
    comparison: {
      caption: "Cursor and Codex equivalents, with paths from each vendor's docs (checked 25 September 2026). More detail: [Cursor rules vs skills](/guides/cursor-rules-vs-agent-skills), [Claude Code skills vs Codex skills](/guides/claude-code-skills-vs-codex-skills), [AI agent file support](/compatibility).",
      columns: ["Feature", "Claude Code", "Cursor", "Codex"],
      rows: [
        ["Always-on instructions", "`CLAUDE.md`, or `AGENTS.md` when there is no CLAUDE.md", "`.cursor/rules/*.mdc` or `AGENTS.md` ([compare](/guides/cursor-rules-vs-agents-md))", "`AGENTS.md` (plus `~/.codex/AGENTS.md`)"],
        ["Skills", "`.claude/skills/<name>/SKILL.md`, `~/.claude/skills/`", "`.cursor/skills/`, `.agents/skills/` (also reads `.claude/skills/` and `.codex/skills/`)", "`.agents/skills/` in the repo, `$HOME/.agents/skills`, `/etc/codex/skills`"],
        ["Subagents", "`.claude/agents/<name>.md`, `~/.claude/agents/`", "`.cursor/agents/` (also reads `.claude/agents/` and `.codex/agents/`)", "`.codex/agents/*.toml`, `~/.codex/agents/`"],
        ["Hooks", "`hooks` in `settings.json` (user, project, local, managed)", "`.cursor/hooks.json`, `~/.cursor/hooks.json`", "`hooks.json` or `[hooks]` in `config.toml`, in `~/.codex/` or `<repo>/.codex/`"],
        ["MCP", "`.mcp.json` (project), `~/.claude.json` (local and user)", "`.cursor/mcp.json`, `~/.cursor/mcp.json`", "`[mcp_servers]` in `~/.codex/config.toml` or `.codex/config.toml`"],
        ["Plugins", "Skills, subagents, hooks, MCP and LSP servers, monitors", "Rules, skills, agents, commands, MCP servers and hooks", "Skills and MCP servers; Codex plugins can also bundle hooks"],
      ],
    },
    steps: [
      "List what you keep repeating to Claude.",
      "Put always-true facts in `CLAUDE.md` or `AGENTS.md` and keep them short.",
      "Turn procedures you paste more than twice into skills.",
      "Move must-always rules into hooks or permission rules.",
      "Use subagents for noisy side tasks and MCP for outside systems.",
      "Package what other repos need as a plugin or as versioned skills.",
    ],
    faqs: [
      {
        question: "What is the difference between skills and subagents in Claude Code?",
        answer:
          "Skills are reusable instructions that run in your main conversation. Subagents are isolated workers with their own context that return only a summary.",
      },
      {
        question: "Can Claude Code subagents use skills?",
        answer:
          "Yes. List skills in the subagent's skills: field to preload them, or let the subagent invoke them through the Skill tool. A skill can also run itself in a subagent with context: fork.",
      },
      {
        question: "Should a rule go in CLAUDE.md or a hook?",
        answer: "If it must always happen, use a hook or a permissions rule. CLAUDE.md is guidance that the model may not follow every time.",
      },
      {
        question: "Skills vs MCP: do I need both?",
        answer:
          "Often, yes. MCP adds tools and data; skills add procedures. Many setups pair an MCP server with a skill that tells Claude how to use it.",
      },
      {
        question: "What is a Claude Code plugin for?",
        answer: "Packaging and sharing skills, subagents, hooks and MCP servers across repos, usually through a plugin marketplace.",
      },
      {
        question: "What is the Cursor equivalent of CLAUDE.md?",
        answer: "Project rules in .cursor/rules (as .mdc files) or an AGENTS.md file, which Cursor reads in the root and in subfolders.",
      },
      {
        question: "Does Codex have hooks and subagents?",
        answer:
          "Yes. Codex reads hooks from hooks.json or [hooks] tables in config.toml, and custom agents from TOML files in .codex/agents/ or ~/.codex/agents/.",
      },
    ],
    sources: [
      { label: "Claude Code docs: Extend Claude Code (features overview)", href: "https://code.claude.com/docs/en/features-overview" },
      { label: "Claude Code docs: Skills", href: "https://code.claude.com/docs/en/skills" },
      { label: "Claude Code docs: Subagents", href: "https://code.claude.com/docs/en/sub-agents" },
      { label: "Claude Code docs: Hooks", href: "https://code.claude.com/docs/en/hooks" },
      { label: "Claude Code docs: MCP", href: "https://code.claude.com/docs/en/mcp" },
      { label: "Claude Code docs: Plugins reference", href: "https://code.claude.com/docs/en/plugins-reference" },
      { label: "Cursor docs: Agent Skills", href: "https://cursor.com/docs/skills" },
      { label: "Cursor docs: Subagents", href: "https://cursor.com/docs/subagents" },
      { label: "Cursor docs: Hooks", href: "https://cursor.com/docs/hooks" },
      { label: "Cursor docs: MCP", href: "https://cursor.com/docs/mcp" },
      { label: "Cursor docs: Plugins", href: "https://cursor.com/docs/plugins" },
      { label: "OpenAI Codex docs: Build skills", href: "https://learn.chatgpt.com/docs/build-skills" },
      { label: "OpenAI Codex docs: Subagents", href: "https://learn.chatgpt.com/docs/agent-configuration/subagents" },
      { label: "OpenAI Codex docs: Hooks", href: "https://learn.chatgpt.com/docs/hooks" },
      { label: "OpenAI Codex docs: MCP", href: "https://learn.chatgpt.com/docs/extend/mcp" },
      { label: "OpenAI Codex docs: Plugins", href: "https://learn.chatgpt.com/docs/plugins" },
    ],
  },
];
