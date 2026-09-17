import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";
import { SITE_URL } from "../../lib/registry";

const targets = [
  {
    name: "Cursor",
    value: "cursor",
    detect: ".cursor/",
    writes: ".cursor/aipm/skills/<skill>.md",
    command: "aipm add @scope/name@1.0.0 --target cursor --ci",
    note: "Use this when you want the skill installed as a Cursor file in this project.",
  },
  {
    name: "Claude",
    value: "claude",
    detect: ".claude/",
    writes: ".claude/aipm/skills/<skill>/SKILL.md",
    command: "aipm add @scope/name@1.0.0 --target claude --ci",
    note: "Use this when you want the skill installed as a Claude project skill folder.",
  },
];

export const metadata = pageMetadata({
  title: "AIPM Supported Targets",
  description:
    "Learn where AIPM installs skills for Cursor and Claude.",
  path: "/targets",
  keywords: [
    "AIPM targets",
    "AIPM adapters",
    "Cursor skill install",
    "Claude skill install",
    "AI tool targets",
  ],
});

export default function TargetsPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AIPM Supported Targets",
            description:
              "Learn where AIPM installs skills for Cursor and Claude.",
            url: `${SITE_URL}/targets`,
            hasPart: targets.map((target) => ({
              "@type": "SoftwareApplication",
              name: `${target.name} AIPM target`,
              applicationCategory: "DeveloperApplication",
            })),
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Targets</p>
        <h1>Choose where AIPM should install a skill.</h1>
        <p className={shell.lede}>
          A target is the AI tool you want to install into, such as Cursor or Claude. Packages list
          the targets they support, and you choose one with the CLI.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/registry">
            Browse skills
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/examples">
            See examples
          </Link>
        </div>
      </section>

      <section className={shell.panelSection}>
        <h2>How target detection works</h2>
        <p>
          AIPM automatically detects the AI tool in your project and installs the skill in the matching
          location. Detection looks for tool-specific directories in your project root. If AIPM finds
          a <code>.cursor/</code> folder, it knows your project uses Cursor. If it finds <code>.claude/</code>,
          it targets Claude Code.
        </p>
        <p>
          When your project uses multiple AI tools, or when you want to override automatic detection,
          use <code>--target cursor</code> or <code>--target claude</code> with <code>aipm add</code>.
          The target flag tells AIPM exactly where to write the skill files.
        </p>
        <p>
          Some packages support only one target, while others include files for multiple AI tools. The package
          page shows which targets are available. If you request a target the package does not support,
          AIPM will report an error and suggest available options.
        </p>
      </section>

      <section className={cards.targetGrid} aria-label="Supported AIPM targets">
        {targets.map((target) => (
          <article className={cards.targetCard} key={target.value}>
            <p className={shell.eyebrow}>{target.value}</p>
            <h2>{target.name}</h2>
            <p>{target.note}</p>
            <dl>
              <div>
                <dt>Detected by</dt>
                <dd>{target.detect}</dd>
              </div>
              <div>
                <dt>Writes to</dt>
                <dd>{target.writes}</dd>
              </div>
            </dl>
            <p>Use this command to force installation into the {target.name} target.</p>
            <CodeBlock code={target.command} />
          </article>
        ))}
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Publishing for multiple targets</h2>
          <p>
            When you publish a package, you declare which targets it supports in the manifest file.
            Each target can have different files or the same content adapted for that AI tool&apos;s format.
            AIPM validates that your package includes the required files for each declared target.
          </p>
        </section>

        <section>
          <h2>Manifest examples</h2>
          <div className={cards.exampleGrid}>
            <article className={cards.exampleCard}>
              <h3>Cursor-only</h3>
              <CodeBlock code={`"targets": ["cursor"]`} />
              <p>Installs only Cursor files.</p>
            </article>
            <article className={cards.exampleCard}>
              <h3>Claude-only</h3>
              <CodeBlock code={`"targets": ["claude"]`} />
              <p>Installs only Claude project skill folders.</p>
            </article>
            <article className={cards.exampleCard}>
              <h3>Multi-tool</h3>
              <CodeBlock code={`"targets": ["cursor", "claude"]`} />
              <p>Installs the same package into multiple AI tools.</p>
            </article>
          </div>
        </section>

        <section>
          <h2>Future targets</h2>
          <p>
            AIPM is designed to support additional AI tools as they adopt file-based skill formats.
            The target system is extensible, so new tools can be added without changing the core CLI
            or registry. Follow the <Link href="/roadmap">roadmap</Link> for updates on new target support.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
