import Link from "next/link";
import { CodeBlock } from "../../components/code-block";
import { shell, cards, docs, cn } from "../../lib/page-styles";
import { CLI_INSTALL_COMMAND, CLI_RELEASE_URL, CLI_VERSION, SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

const popularSkills = [
  {
    name: "Code review assistant",
    packageName: "@aipm-starters/code-review",
    category: "Engineering",
    targets: ["cursor", "claude", "codex"],
    description:
      "Review pull requests for correctness, regressions, security risk, missing tests, and unclear ownership.",
    whyPopular: "Every team reviews code, and agent output is much better when review criteria are reusable.",
  },
  {
    name: "Test writer",
    packageName: "@aipm-starters/test-writer",
    category: "Engineering",
    targets: ["cursor", "claude", "codex"],
    description:
      "Generate focused unit, integration, and regression tests from changed files, bug reports, or existing behavior.",
    whyPopular: "Testing is one of the highest-repeat development workflows for AI coding agents.",
  },
  {
    name: "Bug triage and issue summariser",
    packageName: "@aipm-starters/issue-triage",
    category: "Support",
    targets: ["claude", "codex"],
    description:
      "Turn Sentry issues, support tickets, logs, and user reports into impact, likely cause, and next action.",
    whyPopular: "It saves time before an engineer opens the codebase and gives teams consistent handoff notes.",
  },
  {
    name: "Refactor planner",
    packageName: "@aipm-starters/refactor-planner",
    category: "Engineering",
    targets: ["cursor", "claude", "codex"],
    description:
      "Ask the assistant to map dependencies, identify safe increments, and produce a verification plan before edits.",
    whyPopular: "Large refactors need planning discipline so AI agents do not make broad, risky changes.",
  },
  {
    name: "Repository onboarding",
    packageName: "@aipm-starters/repo-onboarding",
    category: "Knowledge",
    targets: ["cursor", "claude", "codex"],
    description:
      "Explain architecture, folders, local setup, test commands, release flow, and common development traps.",
    whyPopular: "New contributors and AI agents both need durable project context.",
  },
  {
    name: "API integration helper",
    packageName: "@aipm-starters/api-integration",
    category: "Engineering",
    targets: ["cursor", "claude", "codex"],
    description:
      "Guide API client changes, schema validation, retries, auth handling, error states, and integration tests.",
    whyPopular: "API work is frequent, repetitive, and easy to get wrong without local conventions.",
  },
  {
    name: "Frontend UX reviewer",
    packageName: "@aipm-starters/frontend-ux-review",
    category: "Frontend",
    targets: ["cursor", "codex"],
    description:
      "Check responsive layouts, accessibility, spacing, text overflow, empty states, and production UI polish.",
    whyPopular: "AI-built UI often needs a reusable product-quality checklist before shipping.",
  },
  {
    name: "Accessibility checker",
    packageName: "@aipm-starters/accessibility-checker",
    category: "Frontend",
    targets: ["cursor", "codex"],
    description:
      "Review semantic markup, labels, keyboard flow, color contrast, headings, focus states, and screen-reader hints.",
    whyPopular: "Accessibility rules are concrete enough to package and reuse across projects.",
  },
  {
    name: "Security audit",
    packageName: "@aipm-starters/security-audit",
    category: "Security",
    targets: ["cursor", "claude", "codex"],
    description:
      "Look for leaked secrets, unsafe auth paths, exposed admin routes, injection risks, and risky dependency usage.",
    whyPopular: "Public repos and AI-generated code both need explicit safety checks before release.",
  },
  {
    name: "Release notes writer",
    packageName: "@aipm-starters/release-notes",
    category: "Product",
    targets: ["claude", "codex"],
    description:
      "Summarize commits, PRs, fixed bugs, upgrade notes, known issues, and user-facing changes.",
    whyPopular: "Teams repeat this every release, and the output format can be standardized.",
  },
  {
    name: "SEO content reviewer",
    packageName: "@aipm-starters/seo-review",
    category: "Growth",
    targets: ["cursor", "codex"],
    description:
      "Review page titles, descriptions, headings, structured data, canonical URLs, internal links, and search intent.",
    whyPopular: "AI products need clear public docs and discoverability from day one.",
  },
  {
    name: "Documentation maintainer",
    packageName: "@aipm-starters/docs-maintainer",
    category: "Knowledge",
    targets: ["cursor", "claude", "codex"],
    description:
      "Keep READMEs, changelogs, runbooks, examples, and onboarding docs aligned with code changes.",
    whyPopular: "Documentation drift is constant, and skills make the expected style repeatable.",
  },
  {
    name: "MCP server setup",
    packageName: "@aipm-starters/mcp-setup",
    category: "Tools",
    targets: ["claude", "codex"],
    description:
      "Install and document Model Context Protocol servers, prompts, resources, tool permissions, and verification steps.",
    whyPopular: "MCP is becoming the common way to connect AI assistants to tools and context.",
  },
  {
    name: "Browser test runner",
    packageName: "@aipm-starters/browser-test-runner",
    category: "QA",
    targets: ["codex"],
    description:
      "Run local web pages, inspect key flows, capture screenshots, and report visual or interaction problems.",
    whyPopular: "Real browser checks catch layout and interaction bugs that code-only review misses.",
  },
  {
    name: "Database migration reviewer",
    packageName: "@aipm-starters/db-migration-review",
    category: "Data",
    targets: ["cursor", "claude", "codex"],
    description:
      "Review migrations for locks, rollbacks, indexes, nullability, backfills, and production deployment order.",
    whyPopular: "Database changes are high-risk and benefit from a consistent preflight checklist.",
  },
  {
    name: "Spreadsheet analyst",
    packageName: "@aipm-starters/spreadsheet-analyst",
    category: "Operations",
    targets: ["claude", "codex"],
    description:
      "Analyze CSV/XLSX files, normalize columns, build summaries, create formulas, and prepare chart-ready outputs.",
    whyPopular: "Teams use AI for lightweight analysis long before they build a formal data pipeline.",
  },
  {
    name: "Presentation builder",
    packageName: "@aipm-starters/presentation-builder",
    category: "Operations",
    targets: ["claude", "codex"],
    description:
      "Turn notes, specs, or reports into crisp slide outlines with audience, narrative, and visual QA guidance.",
    whyPopular: "Reusable presentation workflows help agents produce structured decks instead of loose summaries.",
  },
  {
    name: "Image prompt designer",
    packageName: "@aipm-starters/image-prompt-designer",
    category: "Creative",
    targets: ["claude", "codex"],
    description:
      "Create visual prompts, style constraints, asset briefs, and review checklists for generated images.",
    whyPopular: "Design and product teams need repeatable image direction, not one-off prompt guessing.",
  },
];

const sources = [
  {
    label: "Cursor Rules",
    href: "https://docs.cursor.com/context/rules-for-ai",
    note: "Project rules are reusable, version-controlled instructions for AI coding workflows.",
  },
  {
    label: "Claude Code common workflows",
    href: "https://code.claude.com/docs/en/common-workflows",
    note: "Common terminal-agent workflows include understanding code, editing, testing, and Git operations.",
  },
  {
    label: "OpenAI Codex use cases",
    href: "https://developers.openai.com/codex/explore",
    note: "Codex workflows cover production systems, web development, native development, collaboration, and saved skills.",
  },
  {
    label: "Model Context Protocol",
    href: "https://modelcontextprotocol.io/docs/learn/server-concepts",
    note: "MCP servers expose tools, resources, and prompts that AI applications can discover and use.",
  },
];

export const metadata = pageMetadata({
  title: "Popular AI Skill Ideas",
  description:
    "A curated starter catalog of popular AI skills to publish with AIPM, including code review, testing, docs, security, MCP setup, and release workflows.",
  path: "/popular-skills",
  keywords: [
    "popular AI skills",
    "AI skill ideas",
    "Cursor rules",
    "Claude Code skills",
    "Codex skills",
    "AI coding workflows",
    "MCP setup",
  ],
});

export default function PopularSkillsPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Popular AI Skill Ideas",
            description:
              "A curated starter catalog of common AI skills users can publish with AIPM.",
            url: `${SITE_URL}/popular-skills`,
            hasPart: popularSkills.map((skill) => ({
              "@type": "SoftwareSourceCode",
              name: skill.name,
              alternateName: skill.packageName,
              description: skill.description,
              applicationCategory: skill.category,
            })),
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Starter catalog</p>
        <h1>Popular AI skills worth publishing first.</h1>
        <p className={shell.lede}>
          These are practical starter package ideas for the AIPM registry. They are not copied from
          other projects. Use them as names, templates, and briefs for skills the community can
          publish and improve.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/publish">
            Publish one
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/templates">
            Use templates
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/registry">
            Browse live registry
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="popular-install-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Command pattern</p>
            <h2 id="popular-install-title">How a real package will install</h2>
          </div>
          <Link className={shell.textLink} href="/publish/guide">
            Publishing guide
          </Link>
        </div>
        <p className={shell.muted}>
          Install the current verified CLI release first: <a href={CLI_RELEASE_URL}>AIPM CLI {CLI_VERSION}</a>.
        </p>
        <CodeBlock code={CLI_INSTALL_COMMAND} />
        <p className={shell.muted}>Initialize the project, then install a package into the Cursor target.</p>
        <CodeBlock code={`aipm init\naipm add @aipm-starters/code-review --target cursor --ci`} />
      </section>

      <section className={cards.popularGrid} aria-label="Popular AI skill starter catalog">
        {popularSkills.map((skill) => (
          <article className={cards.popularCard} key={skill.packageName}>
            <div>
              <p className={shell.eyebrow}>{skill.category}</p>
              <h2>{skill.name}</h2>
              <p className={cards.packageLine}>{skill.packageName}</p>
            </div>
            <p>{skill.description}</p>
            <div className={cards.meta} aria-label={`Targets for ${skill.name}`}>
              {skill.targets.map((target) => (
                <span className={cards.pill} key={target}>
                  {target}
                </span>
              ))}
            </div>
            <p className={cards.whyLine}>{skill.whyPopular}</p>
          </article>
        ))}
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>How we chose this list</h2>
          <p>
            The list focuses on repeated workflows that AI coding tools and assistants already
            support well: reusable project rules, codebase understanding, testing, Git operations,
            browser checks, documentation, MCP setup, and structured knowledge work.
          </p>
          <p>
            The goal is to seed AIPM with useful public packages while respecting other projects.
            Before a starter becomes a live registry package, it should have original content, clear
            ownership, a license, and target-specific files that install cleanly.
          </p>
        </section>

        <section>
          <h2>Reference signals</h2>
          <div className={cards.sourceList}>
            {sources.map((source) => (
              <a className={cards.sourceCard} href={source.href} key={source.href}>
                <small>{source.label}</small>
                <span>{source.note}</span>
              </a>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
