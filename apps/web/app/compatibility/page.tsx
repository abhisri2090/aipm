import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { cards, cn, docs, shell } from "../../lib/page-styles";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";
import styles from "./compatibility.module.css";

export const metadata = pageMetadata({
  title: "AI Agent File Support for Cursor, Claude and Codex",
  description:
    "See which AI agent files work with Cursor, Claude Code, and Codex. Compare AGENTS.md, CLAUDE.md, Cursor rules, Agent Skills, and MCP setup.",
  path: "/compatibility",
  keywords: [
    "AI agent configuration compatibility",
    "AGENTS.md compatibility",
    "CLAUDE.md Cursor Codex",
    "Cursor rules vs Claude skills",
    "AI coding agent configuration matrix",
    "AI agent file support",
  ],
});

const VERIFIED_ON = "2026-08-31";

const rows = [
  {
    format: "AGENTS.md",
    purpose: "Project instructions written as a normal text file.",
    cursor: "Supported for simple project-wide instructions.",
    claude: "Use CLAUDE.md instead for Claude Code.",
    codex: "Supported. Instructions can apply to a folder and its subfolders.",
    share: "Yes. Keep it in Git with the project.",
  },
  {
    format: "CLAUDE.md",
    purpose: "Instructions that Claude Code reads in every work session.",
    cursor: "Not the main Cursor rules format.",
    claude: "Supported. Best for facts and rules that should always be available.",
    codex: "Use AGENTS.md instead for Codex.",
    share: "Yes. Keep the project file in Git.",
  },
  {
    format: "Cursor project rules",
    purpose: "Cursor-only instructions that can apply to certain files or tasks.",
    cursor: "Supported in the .cursor/rules folder.",
    claude: "Not a Claude Code format.",
    codex: "Not a Codex format.",
    share: "Yes. Keep the .cursor/rules folder in Git.",
  },
  {
    format: "Agent Skill",
    purpose: "A reusable task, guide, or set of steps stored with a SKILL.md file.",
    cursor: "AIPM can install Cursor-ready skill files. Check how your Cursor version loads them.",
    claude: "Supported. Claude can choose a skill or you can start it with a slash command.",
    codex: "Supported. Codex can choose a skill or use one named by the user.",
    share: "Yes. AIPM can package and install the same skill in several projects.",
  },
  {
    format: "MCP setup",
    purpose: "Settings that connect an AI tool to another tool or source of information.",
    cursor: "Supported through Cursor MCP settings.",
    claude: "Supported through Claude Code MCP settings.",
    codex: "Support depends on the Codex product and current setup.",
    share: "Share safe settings and instructions. Never share passwords or private tokens.",
  },
] as const;

export default function CompatibilityPage() {
  const canonical = `${SITE_URL}/compatibility`;

  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: "AI Agent File Support for Cursor, Claude Code, and Codex",
                description:
                  "A plain-English comparison of instruction and skill files used by Cursor, Claude Code, and Codex.",
                url: canonical,
                mainEntityOfPage: canonical,
                datePublished: VERIFIED_ON,
                dateModified: VERIFIED_ON,
                inLanguage: "en",
                author: { "@type": "Person", name: "Abhishek Srivastava" },
                publisher: { "@type": "Organization", name: "AIPM" },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "AIPM", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "AI agent file support", item: canonical },
                ],
              },
            ],
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Verified reference</p>
        <h1>Which AI agent files work with Cursor, Claude Code, and Codex?</h1>
        <p className={shell.lede}>
          Use AGENTS.md for shared project instructions, CLAUDE.md for Claude Code, Cursor project
          rules for Cursor, Agent Skills for reusable tasks, and MCP setup for tool connections.
        </p>
        <p className={styles.note}>Last checked: 31 August 2026.</p>
      </section>

      <section aria-labelledby="matrix-title" className={shell.panelSection}>
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Quick comparison</p>
            <h2 id="matrix-title">Which file works where?</h2>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th>File or setup</th>
                <th>What it does</th>
                <th>Cursor</th>
                <th>Claude Code</th>
                <th>Codex</th>
                <th>Can a team share it?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.format}>
                  <th className={styles.formatName} scope="row">{row.format}</th>
                  <td>{row.purpose}</td>
                  <td>{row.cursor}</td>
                  <td>{row.claude}</td>
                  <td>{row.codex}</td>
                  <td>{row.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          AI tools change quickly. Use the source links below to check a detail before making a large team change.
        </p>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Simple choice</h2>
          <p>Use AGENTS.md when several coding agents need the same basic project instructions.</p>
          <p>Use CLAUDE.md for instructions that only Claude Code needs.</p>
          <p>Use Cursor project rules when Cursor needs rules for certain files or tasks.</p>
          <p>Use a skill when you want the AI to repeat a useful task.</p>
          <p>Use MCP when the AI needs to connect to another tool or source of information.</p>
        </section>

        <section>
          <h2>How AIPM helps</h2>
          <p>
            AIPM does not replace these files. It helps a team package, install, and update reusable
            AI instructions. Start with the <Link href="/install">install guide</Link> or read how to{" "}
            <Link href="/guides/share-ai-coding-agent-instructions">share instructions across projects</Link>.
          </p>
        </section>

        <section>
          <h2>Primary sources</h2>
          <ul>
            <li><a href="https://docs.cursor.com/context/rules-for-ai" rel="noreferrer" target="_blank">Cursor documentation: Rules</a></li>
            <li><a href="https://code.claude.com/docs/en/features-overview" rel="noreferrer" target="_blank">Claude Code documentation: Extension features</a></li>
            <li><a href="https://code.claude.com/docs/en/slash-commands" rel="noreferrer" target="_blank">Claude Code documentation: Skills</a></li>
            <li><a href="https://openai.com/index/introducing-codex/" rel="noreferrer" target="_blank">OpenAI: Codex and AGENTS.md</a></li>
            <li><a href="https://openai.com/index/introducing-the-codex-app/" rel="noreferrer" target="_blank">OpenAI: Codex skills</a></li>
            <li><a href="https://modelcontextprotocol.io/docs/develop/connect-local-servers" rel="noreferrer" target="_blank">Model Context Protocol documentation</a></li>
          </ul>
        </section>
      </article>

      <section className={shell.panelSection} aria-labelledby="related-title">
        <div className={shell.sectionHeading}><h2 id="related-title">Related guides</h2></div>
        <div className={cards.guideGrid}>
          <Link className={cards.guideCard} href="/guides/components-of-an-ai-agent"><h2>Components of an AI agent</h2><p>Understand how models, instructions, memory, tools, actions, and safety controls work together.</p></Link>
          <Link className={cards.guideCard} href="/guides/agents-md-vs-claude-md-vs-cursor-rules"><h2>Compare instruction files</h2><p>Learn what AGENTS.md, CLAUDE.md, and Cursor rules are for.</p></Link>
          <Link className={cards.guideCard} href="/guides/claude-code-skills-vs-slash-commands"><h2>Claude skills and commands</h2><p>See how Claude Code skills and slash commands work together.</p></Link>
          <Link className={cards.guideCard} href="/guides/mcp-server-config-best-practices"><h2>MCP safety checklist</h2><p>Set up MCP connections without sharing private values.</p></Link>
        </div>
      </section>
    </DocLayout>
  );
}
