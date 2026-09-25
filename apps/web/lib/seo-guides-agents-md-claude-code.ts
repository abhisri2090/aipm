import type { SeoGuide } from "./seo-guides";

/**
 * Batch-1 guide: /guides/does-claude-code-read-agents-md (SEO & AEO Desk brief, 2026-09-25).
 * Every Claude Code fact below was checked on 2026-09-25 against code.claude.com/docs/en/memory and the
 * Claude Code changelog (latest release 2.1.282). Codex facts: learn.chatgpt.com. Cursor facts: cursor.com/docs/rules.
 */
export const AGENTS_MD_CLAUDE_CODE_GUIDES: SeoGuide[] = [
  {
    slug: "does-claude-code-read-agents-md",
    title: "Does Claude Code Read AGENTS.md? Rules, Setup & Fixes",
    h1: "Does Claude Code read AGENTS.md?",
    description:
      "Yes, since v2.1.277. Claude Code reads AGENTS.md only when no CLAUDE.md exists. See how to load both, check it loaded, and fix AGENTS.md not loading.",
    answer:
      "Yes. Since v2.1.277 (September 18, 2026), Claude Code reads `AGENTS.md` on its own, but only when no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in your working directory or any folder above it. If one does, Claude reads your CLAUDE.md files only. To load both, set Project instructions to `claude-md-and-agents-md` in `/config`, or start your CLAUDE.md with `@AGENTS.md`. Since v2.1.281 this also works on Amazon Bedrock, Google Vertex AI, Microsoft Foundry and LLM gateways.",
    answerTable: {
      caption: "What Claude Code reads by default. Source: Claude Code memory docs, checked 25 September 2026 (latest release 2.1.282).",
      columns: ["Your repository has", "Claude Code reads"],
      rows: [
        ["An `AGENTS.md`, and no `CLAUDE.md` or `CLAUDE.local.md` in your working directory or above it", "Your `AGENTS.md`"],
        ["An `AGENTS.md` and a `CLAUDE.md` or `CLAUDE.local.md` in your working directory or above it", "Your CLAUDE.md files only"],
        ["A `CLAUDE.md` that imports `@AGENTS.md`", "Your CLAUDE.md, with AGENTS.md included through the import"],
      ],
    },
    keywords: [
      "does claude code read agents.md",
      "claude code agents.md",
      "claude code agents.md support",
      "agents.md vs claude.md",
      "claude code agents.md not loading",
      "agents.md symlink claude.md",
      "claude-md-and-agents-md",
    ],
    publishedAt: "2026-09-25",
    updatedAt: "2026-09-25",
    lastChecked: "2026-09-25",
    sections: [
      {
        title: "What changed in v2.1.277 and v2.1.281",
        body:
          "Before September 2026, Claude Code read only CLAUDE.md files (see [AGENTS.md vs CLAUDE.md vs Cursor rules](/guides/agents-md-vs-claude-md-vs-cursor-rules) for what each file is for), so teams that already kept an `AGENTS.md` for Codex, Cursor or Copilot had to add a CLAUDE.md, an import, a symlink or a hook. Two releases changed that:",
        bullets: [
          "v2.1.277 (September 18, 2026): \"Added AGENTS.md support: in a project with no CLAUDE.md, Claude Code reads AGENTS.md instead; change it under 'Project instructions' in `/config`.\"",
          "v2.1.281 (September 23, 2026): \"Changed AGENTS.md support to also work on Amazon Bedrock, Google Vertex AI, Microsoft Foundry, LLM gateways, and sessions with telemetry disabled.\" Before 2.1.281 those sessions read CLAUDE.md only, so articles that still say \"not on Bedrock or Vertex\" describe older versions.",
        ],
      },
      {
        title: "When Claude Code reads AGENTS.md (the CLAUDE.md check)",
        body:
          "By default Claude Code reads AGENTS.md only when you have no CLAUDE.md in your working directory or above it. The docs split your files into two groups for that check:",
        bullets: [
          "Files that block AGENTS.md: a `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in your working directory or any folder above it.",
          "Files that don't block it and keep loading alongside AGENTS.md: your `~/.claude/CLAUDE.md`, your organization's managed CLAUDE.md, and `.claude/rules/` files.",
          "Loaded at session start: every `AGENTS.md` and `.claude/AGENTS.md` in your working directory and the folders above it. In an interactive session you see a line such as `no CLAUDE.md found; AGENTS.md loaded: /home/you/repo/AGENTS.md`.",
          "Loaded later: a subfolder's `AGENTS.md`, when Claude opens a file there with the Read tool and that subfolder has none of the three CLAUDE.md files of its own.",
          "Inside each AGENTS.md: `@path` imports are expanded and `claudeMdExcludes` patterns apply. Subagents that skip project instructions skip AGENTS.md too.",
          "Never read: `AGENTS.local.md`, `AGENTS.override.md`, or anything under a `.agents/` folder. (Codex does read `AGENTS.override.md`; Claude Code does not.)",
        ],
      },
      {
        title: "The CLAUDE.local.md trap",
        body:
          "`CLAUDE.local.md` counts as a CLAUDE.md for the check. If your project relies on AGENTS.md and you add a personal, uncommitted `CLAUDE.local.md`, Claude Code stops reading AGENTS.md for you, while teammates without that file still get it. To keep your CLAUDE.local.md and still load AGENTS.md, set Project instructions to `claude-md-and-agents-md`.",
      },
      {
        title: "How to make Claude Code read both AGENTS.md and CLAUDE.md",
        body:
          "Type `/config` in a Claude Code session and set Project instructions to one of four values. The change applies from your next message and in every new session.",
        table: {
          caption: "Project instructions values in /config (Claude Code docs).",
          columns: ["Value", "What Claude reads"],
          rows: [
            ["`claude-md-or-agents-md` (default)", "Your CLAUDE.md files, or your AGENTS.md files when you have no CLAUDE.md or CLAUDE.local.md in your working directory or above it."],
            ["`claude-md-and-agents-md`", "Both. Each folder's CLAUDE.md files load first and its AGENTS.md after them. An AGENTS.md that your CLAUDE.md already imports or symlinks to is not read twice."],
            ["`claude-md`", "Your CLAUDE.md files only."],
            ["`managed-only`", "Only your organization's managed CLAUDE.md and auto memory at launch. Project, local and user CLAUDE.md files, `.claude/rules/` and every AGENTS.md are left out."],
          ],
        },
        paragraphs: [
          "You can set the same value in a settings file under the built-in `agents-md` plugin's ID in `pluginConfigs`. Claude Code honours it only in `~/.claude/settings.json`, a file you pass with `--settings`, or managed settings. It ignores the key in project and local settings, so committing it to `.claude/settings.json` does not switch it on for your team. For a team-wide default, use managed settings, or commit a CLAUDE.md that imports AGENTS.md (next section).",
        ],
        code: [
          {
            label: "`~/.claude/settings.json`, a `--settings` file, or managed settings:",
            code: `{
  "pluginConfigs": {
    "agents-md@builtin": {
      "options": { "instructionFiles": "claude-md-and-agents-md" }
    }
  }
}`,
          },
        ],
      },
      {
        title: "Use an @AGENTS.md import (works on every version)",
        body:
          "Put a `CLAUDE.md` next to your AGENTS.md that imports it, then add any Claude-only notes below the import. This is also how you [share instructions across repos](/guides/share-ai-coding-agent-instructions) without copies drifting apart. Claude reads the imported file first, then the rest. Use this when the repo also needs Claude-specific lines, when some teammates run a version older than 2.1.277, or when Project instructions is set to `claude-md`. Keeping the import never makes Claude read AGENTS.md twice, whichever value you pick in `/config`.",
        code: [
          {
            label: "`CLAUDE.md`",
            code: `@AGENTS.md

## Claude Code only
- Use plan mode before changing files under billing/.`,
          },
        ],
      },
      {
        title: "How to check that Claude Code loaded your AGENTS.md",
        body: "Three quick checks, from the Claude Code docs:",
        bullets: [
          "Run `/memory` and look for your AGENTS.md path in the list.",
          "In an interactive session, look for the start-up line `no CLAUDE.md found; AGENTS.md loaded: <path>`.",
          "Before v2.1.280, `/memory` and `/context` didn't list an AGENTS.md that Claude read directly. On those versions, ask Claude what its project instructions say.",
        ],
      },
      {
        title: "AGENTS.md not loading? Checklist",
        body:
          "Work through these in order. The first one is the usual cause.",
        table: {
          caption: "Why Claude Code ignores an AGENTS.md, and the fix.",
          columns: ["Check", "What to look for", "Fix"],
          rows: [
            ["1. A CLAUDE.md on the path", "A `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in your working directory or any folder above it (your `~/.claude/CLAUDE.md` doesn't count).", "Set Project instructions to `claude-md-and-agents-md`, or add `@AGENTS.md` to that CLAUDE.md."],
            ["2. Version", "`claude --version` is below 2.1.277, or below 2.1.281 on Bedrock, Vertex, Foundry, a gateway or with telemetry off.", "Update Claude Code, or use the `@AGENTS.md` import."],
            ["3. The /config value", "Project instructions is `claude-md` or `managed-only`, or the setting is missing from `/config` (your session can't load AGENTS.md).", "Pick `claude-md-or-agents-md` or `claude-md-and-agents-md`."],
            ["4. The built-in plugin", "The `agents-md` plugin is disabled in `/plugin`.", "Enable it again."],
            ["5. First session after an upgrade", "In some cases the first session after upgrading from 2.1.276 or earlier doesn't read AGENTS.md.", "Start a new session."],
            ["6. File name or folder", "The file is `AGENTS.override.md` or `AGENTS.local.md`, or sits under `.agents/`.", "Rename it to `AGENTS.md` in the project root, `.claude/`, or a subfolder."],
          ],
        },
      },
      {
        title: "Should you keep your old AGENTS.md workaround?",
        body: "If you set Claude Code up to read AGENTS.md before it did so itself, here is what the docs recommend for each common setup:",
        table: {
          caption: "Old workarounds after v2.1.277 (Claude Code docs).",
          columns: ["Setup", "What to do"],
          rows: [
            ["A CLAUDE.md containing `@AGENTS.md`", "Keep it if you like. It never causes a second copy. Delete the CLAUDE.md only if it holds nothing else."],
            ["A CLAUDE.md that tells Claude in words to read AGENTS.md", "Claude only sees AGENTS.md if it decides to open it. Delete the CLAUDE.md, or replace the sentence with an `@AGENTS.md` import."],
            ["`CLAUDE.md` symlinked to `AGENTS.md`", "Nothing to do, or delete the link. Either way Claude reads the content once."],
            ["A SessionStart hook that prints AGENTS.md", "Remove it. Once Claude reads AGENTS.md directly, the hook adds a second copy to the context."],
          ],
        },
        paragraphs: [
          "Symlinks have two caveats. The Edit and Write tools refuse to write through a symlink and point Claude at the target file instead. On Windows, creating a symlink needs Administrator rights or Developer Mode, and Git checks a committed symlink out as a plain text file unless `core.symlinks` is enabled, which leaves that clone with a one-line CLAUDE.md. Teams with Windows users should use the import.",
        ],
        code: [{ label: "The symlink approach (macOS and Linux only):", code: "ln -s AGENTS.md CLAUDE.md" }],
      },
      {
        title: "Where AGENTS.md behaves differently from CLAUDE.md",
        body: "An AGENTS.md that Claude reads through the Project instructions setting differs from a CLAUDE.md in three places:",
        table: {
          caption: "Directly read AGENTS.md vs CLAUDE.md (Claude Code docs).",
          columns: ["Behaviour", "CLAUDE.md", "AGENTS.md read through the setting"],
          rows: [
            ["`InstructionsLoaded` hooks", "Fire", "Don't fire (they do fire for an AGENTS.md that a CLAUDE.md imports or symlinks to)"],
            ["Folders added with `--add-dir` while `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` is set", "Their CLAUDE.md loads", "Their AGENTS.md doesn't load"],
            ["An `@path` import of a file outside your working directory", "Claude Code asks you to approve external imports", "Loads only if you already approved external imports for this project, with no prompt"],
          ],
        },
      },
      {
        title: "Copying AGENTS.md into CLAUDE.md with /init or /import",
        body:
          "If you would rather keep a real CLAUDE.md, `/init` reads AGENTS.md when `CLAUDE_CODE_NEW_INIT=1` is set and folds the relevant parts into the CLAUDE.md it generates. `/import` (v2.1.213 or later) appends a one-time copy of instruction files such as AGENTS.md to the matching CLAUDE.md. Both create a copy, so the two files can drift apart; the import approach above keeps one source.",
      },
      {
        title: "What belongs in AGENTS.md, and what should be a skill",
        body:
          "AGENTS.md loads into every session, so keep it to always-on facts: build and test commands, folder layout, and conventions. Step-by-step procedures and checklists that only matter for some tasks work better as skills, which load only when a task needs them. Claude Code's docs suggest keeping each CLAUDE.md under 200 lines; that advice is written for CLAUDE.md, and Codex caps combined AGENTS.md text at 32 KiB by default. See [AGENTS.md vs SKILL.md](/guides/agents-md-vs-skill-md) for the split and [every agent config file explained](/guides/ai-agent-configuration-files) for the wider picture.",
        paragraphs: [
          "AIPM doesn't install AGENTS.md or CLAUDE.md; keep those in your repo. It installs versioned skills from the registry into Claude Code (`.claude/skills/<name>/SKILL.md`). Browse [Claude skills](/skills/claude) or see [all commands](/commands). Using Codex too? `--target codex` installs the same skill to `.agents/skills/<name>/SKILL.md`, which Cursor also reads.",
        ],
        code: [
          {
            code: `npm install -g @aipm-registry/cli
aipm init --target claude
aipm add @scope/name@1.0.0 --target claude`,
          },
        ],
      },
    ],
    comparison: {
      caption: "AGENTS.md in Claude Code, Cursor and Codex, from each vendor's docs (checked 25 September 2026). See also the [AI agent file support table](/compatibility).",
      columns: ["", "Claude Code", "Cursor", "Codex"],
      rows: [
        ["Reads AGENTS.md?", "Yes, since v2.1.277, when no CLAUDE.md or CLAUDE.local.md is on the path (or always, with `claude-md-and-agents-md`)", "Yes, in the project root and subfolders ([details](/guides/cursor-rules-vs-agents-md))", "Yes, before doing any work"],
        ["Nested files", "Working directory and parents at start; a subfolder's file when Claude reads a file there", "Combined with parent folders; the more specific file takes precedence", "Walks from the project root down to your working directory, at most one file per folder, joined root first"],
        ["Override file", "None (`AGENTS.override.md` is not read)", "None documented", "`AGENTS.override.md` wins over `AGENTS.md` in the same folder"],
        ["Global file", "`~/.claude/CLAUDE.md` loads alongside AGENTS.md", "No global AGENTS.md documented; User Rules (Customize, then Rules) apply across projects", "`~/.codex/AGENTS.override.md` or `~/.codex/AGENTS.md`"],
        ["Size limit", "None documented for AGENTS.md; keep CLAUDE.md under 200 lines", "None documented", "`project_doc_max_bytes`, 32 KiB by default"],
        ["How to verify", "`/memory`, or the start-up line", "Not documented", "`codex --ask-for-approval never \"Summarize the current instructions.\"`"],
      ],
    },
    steps: [
      "Run `claude --version` and update to v2.1.281 or later.",
      "Keep one shared `AGENTS.md` in the repo root for every coding agent.",
      "If you need Claude-only lines, add a `CLAUDE.md` that starts with `@AGENTS.md`.",
      "If you keep a `CLAUDE.local.md`, set Project instructions to `claude-md-and-agents-md` in `/config`.",
      "Run `/memory` and confirm your AGENTS.md path is listed.",
      "Move long procedures out of AGENTS.md into skills.",
    ],
    faqs: [
      {
        question: "Does Claude Code read AGENTS.md automatically?",
        answer:
          "Yes, since v2.1.277, as long as there is no CLAUDE.md, .claude/CLAUDE.md or CLAUDE.local.md in your working directory or above it.",
      },
      {
        question: "Does Claude Code read AGENTS.md if I also have a CLAUDE.md?",
        answer:
          "Not by default. Set Project instructions to claude-md-and-agents-md in /config, or put @AGENTS.md at the top of your CLAUDE.md.",
      },
      {
        question: "Can I make Claude Code always read both files for my whole team?",
        answer:
          "Only through user settings, a --settings file or managed settings; Claude Code ignores the setting in a committed .claude/settings.json. The simplest team-wide option is to commit a CLAUDE.md that imports @AGENTS.md.",
      },
      {
        question: "Why isn't Claude Code loading my AGENTS.md?",
        answer:
          "Usually a CLAUDE.md or CLAUDE.local.md is somewhere on the path. Also check your version, the Project instructions value in /config, and that the built-in agents-md plugin isn't disabled.",
      },
      {
        question: "Does Claude Code read AGENTS.override.md or AGENTS.local.md?",
        answer: "No. Claude Code doesn't read AGENTS.override.md, AGENTS.local.md, or anything under a .agents/ folder. Codex is the tool that uses AGENTS.override.md.",
      },
      {
        question: "Should I symlink CLAUDE.md to AGENTS.md?",
        answer:
          "It works, but the Edit and Write tools won't write through the link, and Windows clones can end up with a one-line CLAUDE.md. The @AGENTS.md import is the safer choice.",
      },
      {
        question: "Does it work on Amazon Bedrock or Google Vertex AI?",
        answer: "Yes, from v2.1.281, which also covers Microsoft Foundry, LLM gateways and sessions with telemetry disabled.",
      },
    ],
    sources: [
      { label: "Claude Code docs: CLAUDE.md and AGENTS.md (memory)", href: "https://code.claude.com/docs/en/memory#agents-md" },
      { label: "Claude Code changelog (2.1.277, 2.1.281)", href: "https://code.claude.com/docs/en/changelog" },
      { label: "OpenAI Codex docs: Custom instructions with AGENTS.md", href: "https://learn.chatgpt.com/docs/agent-configuration/agents-md" },
      { label: "Cursor docs: Rules and AGENTS.md", href: "https://cursor.com/docs/rules" },
      { label: "AGENTS.md format", href: "https://agents.md" },
    ],
  },
];
