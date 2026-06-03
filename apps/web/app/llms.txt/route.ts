import { CLI_INSTALL_COMMAND, SITE_URL } from "../../lib/registry";

export const dynamic = "force-static";

export function GET() {
  const body = `# AIPM Registry

AIPM is a registry and command line workflow for project-ready AI skills, prompts, rules, and tool files. It helps developers install reusable AI setup into supported assistants and editors without copying files by hand.

## Primary URLs

- Website: ${SITE_URL}
- Registry search: ${SITE_URL}/registry
- Use guide: ${SITE_URL}/use
- Publish guide: ${SITE_URL}/publish
- AI best practices: ${SITE_URL}/ai-practices
- FAQ: ${SITE_URL}/faq

## Install

\`\`\`sh
${CLI_INSTALL_COMMAND}
\`\`\`

## Product Notes

- AIPM packages are AI skill packages, not npm packages.
- The CLI package is published on npm as @aipm-registry/cli.
- Public users can browse and install packages.
- Publishing uses accounts, organization ownership, package reservations, short-lived publish tokens, and CLI validation.
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
