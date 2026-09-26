import type { SeoGuide } from "./seo-guides";

/**
 * Batch-1 guide: /guides/skill-md-frontmatter-reference (SEO & AEO Desk brief, 2026-09-25).
 * Facts checked on 2026-09-25 against agentskills.io/specification, code.claude.com/docs/en/skills
 * (latest Claude Code release 2.1.282), code.claude.com/docs/en/sub-agents, Claude Help Center article 12512180,
 * cursor.com/docs/skills and learn.chatgpt.com/docs/build-skills.
 * Product decision (PM, 2026-09-25): AIPM documents `name` and `description` as required. Don't claim the CLI
 * templates or `aipm publish validate` produce or enforce frontmatter.
 */
const PORTABLE_EXAMPLE = `---
name: code-review
description: Review code changes for bugs, security risks and missing tests. Use when the user asks for a review of a diff or pull request.
---

# Code review

1. Read the changed files and nearby tests.
2. Report problems that change behavior, most serious first.`;

export const SKILL_MD_FRONTMATTER_GUIDES: SeoGuide[] = [
  {
    slug: "skill-md-frontmatter-reference",
    title: "SKILL.md Frontmatter Reference: Every Field & Limit",
    h1: "SKILL.md frontmatter reference: every field, limit and error",
    description:
      "Every SKILL.md frontmatter field: the Agent Skills spec (name, description, license…), Claude Code extras like when_to_use and paths, Cursor and Codex rules, and fixes.",
    answer:
      "A SKILL.md starts with YAML frontmatter between `---` lines. `name` and `description` are required: the open Agent Skills spec, Cursor and Codex all require them, and AIPM documents them as required. `name` is up to 64 lowercase letters, numbers and hyphens and matches the folder; `description` is up to 1,024 characters. Optional spec fields are `license`, `compatibility`, `metadata` and `allowed-tools`. Claude Code adds fields such as `when_to_use`, `disable-model-invocation`, `context` and `paths`. Need a starting file? Use a [SKILL.md template](/templates).",
    answerTable: {
      caption: "The two required fields, as the Agent Skills spec defines them (checked 25 September 2026).",
      columns: ["Field", "Required", "Limit", "Example"],
      rows: [
        ["`name`", "Yes", "1–64 characters: `a-z`, `0-9` and `-`; no leading, trailing or double hyphen; same as the folder name", "`code-review`"],
        ["`description`", "Yes", "1–1,024 characters; say what the skill does and when to use it", "`Review code changes for bugs… Use when the user asks for a review.`"],
      ],
    },
    keywords: [
      "skill.md frontmatter",
      "skill md yaml frontmatter",
      "skill md format",
      "claude skill md frontmatter",
      "claude skill metadata fields",
      "claude skill description limit",
      "anthropic skills specification",
      "codex skills openai.yaml",
      "cursor skills format",
      "claude code commands frontmatter",
    ],
    publishedAt: "2026-09-25",
    updatedAt: "2026-09-25",
    lastChecked: "2026-09-25",
    sections: [
      {
        title: "A minimal SKILL.md that works everywhere",
        body:
          "Put `---` on the very first line, then `key: value` pairs, then a closing `---`. The Markdown instructions go after it. This file uses only the two required fields, so the Agent Skills spec, Claude Code, claude.ai uploads, Cursor and Codex all accept it. More starting files: [SKILL.md templates and examples](/templates). Not sure where to save the file? See [where Claude skills are stored](/guides/where-are-claude-skills-stored).",
        code: [{ label: ".claude/skills/code-review/SKILL.md", code: PORTABLE_EXAMPLE }],
      },
      {
        title: "The portable fields (Agent Skills spec)",
        body:
          "The [Agent Skills specification](https://agentskills.io/specification) defines six frontmatter fields. Use only these if the skill must run in more than one tool or be uploaded to claude.ai.",
        table: {
          caption: "Agent Skills spec fields (agentskills.io/specification, checked 25 September 2026).",
          columns: ["Field", "Required", "Constraint", "Example"],
          rows: [
            ["`name`", "Yes", "1–64 characters; lowercase `a-z`, `0-9` and hyphens; must not start or end with `-`; no `--`; must match the parent folder", "`pdf-processing`"],
            ["`description`", "Yes", "1–1,024 characters; what the skill does and when to use it, with keywords agents can match", "`Extract PDF text, fill forms, merge files. Use when handling PDFs.`"],
            ["`license`", "No", "A license name or the name of a bundled license file", "`Apache-2.0`"],
            ["`compatibility`", "No", "1–500 characters; only if the skill has environment requirements", "`Requires git, docker, jq, and access to the internet`"],
            ["`metadata`", "No", "A map of string keys to string values; pick key names unlikely to clash", "`author: example-org`"],
            ["`allowed-tools`", "No (experimental)", "Space-separated string of pre-approved tools; support varies by tool", "`Bash(git:*) Bash(jq:*) Read`"],
          ],
        },
        paragraphs: [
          "Valid names from the spec: `pdf-processing`, `data-analysis`, `code-review`. Invalid: `PDF-Processing` (uppercase), `-pdf` (leading hyphen), `pdf--processing` (consecutive hyphens).",
          "The spec also recommends keeping `SKILL.md` under 500 lines and the instructions under 5,000 tokens; only `name` and `description` (about 100 tokens) load at startup. Keep file references one level deep from `SKILL.md`.",
          "Check a folder against the spec with the `skills-ref` reference library:",
        ],
        code: [{ code: "skills-ref validate ./my-skill" }],
      },
      {
        title: "How Claude Code reads frontmatter",
        body:
          "Claude Code is more lenient than the spec. Per the [Claude Code skills docs](https://code.claude.com/docs/en/skills#frontmatter-reference):",
        bullets: [
          "Every field is optional. Only `description` is recommended; without it, Claude uses the first non-empty line of the Markdown. `name` defaults to the folder name.",
          "Frontmatter is read only when the opening `---` is the first line of the file. Otherwise the whole file, markers included, is treated as instructions.",
          "If the YAML doesn't parse, the skill still loads with no fields set: `/skill-name` works, but Claude can't match your `description`. Run `claude --debug` to see the parse error.",
          "A field name must match exactly, hyphens included. An unknown field is ignored without an error.",
          "Field names are lowercase and hyphenated, except `when_to_use`.",
          "Booleans accept `yes`, `no`, `on`, `off`, `1` and `0` in any case, as well as `true` and `false`, from v2.1.218.",
          "In a personal or project skill, `name` only sets the label in skill listings; the command you type comes from the folder name. In a plugin skill, `name` sets the last part of the command, such as `/my-plugin:fancy`.",
          "Command files in `.claude/commands/` accept the same fields except `name` and `paths`. See [Claude Code skills vs slash commands](/guides/claude-code-skills-vs-slash-commands).",
        ],
      },
      {
        title: "Claude Code frontmatter fields",
        body: "Every field Claude Code documents, with what it's for. All are optional.",
        table: {
          caption: "Claude Code SKILL.md fields (code.claude.com/docs/en/skills, checked 25 September 2026; latest release 2.1.282).",
          columns: ["Field", "Use it for"],
          rows: [
            ["`name`", "Label shown in skill listings. Defaults to the folder name"],
            ["`description`", "What the skill does and when to use it (recommended). Claude matches requests against it"],
            ["`when_to_use`", "Extra trigger phrases or example requests, appended to `description` in the listing"],
            ["`argument-hint`", "Autocomplete hint such as `[issue-number]` or `[filename] [format]`"],
            ["`arguments`", "Named positional arguments for `$name` substitution; a space-separated string or YAML list"],
            ["`disable-model-invocation`", "`true` = only you can run it with `/name`. Default `false`"],
            ["`user-invocable`", "`false` = only Claude can run it; hidden from the `/` menu. Default `true`"],
            ["`allowed-tools`", "Tools Claude may use without asking during the turn that invokes the skill. It pre-approves; it does not restrict"],
            ["`disallowed-tools`", "Tools removed while the skill is active, until your next message"],
            ["`model`", "Model for the rest of the current turn, or `inherit`"],
            ["`effort`", "`low`, `medium`, `high`, `xhigh` or `max`; levels depend on the model"],
            ["`context`", "`fork` runs the skill in a forked subagent context ([skills vs subagents](/guides/claude-code-skills-vs-mcp-vs-subagents-vs-hooks#skills-vs-subagents-when-to-use-each-and-how-they-combine))"],
            ["`agent`", "Subagent type to use with `context: fork`, such as `Explore`"],
            ["`background`", "With `context: fork` only: `false` waits for the result in the same turn. Default `true`. v2.1.218+"],
            ["`hooks`", "Hooks registered when the skill is invoked"],
            ["`paths`", "Glob patterns; Claude loads the skill automatically only when working with matching files"],
            ["`shell`", "`bash` (default) or `powershell` for inline shell commands"],
            ["`metadata`", "Your own key-value data. Claude Code doesn't act on it and drops a value that isn't a map"],
            ["`license`", "Spec field; accepted, not acted on"],
            ["`compatibility`", "Spec field, up to 500 characters; accepted, not acted on"],
          ],
        },
      },
      {
        title: "Who can invoke a skill: invocation control",
        body: "Two Claude Code fields decide whether you, Claude, or both can start a skill, and what sits in context.",
        table: {
          caption: "From the Claude Code skills docs (checked 25 September 2026).",
          columns: ["Frontmatter", "You can invoke", "Claude can invoke", "In context"],
          rows: [
            ["(default)", "Yes", "Yes", "Description always; full skill when invoked"],
            ["`disable-model-invocation: true`", "Yes", "No", "Nothing until you invoke it"],
            ["`user-invocable: false`", "No", "Yes", "Description always; full skill when invoked"],
          ],
        },
        paragraphs: [
          "`disable-model-invocation: true` also stops the skill being preloaded into subagents and, from v2.1.196, stops it running when a scheduled task fires with it as the prompt. Cursor supports the same field. Codex has no frontmatter field for this: set `policy.allow_implicit_invocation: false` in `agents/openai.yaml` instead.",
        ],
      },
      {
        title: "Description length and the skill listing budget",
        body:
          "Claude Code puts every skill's name and description in a listing so Claude knows what exists. The combined `description` and `when_to_use` text is cut at 1,536 characters per skill, so put the main use case first. The cap is configurable with the `skillListingMaxDescChars` setting.",
        bullets: [
          "The whole listing gets 1% of the model's context window. Raise it with `skillListingBudgetFraction` (for example `0.02`) or set a fixed character count with `SLASH_COMMAND_TOOL_CHAR_BUDGET`.",
          "When the listing is over budget, the skills you invoke least lose their descriptions first. Names always stay.",
          "`/doctor` estimates the listing's cost; `/skill-doctor` finds skills worth turning off.",
          "Codex caps its initial skills list at 2% of the context window, or 8,000 characters when the window is unknown, and shortens descriptions first.",
        ],
      },
      {
        title: "Frontmatter for claude.ai uploads and the Skills API",
        body:
          "claude.ai skill uploads, the Skills API and `package_skill.py` from anthropics/skills accept only the six spec fields: `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`. Any other field is a hard error, not a warning. The same applies when you enable a personal Claude Code skill for your claude.ai account (for Cowork, cloud sessions or routines), because that uploads it.",
        code: [
          {
            label: "Error text from the Claude Code docs",
            code: "Unexpected key(s) in SKILL.md frontmatter: argument-hint. Allowed properties are: allowed-tools, compatibility, description, license, metadata, name",
          },
        ],
        paragraphs: [
          "The Claude Help Center lists these other upload failures: the ZIP is too large, the folder name doesn't match the skill name, `SKILL.md` is missing, or the name or description has invalid characters.",
        ],
      },
      {
        title: "Cursor frontmatter",
        body:
          "Cursor's skill format ([Cursor docs](https://cursor.com/docs/skills)) requires `name` (lowercase letters, numbers and hyphens, matching the parent folder) and `description`. Optional fields: `paths` (comma-separated string or list; the legacy `globs` field still works as a fallback), `disable-model-invocation`, `icon` and `color` (for Custom Modes; `color` is one of `default`, `green`, `cyan`, `blue`, `purple`, `magenta`, `orange`, `yellow`, `red` or `brand`), and `metadata`.",
        paragraphs: [
          "Cursor also reads skills from `.claude/skills/` and `.agents/skills/`, so AIPM installs made with `--target claude` or `--target codex` work in Cursor. More: [how to install Cursor skills](/guides/how-to-install-cursor-skills).",
        ],
      },
      {
        title: "Codex frontmatter and agents/openai.yaml",
        body:
          "Codex requires `name` and `description` in `SKILL.md` ([Codex docs](https://learn.chatgpt.com/docs/build-skills)). Display settings, invocation policy and tool dependencies go in an optional `agents/openai.yaml` next to it, not in frontmatter.",
        code: [
          {
            label: "my-skill/agents/openai.yaml",
            code: `interface:
  display_name: "Optional user-facing name"
  short_description: "Optional user-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt to use the skill with"

policy:
  allow_implicit_invocation: false

dependencies:
  tools:
    - type: "mcp"
      value: "openaiDeveloperDocs"
      description: "OpenAI Docs MCP server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"`,
          },
        ],
        paragraphs: [
          "`allow_implicit_invocation` defaults to `true`. With `false`, Codex won't pick the skill on its own, but `$skill` still works. See [Claude Code skills vs Codex skills](/guides/claude-code-skills-vs-codex-skills) for other differences.",
        ],
      },
      {
        title: "One table: which fields work where",
        body:
          "Each cell comes from that tool's own docs, checked 25 September 2026. \"Not documented\" means the tool's docs don't list the field, so don't rely on it there. For which tools read which files at all, see the [AI agent file support table](/compatibility).",
        table: {
          caption: "SKILL.md frontmatter support by tool. Error = upload or packaging fails.",
          columns: ["Field", "Agent Skills spec", "Claude Code", "claude.ai upload / Skills API", "Cursor", "Codex"],
          rows: [
            ["`name`", "Required", "Optional (defaults to folder name)", "Allowed", "Required", "Required"],
            ["`description`", "Required", "Recommended", "Allowed", "Required", "Required"],
            ["`license`", "Optional", "Accepted, not acted on", "Allowed", "Not documented", "Not documented"],
            ["`compatibility`", "Optional (≤500 chars)", "Accepted, not acted on (≤500)", "Allowed", "Not documented", "Not documented"],
            ["`metadata`", "Optional (string map)", "Optional, not acted on", "Allowed", "Optional", "Not documented"],
            ["`allowed-tools`", "Optional, experimental", "Optional (pre-approves)", "Allowed", "Not documented", "Not documented"],
            ["`when_to_use`", "Not in spec", "Optional", "Error", "Not documented", "Not documented"],
            ["`argument-hint`, `arguments`", "Not in spec", "Optional", "Error", "Not documented", "Not documented"],
            ["`disable-model-invocation`", "Not in spec", "Optional", "Error", "Optional", "Use `agents/openai.yaml` policy"],
            ["`user-invocable`", "Not in spec", "Optional", "Error", "Not documented", "Not documented"],
            ["`disallowed-tools`", "Not in spec", "Optional", "Error", "Not documented", "Not documented"],
            ["`model`, `effort`", "Not in spec", "Optional", "Error", "Not documented", "Not documented"],
            ["`context`, `agent`, `background`", "Not in spec", "Optional", "Error", "Not documented", "Not documented"],
            ["`hooks`", "Not in spec", "Optional", "Error", "Not documented", "Not documented"],
            ["`paths`", "Not in spec", "Optional", "Error", "Optional (legacy `globs` accepted)", "Not documented"],
            ["`shell`", "Not in spec", "Optional", "Error", "Not documented", "Not documented"],
            ["`icon`, `color`", "Not in spec", "Ignored (unknown field)", "Error", "Optional", "Not documented"],
          ],
        },
        paragraphs: [
          "The safe rule: if a skill must run in several tools, or be uploaded to claude.ai, use only the six spec fields. Keep Claude Code-only fields in a copy that stays in `.claude/skills/`.",
        ],
      },
      {
        title: "Frontmatter errors and how to fix them",
        body: "Match the symptom, then apply the fix.",
        table: {
          caption: "Common SKILL.md frontmatter problems and fixes.",
          columns: ["Symptom", "Where", "Cause", "Fix"],
          rows: [
            ["`Unexpected key(s) in SKILL.md frontmatter`", "claude.ai upload, Skills API, `package_skill.py`", "A field outside the six spec fields, such as `argument-hint`", "Remove the field, or keep a separate Claude Code copy"],
            ["Skill never triggers, or its fields are ignored", "Claude Code", "`---` isn't on line 1, or the YAML doesn't parse, so the skill loads with no fields", "Put `---` on the first line and fix the YAML. Check with `claude --debug` and `claude plugin validate .claude/skills` (v2.1.233+)"],
            ["Upload rejected", "claude.ai", "Folder name doesn't match `name`, `SKILL.md` missing, invalid characters, or ZIP too large", "Rename the folder to match `name`, keep `SKILL.md` at the top of the folder, and remove large files"],
            ["Name rejected or skill not found", "Spec, Cursor", "`name` differs from the folder, or has uppercase letters, spaces or `--`", "Use lowercase letters, numbers and single hyphens, and name the folder the same"],
            ["Description cut short", "Claude Code", "Over 1,536 characters with `when_to_use`, or the listing is over budget", "Lead with the main use case; see the listing budget section above"],
            ["\"Must be a YAML mapping\" or \"missing frontmatter\"", "Validators (tool varies)", "The block between `---` lines isn't `key: value` pairs (for example a list or plain text), or the file doesn't start with `---`", "Start the file with `---` and write one `key: value` pair per line"],
            ["Tool still asks for permission, or a tool you wanted blocked still runs", "Claude Code", "`allowed-tools` pre-approves tools for one turn; it never blocks tools", "Use `disallowed-tools` to remove tools while the skill runs"],
            ["Claude runs the skill when you didn't ask", "Claude Code, Cursor", "Description matches too many requests", "Make the description more specific, or set `disable-model-invocation: true`"],
          ],
        },
        paragraphs: [
          "The exact messages \"must be a YAML mapping\" and \"missing frontmatter\" aren't in the Claude Code, Cursor or Codex docs we checked, so this page doesn't say which tool prints them. A YAML mapping is simply a set of `key: value` pairs.",
          "General YAML rules apply too: indent with spaces, never tabs, and quote a value that contains `: ` or ` #`, or that starts with `[`, `{` or `*`.",
        ],
      },
      {
        title: "Complete examples",
        body:
          "Three copy-ready files. The first is safe everywhere; the other two use Claude Code-only fields, so don't upload them to claude.ai as they are.",
        code: [
          {
            label: "1. Portable (spec fields only)",
            code: `---
name: release-notes
description: Write release notes from merged pull requests. Use when the user asks for release notes, a changelog entry or upgrade notes.
license: MIT
metadata:
  owner: platform-team
---`,
          },
          {
            label: "2. Claude Code: manual-only skill with arguments",
            code: `---
name: fix-issue
description: Fix a GitHub issue end to end and open a pull request.
when_to_use: Use when the user gives an issue number and asks for a fix.
argument-hint: "[issue-number]"
disable-model-invocation: true
allowed-tools: Bash(gh *) Read Grep
paths: "src/**/*.ts"
---

Fix issue $ARGUMENTS: read it with gh, find the cause, add a test, then fix it.`,
          },
          {
            label: "3. Claude Code: forked research skill",
            code: `---
name: deep-research
description: Research a topic thoroughly in the codebase
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly and summarize findings with file references.`,
          },
        ],
      },
      {
        title: "Publish a skill with AIPM",
        body:
          "AIPM documents `name` and `description` as required for every skill you publish. AIPM installs a skill into a folder named after the package's short name (`@team/code-review` → `.claude/skills/code-review/` with `--target claude`, `.agents/skills/code-review/` with `--target codex`), so set `name` to that short name to keep the spec and Cursor happy. AIPM copies `SKILL.md` as published and doesn't rewrite frontmatter for each tool.",
        code: [
          {
            code: `npm install -g @aipm-registry/cli
aipm skill init --name @team/code-review --template code-review
cd code-review
# add frontmatter (name, description) to the generated SKILL.md if it isn't there, then:
aipm publish add .
aipm publish validate`,
          },
        ],
        paragraphs: [
          "Check the frontmatter yourself before you run `aipm publish validate`. Next steps are in the [publishing guide](/publish/guide); starting files are on the [templates page](/templates); a full walkthrough is in [how to create an Agent Skill](/guides/how-to-create-agent-skill); to get the skill to teammates, see [how to share Claude skills with your team](/guides/share-claude-skills-with-team).",
        ],
      },
    ],
    steps: [
      "Put --- on the first line of SKILL.md.",
      "Add name: lowercase letters, numbers and hyphens, the same as the folder name.",
      "Add description: what the skill does and when to use it, under 1,024 characters.",
      "Add optional spec fields (license, compatibility, metadata, allowed-tools) only if you need them.",
      "Add Claude Code-only fields only to copies that stay in Claude Code.",
      "Close the block with --- and write the instructions below it.",
    ],
    faqs: [
      {
        question: "What fields are required in SKILL.md frontmatter?",
        answer:
          "`name` and `description`. The Agent Skills spec, Cursor and Codex require both, and AIPM documents both as required. Claude Code alone treats every field as optional: it recommends `description`, and `name` defaults to the folder name.",
      },
      {
        question: "How long can a skill description be?",
        answer:
          "Up to 1,024 characters in the Agent Skills spec. Claude Code also cuts the combined `description` and `when_to_use` text at 1,536 characters in its skill listing.",
      },
      {
        question: "What characters are allowed in a skill name?",
        answer:
          "Lowercase letters, numbers and hyphens, 1–64 characters, with no leading, trailing or double hyphens. The name must match the skill's folder.",
      },
      {
        question: "Why does claude.ai say \"Unexpected key(s) in SKILL.md frontmatter\"?",
        answer:
          "Uploads and the Skills API accept only name, description, license, compatibility, metadata and allowed-tools. Remove Claude Code-only fields such as argument-hint or when_to_use.",
      },
      {
        question: "Does allowed-tools restrict which tools a skill can use?",
        answer:
          "No. In Claude Code it pre-approves the listed tools for the turn that invokes the skill. To remove tools, use disallowed-tools.",
      },
      {
        question: "How do I stop Claude from triggering a skill automatically?",
        answer: "Set `disable-model-invocation: true`. You can still run it yourself with /skill-name.",
      },
      {
        question: "Where does Codex put skill settings like implicit invocation?",
        answer:
          "In an optional agents/openai.yaml file next to SKILL.md: set policy.allow_implicit_invocation to false. $skill still works.",
      },
    ],
    sources: [
      { label: "Agent Skills specification", href: "https://agentskills.io/specification" },
      { label: "Claude Code docs: Skills (frontmatter reference)", href: "https://code.claude.com/docs/en/skills#frontmatter-reference" },
      { label: "Claude Code docs: Using skill frontmatter outside Claude Code", href: "https://code.claude.com/docs/en/skills#using-skill-frontmatter-outside-claude-code" },
      { label: "Claude Code docs: Preload skills into subagents", href: "https://code.claude.com/docs/en/sub-agents#preload-skills-into-subagents" },
      { label: "Claude Help Center: Use skills in Claude", href: "https://support.claude.com/en/articles/12512180-use-skills-in-claude" },
      { label: "Cursor docs: Agent Skills (frontmatter fields)", href: "https://cursor.com/docs/skills" },
      { label: "OpenAI Codex docs: Build skills", href: "https://learn.chatgpt.com/docs/build-skills" },
      { label: "skills-ref validator", href: "https://github.com/agentskills/agentskills/tree/main/skills-ref" },
    ],
  },
];
