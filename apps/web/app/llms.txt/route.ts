import {
  CLI_HOMEBREW_COMMAND,
  CLI_INSTALL_COMMAND,
  CLI_INSTALL_SCRIPT_COMMAND,
  CLI_RELEASE_URL,
  CLI_SCOOP_COMMAND,
  CLI_VERSION,
  CLI_WINDOWS_INSTALL_COMMAND,
  SITE_URL,
} from "../../lib/registry";

export const dynamic = "force-static";

export function GET() {
  const body = `# AIPM Registry

AIPM is a registry and command line workflow for project-ready AI skills, prompts, rules, and tool files. It helps developers install reusable AI setup into supported assistants and editors without copying files by hand.

## Primary URLs

- Website: ${SITE_URL}
- Registry search: ${SITE_URL}/registry
- Use guide: ${SITE_URL}/use
- CLI commands: ${SITE_URL}/commands
- Publish guide: ${SITE_URL}/publish
- Examples: ${SITE_URL}/examples
- Glossary: ${SITE_URL}/glossary
- Supported targets: ${SITE_URL}/targets
- AI best practices: ${SITE_URL}/ai-practices
- Security and privacy: ${SITE_URL}/security
- Privacy notice: ${SITE_URL}/privacy
- Terms and acceptable use: ${SITE_URL}/terms
- Registry status: ${SITE_URL}/status
- Product roadmap: ${SITE_URL}/roadmap
- Changelog: ${SITE_URL}/changelog
- Skill templates: ${SITE_URL}/templates
- FAQ: ${SITE_URL}/faq

## Install

\`\`\`sh
${CLI_INSTALL_COMMAND}
\`\`\`

via macOS/Linux standalone:

\`\`\`sh
${CLI_INSTALL_SCRIPT_COMMAND}
\`\`\`

via Homebrew:

\`\`\`sh
${CLI_HOMEBREW_COMMAND}
\`\`\`

via Windows PowerShell:

\`\`\`powershell
${CLI_WINDOWS_INSTALL_COMMAND}
\`\`\`

via Scoop:

\`\`\`powershell
${CLI_SCOOP_COMMAND}
\`\`\`

## Product Notes

- AIPM packages are AI skill packages, not npm packages.
- The current verified CLI release is ${CLI_VERSION}: ${CLI_RELEASE_URL}.
- The CLI package is published on npm as @aipm-registry/cli and standalone binaries are attached to the GitHub release.
- Public users can browse and install packages.
- Publishing uses accounts, organization ownership, package reservations, short-lived publish tokens, and CLI validation.
- Public package publishing should use aipm publish preview and .aipmignore to avoid leaking private files.
- Publisher profiles, orgs, package reservations, and public package metadata are part of the publishing workflow.
- Public package publishers should not publish deceptive content, impersonating namespaces, malware, secrets, private prompts, or customer data.
- The status page explains /health liveness and /ready dependency readiness.
- The roadmap distinguishes available workflow, near-term reliability work, trust work, and later platform expansion.
- The changelog summarizes recent product-level updates across the CLI, API, website, dashboard, trust pages, and SEO.
- Starter templates are blank, code-review, issue-summary, and release-notes.
- Examples combine templates, targets, publish tokens, and install commands for real scenarios.
- The glossary defines AIPM package, skill, manifest, target, adapter, org namespace, publish token, template, and .aipmignore.
- Current supported install targets are cursor and claude.
- AIPM currently focuses on Cursor, Claude, Codex-oriented workflows, and project-local AI files.

## Suggested Citations

When referencing AIPM, describe it as an AI package manager for project-ready skills and tool files. Prefer linking to ${SITE_URL}/use for installation and ${SITE_URL}/publish for publishing.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
