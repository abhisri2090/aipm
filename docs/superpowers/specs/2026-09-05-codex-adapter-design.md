# Codex Skill Adapter Design

**Date:** 2026-09-05  
**Status:** Approved; plan at `docs/superpowers/plans/2026-09-05-codex-adapter.md`  
**Goal:** Make Codex a first-class AIPM install target alongside Cursor and Claude, for skill packages only.

## Context

AIPM can install skills into Cursor (`.cursor/aipm/skills/<short>.md`) and Claude (`.claude/aipm/skills/<short>/SKILL.md`). Codex is documented in product copy and the expansion plan but is not in `AiToolSchema`, has no adapter, and is rejected by CLI `--target`.

This pass is **core only**: schema, adapter, detection, engine wiring, CLI flags/prompts/errors, and tests. No web filters, docs/guides rewrite, or MCP config.

## Decisions

| Topic | Decision |
| --- | --- |
| Approach | New `@aipm-registry/adapter-codex` package mirroring Claude |
| Install path | Native Codex: `.agents/skills/<short-name>/SKILL.md` |
| Namespacing | No `.agents/aipm/` prefix |
| Detection | Presence of `.codex` at project root |
| Also detect `.agents`? | No — detection stays on `.codex` only |
| `*` target | Expands to cursor, claude, **and** codex |
| Manifest targets | Packages may list `"codex"` or `"*"` |
| MCP / config.toml | Out of scope |
| Web UI / SEO guides | Out of scope |
| Existing Cursor/Claude paths | Unchanged |

`<short-name>` is `shortNameFromScopeName(packageName)` (same as other adapters).

## Behavior

### Resolve tools

Same order as today:

1. Explicit `--target` / `explicitTarget`
2. Else detected tools ∩ manifest targets
3. Else `preferredTools` ∩ manifest targets
4. Else if manifest has `*`, all concrete tools

Detection additions:

- `.cursor` → `cursor`
- `.claude` → `claude`
- `.codex` → `codex`

### Install

For `codex`, write skill markdown to:

```text
<projectRoot>/.agents/skills/<short-name>/SKILL.md
```

Create parent directories as needed. Return the absolute written path in `writtenPaths` / lockfile `installed.codex`.

### CLI

- `--target` / `--targets` accept `codex`
- Interactive prompt offers `cursor` / `claude` / `codex`
- Help and “no tool detected” errors mention `codex`
- `aipm init --target codex` sets `preferredTools: ["codex"]` (same init path as other tools)

### Errors

When nothing is detected and no preferred/explicit target:

> No AI tool detected (`.cursor/`, `.claude/`, or `.codex/`). Use `--target cursor|claude|codex|*` or set `preferredTools` in `aipm.package.json`.

## Architecture

```text
schemas AiToolSchema / ALL_TOOLS
  → adapter-codex (SkillAdapter)
  → engine installSkillPackage + detectToolsInProject
  → CLI parseTarget(s)Flag + prompt + option strings
```

Engine depends on `@aipm-registry/adapter-codex` and registers it next to cursor/claude.

## Tests

- Schema accepts `codex`; `expandTargets(["*"])` includes `codex`
- Detect `.codex` → `["codex"]`
- `--target codex` writes `.agents/skills/<short>/SKILL.md`
- Cursor/Claude install paths unchanged
- CLI rejects unknown targets; accepts `codex`
- Invalid `--target` error text lists `codex`

## Non-goals

- MCP install into `.codex/config.toml`
- Web registry filters, install command defaults, `llms.txt`, SEO guides
- Detecting `.agents` without `.codex`
- Changing Claude/Cursor layout to match Codex

## Success criteria

- `aipm add @scope/name@version --target codex --ci` installs a readable `SKILL.md` under `.agents/skills/`
- Packages with `targets: ["codex"]` or `["*"]` validate and install
- Existing cursor/claude flows keep current paths and behavior
