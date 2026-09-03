# SEO Query-to-Page Map

Each search intent has one preferred landing page. Closely related wording belongs on the same page rather than on separate near-duplicate pages.

| Search intent | Primary page | Supporting pages |
| --- | --- | --- |
| AI package manager and AI skills package manager | `/` | `/guides/ai-package-manager`, `/guides/agent-package-manager` |
| Agent skills marketplace, registry, library, and repository | `/skills` | Skill category and package pages |
| Claude Code skills marketplace, library, and installation | `/skills/claude` | `/guides/claude-code-skills-guide`, `/guides/how-to-install-claude-code-skills` |
| Cursor skills | `/skills/cursor` | `/guides/how-to-install-cursor-skills` |
| Cursor rules vs Agent Skills | `/guides/cursor-rules-vs-agent-skills` | `/skills/cursor`, `/guides/cursor-rules-best-practices` |
| AGENTS.md vs SKILL.md | `/guides/agents-md-vs-skill-md` | `/guides/ai-agent-configuration-files` |
| SKILL.md templates, examples, and format | `/templates` | `/guides/how-to-create-agent-skill`, `/publish/guide` |
| MCP package and configuration management | `/guides/mcp-package-manager` | `/guides/mcp-json-guide-cursor-claude`, `/guides/package-mcp-server-setup` |
| Publish an AI skill | `/publish` | `/publish/guide`, `/examples` |
| AIPM installation | `/install` | `/commands`, `/use` |
| Agent Skills research, compatibility, and security | `/research/state-of-agent-skills-2026` | `/compatibility`, `/security` |

## Supporting Routes

- `/registry` remains the interactive package-search route but is not a search landing page.
- Search and filter query parameters point back to their unfiltered canonical collection page.
- Individual prompt, package, and publisher URLs may be indexed only when they contain meaningful public information.

## Review Rule

Before adding a new landing page, confirm that its intent is different from every page above. If it is only another wording of an existing question, improve the existing page instead.
