export const POPULAR_SKILL_PROMPTS: Record<string, string> = {
  "@aipm-starters/code-review": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a code review assistant skill named @my-org/code-review (change the scope to my org).

The skill helps an AI review pull requests and local diffs for correctness, regressions, security risk, missing tests, and unclear ownership.

In skill.md include:
- When to use: PR review, pre-merge check, or reviewing staged changes
- Workflow: read the diff first, map changed areas to risk, then review in priority order (correctness → security → tests → maintainability)
- Required inputs: diff or file list, optional PR description and test command
- Output format with sections: Summary, Blockers, Warnings, Suggestions, Test gaps, Questions for author
- Explicit review checklist: logic errors, edge cases, error handling, auth/data access, breaking API changes, observability, docs updates
- Rules: cite file paths and lines, do not rewrite large chunks unless asked, separate must-fix from nice-to-have

Add 2 example user prompts. Keep examples generic with no secrets. Use targets cursor and claude. License MIT.`,

  "@aipm-starters/test-writer": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a test writer skill named @my-org/test-writer.

The skill generates focused unit, integration, and regression tests from changed files, bug reports, or described behavior.

In skill.md include:
- When to use: after feature work, bug fixes, or when coverage is missing on touched code
- Workflow: understand behavior first, identify boundaries and failure modes, pick the smallest test type that proves the change, then write tests matching the repo's framework
- Required inputs: files or behavior to cover, existing test patterns in repo, test runner command
- Output format: Test plan (cases table), then test code with file paths, then commands to run tests
- Quality bar: deterministic tests, no flaky timing, meaningful assertions, arrange-act-act structure, mock only at boundaries
- Rules: follow project conventions, do not delete unrelated tests, prefer extending existing suites

Add 2 example invocations. Targets cursor, claude, codex. License MIT.`,

  "@aipm-starters/issue-triage": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a bug triage and issue summariser named @my-org/issue-triage.

The skill turns Sentry issues, support tickets, logs, and user reports into a concise engineering handoff.

In skill.md include:
- When to use: new production error, customer report, noisy alert, or support escalation
- Workflow: extract facts → assess user impact → hypothesize root cause → propose next action and owner
- Required inputs: error message/stack trace, timestamps, environment, reproduction steps if any
- Output format: Impact, Affected users/systems, Evidence, Likely cause (ranked hypotheses), Repro steps, Next action, Urgency (P0–P3)
- Rules: separate facts from guesses, flag missing data, avoid blaming users, suggest one smallest verification step first

Add examples for a Sentry stack trace and a vague support ticket. Targets claude and codex. License MIT.`,

  "@aipm-starters/refactor-planner": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a refactor planner named @my-org/refactor-planner.

The skill plans safe refactors before any code edits: map dependencies, define increments, and produce a verification plan.

In skill.md include:
- When to use: large rename, module extraction, API cleanup, or tech-debt reduction
- Workflow: inventory current behavior → draw dependency map → propose incremental steps → define rollback and verification per step
- Required inputs: goal, scope boundaries, constraints (deadline, no behavior change, etc.)
- Output format: Current state, Target state, Risks, Step-by-step plan (small PR-sized chunks), Verification checklist, Out of scope
- Hard rules: no code changes in planning mode unless user explicitly asks; each step must be independently shippable

Add an example for extracting a god-module into services. Targets cursor, claude, codex. License MIT.`,

  "@aipm-starters/repo-onboarding": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a repository onboarding skill named @my-org/repo-onboarding.

The skill orients new contributors and AI agents to a codebase: architecture, folders, setup, test commands, release flow, and common traps.

In skill.md include:
- When to use: first day on repo, returning after months away, or before making cross-cutting changes
- Workflow: scan top-level docs → map directory purposes → extract dev commands → identify extension points and forbidden areas
- Required inputs: access to repo root; optionally the user's role (frontend, infra, etc.)
- Output format: Quick start commands, Architecture map, Key folders, How to run tests/lint/build, Release/deploy notes, Common pitfalls, Where to ask questions
- Rules: prefer citing real paths from the repo, mark uncertainty clearly, do not invent scripts that do not exist

Add an example prompt for a new engineer joining the project. Targets cursor, claude, codex. License MIT.`,

  "@aipm-starters/api-integration": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for an API integration helper named @my-org/api-integration.

The skill guides adding or changing API clients: schema validation, retries, auth, error states, and integration tests.

In skill.md include:
- When to use: new third-party API, endpoint change, webhook handler, or client SDK work
- Workflow: read API contract → model request/response types → implement client with timeouts/retries → handle errors explicitly → add tests at boundary
- Required inputs: API docs or OpenAPI snippet, auth method, success and failure examples
- Output format: Integration plan, Types/schema, Client interface, Error mapping table, Test matrix, Rollout notes
- Rules: never log secrets, use idempotency where relevant, distinguish retryable vs fatal errors

Add examples for REST JSON API and webhook verification. Targets cursor, claude, codex. License MIT.`,

  "@aipm-starters/frontend-ux-review": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a frontend UX reviewer named @my-org/frontend-ux-review.

The skill reviews UI for responsive layout, spacing, empty/loading/error states, and production polish.

In skill.md include:
- When to use: before shipping UI, after AI-generated components, or during design QA
- Workflow: identify viewport breakpoints → walk primary user flows → check states (empty, loading, error, success) → note visual hierarchy and copy clarity
- Required inputs: page or component to review, target breakpoints, brand constraints if any
- Output format: UX summary, Issues by severity, Screens/states missing, Copy tweaks, Responsive notes, Quick wins
- Checklist: alignment, spacing rhythm, tap targets, truncation, focus order basics, skeleton/empty states

Add example for reviewing a dashboard page. Targets cursor and codex. License MIT.`,

  "@aipm-starters/accessibility-checker": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for an accessibility checker named @my-org/accessibility-checker.

The skill reviews semantic markup, labels, keyboard flow, contrast, headings, focus, and screen-reader usability.

In skill.md include:
- When to use: new forms, navigation, modals, or before accessibility sign-off
- Workflow: structure (headings/landmarks) → forms/labels → keyboard → focus visibility → color/contrast → announcements/live regions
- Required inputs: component or page markup, design tokens if available
- Output format: A11y summary, WCAG-oriented findings (level A/AA where applicable), Fix suggestions with code snippets, Manual test steps
- Rules: prefer semantic HTML, do not rely on color alone, ensure keyboard path matches visual path

Add examples for a form and a modal dialog. Targets cursor and codex. License MIT.`,

  "@aipm-starters/security-audit": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a security audit skill named @my-org/security-audit.

The skill scans changes for leaked secrets, unsafe auth, exposed admin routes, injection risks, and risky dependencies.

In skill.md include:
- When to use: pre-release review, after AI-generated auth code, or onboarding a new service
- Workflow: secrets scan mindset → authz/authn paths → input validation → dependency review → logging/PII exposure
- Required inputs: diff or directories in scope, deployment model (public internet vs internal)
- Output format: Risk summary, Critical/High/Medium findings, Evidence with file references, Remediation steps, Residual risk
- Rules: no exploit instructions, flag false positives, recommend least-privilege fixes

Add examples for reviewing an auth middleware change and a new API route. Targets cursor, claude, codex. License MIT.`,

  "@aipm-starters/release-notes": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a release notes writer named @my-org/release-notes.

The skill turns commits, PRs, and issue lists into user-facing release notes with upgrade guidance.

In skill.md include:
- When to use: tagging a release, publishing changelog, or customer comms
- Workflow: group changes by user impact → de-jargon engineering terms → highlight breaking changes and migrations → list known issues
- Required inputs: commit range, PR titles, optional issue tracker export
- Output format: Release title/version, Highlights, New features, Fixes, Breaking changes, Upgrade notes, Known issues
- Rules: audience is users/operators not engineers, omit internal refactors unless user-visible

Add example using a fictional v1.2.0 with one breaking API change. Targets claude and codex. License MIT.`,

  "@aipm-starters/seo-review": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for an SEO content reviewer named @my-org/seo-review.

The skill reviews pages for titles, meta descriptions, heading hierarchy, structured data, canonical URLs, internal links, and search intent match.

In skill.md include:
- When to use: new marketing/docs pages, before launch, or after major content rewrites
- Workflow: intent match → on-page elements → technical SEO basics → internal linking → snippet preview
- Required inputs: URL path, page content or outline, target keyword/intent
- Output format: Intent fit score (qualitative), Title/meta suggestions, Heading outline fixes, Schema recommendations, Linking gaps, Action list
- Rules: no keyword stuffing, prioritize clarity and click-worthy accurate titles

Add example for a product docs landing page. Targets cursor and codex. License MIT.`,

  "@aipm-starters/docs-maintainer": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a documentation maintainer named @my-org/docs-maintainer.

The skill keeps READMEs, changelogs, runbooks, examples, and onboarding docs aligned with code changes.

In skill.md include:
- When to use: after feature merges, API changes, CLI flag changes, or setup steps that drifted
- Workflow: diff code vs docs → list stale sections → update minimal accurate docs → verify commands still run
- Required inputs: what changed, affected docs paths, target audience
- Output format: Doc drift report, Proposed edits by file, New sections needed, Commands to verify
- Rules: do not document unimplemented behavior, keep examples runnable, match repo tone

Add example after adding a new environment variable. Targets cursor, claude, codex. License MIT.`,

  "@aipm-starters/mcp-setup": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for an MCP server setup skill named @my-org/mcp-setup.

The skill helps install, configure, and document Model Context Protocol servers: tools, resources, prompts, permissions, and verification.

In skill.md include:
- When to use: adding Jira/GitHub/DB/browser MCP to a project or team template
- Workflow: choose server → define env vars → configure client JSON → least-privilege scopes → smoke test tools → document for teammates
- Required inputs: target MCP server, client (Cursor/Claude/Codex), required operations
- Output format: Prereqs, Config snippets (placeholders for secrets), Permission checklist, Verification steps, Troubleshooting
- Rules: never commit tokens, separate dev vs prod configs, document which tools are read-only

Add example configuring a read-only GitHub MCP server. Targets claude and codex. License MIT.`,

  "@aipm-starters/browser-test-runner": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a browser test runner skill named @my-org/browser-test-runner.

The skill runs local web flows, inspects key paths, captures screenshots, and reports visual or interaction problems.

In skill.md include:
- When to use: UI regression check, before demo, or validating AI-built frontend
- Workflow: define critical flows → open app at local URL → exercise flows → capture evidence → report defects with repro steps
- Required inputs: base URL, auth steps if needed, flows to test, viewport sizes
- Output format: Flow results table, Screenshots notes, Defects by severity, Console/network anomalies, Retest checklist
- Rules: do not mutate production data, prefer stable selectors, note flaky steps

Add example testing login and settings page. Target codex. License MIT.`,

  "@aipm-starters/db-migration-review": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a database migration reviewer named @my-org/db-migration-review.

The skill reviews migrations for locks, rollbacks, indexes, nullability, backfills, and safe deploy order.

In skill.md include:
- When to use: before merging schema changes or running prod migrations
- Workflow: classify change (expand/contract) → estimate lock/time risk → check rollback story → validate indexes and constraints → plan backfill batching
- Required inputs: migration SQL/ORM diff, table sizes estimate, deployment pattern (blue/green, etc.)
- Output format: Migration summary, Risk level, Lock/downtime notes, Rollback plan, Recommended deploy order, Checklist pass/fail
- Rules: prefer additive migrations first, warn on table scans, flag destructive drops without backup plan

Add example reviewing adding a non-null column to a large table. Targets cursor, claude, codex. License MIT.`,

  "@aipm-starters/spreadsheet-analyst": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a spreadsheet analyst named @my-org/spreadsheet-analyst.

The skill analyzes CSV/XLSX data: normalize columns, summarize trends, suggest formulas, and prepare chart-ready outputs.

In skill.md include:
- When to use: ops reports, funnel exports, finance snapshots, or ad hoc data questions
- Workflow: profile columns → clean types and nulls → answer the question → show reproducible steps → suggest charts
- Required inputs: file description or sample rows, business question, desired output (table, pivot, chart spec)
- Output format: Data quality notes, Key findings, Recommended formulas/columns, Chart suggestions, Caveats
- Rules: state assumptions, avoid PII in examples, prefer transparent calculations over black-box summaries

Add example analyzing monthly signup CSV. Targets claude and codex. License MIT.`,

  "@aipm-starters/presentation-builder": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for a presentation builder named @my-org/presentation-builder.

The skill turns notes, specs, or reports into crisp slide outlines with audience, narrative arc, and visual QA guidance.

In skill.md include:
- When to use: exec update, launch recap, technical deep dive, or customer pitch
- Workflow: clarify audience and goal → craft narrative (problem → insight → plan → ask) → slide-by-slide outline → speaker notes → visual guidance
- Required inputs: source material, audience, time limit, tone (formal/casual)
- Output format: Talk track summary, Slide outline (title + bullets + speaker notes), Visual suggestions, Timing estimate
- Rules: one idea per slide, minimize dense text, flag where diagrams beat bullets

Add example turning a project retrospective into a 10-slide deck. Targets claude and codex. License MIT.`,

  "@aipm-starters/image-prompt-designer": `Create an AIPM skill package I can publish with aipm publish. Generate aipm.manifest.json and skill.md for an image prompt designer named @my-org/image-prompt-designer.

The skill creates visual prompts, style constraints, asset briefs, and review checklists for generated images.

In skill.md include:
- When to use: marketing assets, UI illustrations, icons, or brand-consistent imagery
- Workflow: define subject and purpose → lock style constraints → write positive/negative prompt → specify composition/lighting → add QA checklist for outputs
- Required inputs: asset purpose, brand adjectives, dimensions/aspect ratio, must-include/must-avoid elements
- Output format: Creative brief, Primary prompt, Variations, Negative prompt, Style reference notes, QA checklist (brand, text legibility, artifacts)
- Rules: avoid copyrighted characters, no misleading imagery, prefer inclusive representation when people appear

Add examples for a SaaS hero illustration and a simple icon. Targets claude and codex. License MIT.`,
};
