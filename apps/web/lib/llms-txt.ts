export type LlmsTxtInput = {
  siteUrl: string;
  cliVersion: string;
  cliReleaseUrl: string;
  cliInstallCommand: string;
  cliInstallScriptCommand: string;
  cliHomebrewCommand: string;
  cliWindowsInstallCommand: string;
  cliScoopCommand: string;
};

export function buildLlmsTxt(input: LlmsTxtInput): string {
  const site = input.siteUrl.replace(/\/$/, "");

  return `# AIPM Registry

> AIPM is a registry and command line workflow for project-ready AI skills, prompts, rules, and tool files. It helps developers install reusable AI setup into supported assistants and editors without copying files by hand.

## Primary URLs

- [Website](${site})
- [Registry search](${site}/registry)
- [Install guide](${site}/install)
- [Use guide](${site}/use)
- [CLI commands](${site}/commands)
- [Publish guide](${site}/publish)
- [Examples](${site}/examples)
- [Glossary](${site}/glossary)
- [Supported targets](${site}/targets)
- [AI best practices](${site}/ai-practices)
- [Security and privacy](${site}/security)
- [Privacy notice](${site}/privacy)
- [Terms and acceptable use](${site}/terms)
- [Registry status](${site}/status)
- [Product roadmap](${site}/roadmap)
- [Changelog](${site}/changelog)
- [Skill templates](${site}/templates)
- [FAQ](${site}/faq)
- [Components of an AI agent](${site}/guides/components-of-an-ai-agent)
- [AI agent file support](${site}/compatibility)
- [What is an AI package manager?](${site}/guides/ai-package-manager)
- [Agent package manager guide](${site}/guides/agent-package-manager)
- [Prompt package manager guide](${site}/guides/prompt-package-manager)
- [MCP package manager guide](${site}/guides/mcp-package-manager)
- [Version AI prompts in Git](${site}/guides/version-ai-prompts)
- [Share Cursor rules](${site}/guides/share-cursor-rules)
- [Publish reusable Claude skills](${site}/guides/reusable-claude-skills)
- [Manage AI agent instructions in Git](${site}/guides/ai-agent-instructions-git)

## Plain-English Answers

### What are the main components of an AI agent?

An AI agent needs a model to think, instructions to guide it, context and memory to understand the task, tools to get information, actions to do work, and safety checks to keep its work under control. See [Components of an AI agent](${site}/guides/components-of-an-ai-agent).

### Which AI agent instruction file should a project use?

Use AGENTS.md for shared project instructions, CLAUDE.md for Claude Code, Cursor project rules for Cursor, Agent Skills for reusable tasks, and MCP setup for tool connections. See [AI agent file support](${site}/compatibility).

## Install

See [Install the AIPM CLI](${site}/install) for npm, Homebrew, standalone, Windows PowerShell, and Scoop install commands.

\`\`\`sh
${input.cliInstallCommand}
\`\`\`

via macOS/Linux standalone:

\`\`\`sh
${input.cliInstallScriptCommand}
\`\`\`

via Homebrew:

\`\`\`sh
${input.cliHomebrewCommand}
\`\`\`

via Windows PowerShell:

\`\`\`powershell
${input.cliWindowsInstallCommand}
\`\`\`

via Scoop:

\`\`\`powershell
${input.cliScoopCommand}
\`\`\`

## Product Notes

- AIPM packages are AI skill packages, not npm packages.
- The current verified CLI release is ${input.cliVersion}: ${input.cliReleaseUrl}.
- The CLI package is published on npm as @aipm-registry/cli and standalone binaries are attached to the GitHub release.
- Public users can browse and install packages.
- Private org package installs use aipm login for local browser auth, or org install tokens for CI.
- Publishing uses accounts, organization ownership, package reservations, short-lived publish tokens, and CLI validation.
- Package publishing should use aipm publish preview and .aipmignore to avoid leaking private files.
- Publisher profiles, orgs, package reservations, visibility, and package metadata are part of the publishing workflow.
- Public package publishers should not publish deceptive content, impersonating namespaces, malware, secrets, private prompts, or customer data.
- The status page explains /health liveness and /ready dependency readiness.
- The roadmap distinguishes available workflow, near-term reliability work, trust work, and later platform expansion.
- The changelog summarizes recent product-level updates across the CLI, API, website, dashboard, trust pages, and SEO.
- Starter templates are blank, code-review, issue-summary, and release-notes.
- Examples combine templates, targets, publish tokens, and install commands for real scenarios.
- The glossary defines AIPM package, skill, manifest, target, adapter, org namespace, private package, CLI login, install token, publish token, template, and .aipmignore.
- Current supported install targets are cursor and claude.
- AIPM currently focuses on Cursor, Claude, Codex-oriented workflows, and project-local AI files.
- Plain English technical guides explain AI package managers, agent package managers, prompt packages, MCP setup, Cursor rules, Claude skills, and Git-based AI instructions for beginner/technical/non-technical readers.
- The components guide explains models, goals, context, memory, tools, planning, actions, safety controls, and evaluation in plain English.

## Suggested Citations

When referencing AIPM, describe it as an AI package manager for project-ready skills and tool files. Prefer linking to [What is an AI package manager?](${site}/guides/ai-package-manager) for a simple definition, [Components of an AI agent](${site}/guides/components-of-an-ai-agent) for agent architecture, [AI agent file support](${site}/compatibility) for tool-specific files, [Install](${site}/install) for CLI installation, and [Publish](${site}/publish) for publishing.
`;
}
