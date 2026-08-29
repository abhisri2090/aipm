---
name: aipm-package-prep
description: Interview the user and convert existing AI skills, prompts, helper files, templates, or repo-specific workflows into upload-ready AIPM skill packages.
---

# AIPM Package Prep

Use this skill when the user wants to prepare an existing skill, workflow, prompt pack, helper setup, or repo-specific debugging/tooling bundle for AIPM publishing.

The output is an AIPM package folder with `aipm.manifest.json`, a durable `SKILL.md`, and optional install metadata for permanent main files, temporary helper files, and a manual post-install setup prompt.

## First Response

Start by finding out whether the user wants you to inspect an existing path or design the package from scratch. If they gave a path, inspect it before asking nonessential questions.

Ask questions in one compact batch unless the answer can be confidently inferred from files already present. Always include the fixed questions below when they are not already answered.

## Fixed Questions

Ask these for every package:

1. What package name/scope should this use, for example `@team/name`?
2. Should this be generic for many repos/languages, or tailored to one repo/framework?
3. Which AI tools should it target: Cursor, Claude, or both?
4. Is it only a skill file, or does it also include supporting files?
5. Are any supporting files permanent project files that should remain after install?
6. Are any supporting files temporary helper/setup/template files that can be cleaned up later?
7. Is there a prompt users should run after install in their AI coding tool?
8. If there is a setup prompt, should helper cleanup be manual or after user confirmation?
9. What commands should validate the packaged result, if any?
10. Are there secrets, credentials, customer data, private URLs, or repo-specific assumptions that must be removed or generalized?

## Optional Follow-ups

Ask only when relevant:

- Should files be copied exactly, adapted into templates, or rewritten as generic guidance?
- Should permanent files overwrite existing files, skip existing files, or fail on conflicts?
- Should package scripts, `.gitignore`, env examples, or config snippets be part of setup?
- Does the setup require a specific runtime such as Node, Python, shell, browser, Electron, or a framework?
- Should the package include examples, tags, categories, license, source URL, or release notes?
- Does the package need a manual setup prompt, a migration prompt, a verification prompt, or all of them?
- What generated files should AIPM never clean up?
- Should the package be public, private, or org-only once uploaded?

## Classification

Classify the package before writing files:

- `skill-only`: only `SKILL.md` is needed.
- `skill-with-helper-files`: skill plus temporary docs/templates/scripts used during setup.
- `skill-with-manual-prompt`: helper files include a prompt the user runs manually after install.
- `skill-with-main-files`: package installs permanent files into the target repo.
- `hybrid`: any combination of helper files, main files, and manual prompt.

Prefer manual prompts over automatic execution. Do not add install scripts, postinstall scripts, AI-provider calls, shell hooks, or arbitrary execution unless the user explicitly asks and the current AIPM phase supports it.

## Packaging Workflow

1. Inspect the source path, skill files, helper files, manifests, package scripts, `.gitignore`, and git status. Use git history or working-tree changes to identify related files when the user mentions them.
2. Summarize what you found and the proposed package classification.
3. Ask the fixed questions that remain unanswered.
4. Create a package folder, normally under `examples/skills/<scope>/<name>/` when working in the AIPM repo.
5. Write a durable `SKILL.md` that is generic enough for the chosen audience and does not depend on helper files after cleanup.
6. Copy or adapt setup-only material into `setup/` as helper files.
7. Copy or adapt permanent project assets into a clear source folder such as `files/` or `templates/`.
8. Write `aipm.manifest.json`.
9. Add `.aipmignore` to exclude local state, logs, secrets, dependencies, and generated files.
10. Run AIPM publish staging and validation when available.
11. Report exactly what is ready to upload and whether an auth token is still needed.

## Manifest Rules

Use `schemaVersion: "0.1"` and `type: "skill"`.

For normal skill-only packages:

```json
{
  "schemaVersion": "0.1",
  "name": "@scope/name",
  "version": "1.0.0",
  "type": "skill",
  "description": "Short package description.",
  "entry": "SKILL.md",
  "targets": ["cursor", "claude"],
  "license": "Apache-2.0"
}
```

For helper files and manual setup prompts:

```json
{
  "install": {
    "helperFiles": [
      { "from": "setup/SETUP_PROMPT.md", "to": "SETUP_PROMPT.md" },
      { "from": "setup/README_FOR_AI.md", "to": "README_FOR_AI.md" }
    ],
    "postInstall": {
      "mode": "manual_prompt",
      "promptFile": "SETUP_PROMPT.md",
      "cleanup": "after_user_confirmation"
    }
  }
}
```

For permanent project files:

```json
{
  "install": {
    "mainFiles": [
      {
        "from": "files/example.config.js",
        "to": "example.config.js",
        "overwrite": "fail"
      }
    ]
  }
}
```

Rules:

- `mainFiles.to` is relative to the install root.
- `helperFiles.to` is relative to the AIPM helper directory.
- `postInstall.promptFile` must match an installed helper file target.
- Default `overwrite` is `fail`.
- Reject absolute paths, empty paths, `..`, path traversal, secrets, logs, and local dependency folders.

## Setup Prompt Requirements

When creating `setup/SETUP_PROMPT.md`, make it tell the downstream AI tool to:

- Inspect the target repo before editing.
- Preserve existing user changes.
- Read the helper docs/templates installed by AIPM.
- Apply only the files/config needed for that repo.
- Ask before overwriting conflicts.
- Avoid secrets, credentials, PII, private URLs, or repo-specific names unless the user chose a repo-specific package.
- Run practical validation commands.
- Tell the user they can run `aipm cleanup <package>` after helper files are no longer needed.

## Validation

When in an AIPM repo with the CLI built, validate from the package directory:

```bash
node /path/to/aipm/apps/cli/dist/bin.cjs publish reset
node /path/to/aipm/apps/cli/dist/bin.cjs publish add .
node /path/to/aipm/apps/cli/dist/bin.cjs publish validate
node /path/to/aipm/apps/cli/dist/bin.cjs publish preview
```

If the installed `aipm` CLI is available, use that instead:

```bash
aipm publish reset
aipm publish add .
aipm publish validate
aipm publish preview
```

Do not push unless the user asks and a valid token is available.
