import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";

const targets = [
  {
    name: "Cursor",
    value: "cursor",
    detect: ".cursor/",
    writes: ".cursor/aipm/skills/<skill>.md",
    command: "aipm add @scope/name@1.0.0 --target cursor --ci",
    note: "Use this when the skill should become a project-local Cursor skill file.",
  },
  {
    name: "Claude",
    value: "claude",
    detect: ".claude/",
    writes: ".claude/aipm/skills/<skill>/SKILL.md",
    command: "aipm add @scope/name@1.0.0 --target claude --ci",
    note: "Use this when the skill should become a Claude project skill folder.",
  },
];

export const metadata = pageMetadata({
  title: "AIPM Supported Targets",
  description:
    "Understand AIPM supported targets, adapters, install paths, and manifest target values for Cursor and Claude skills.",
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
              "Understand AIPM supported targets, adapters, install paths, and manifest target values for Cursor and Claude skills.",
            url: "https://aipm-registry.com/targets",
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
        <h1>Install each AI skill into the tool that can actually use it.</h1>
        <p className={shell.lede}>
          A target is the AI tool adapter AIPM should use for installation. Packages declare one or
          more targets in the manifest, and users can choose a target explicitly with the CLI.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/registry">
            Browse by target
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/examples">
            Examples
          </Link>
        </div>
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
            <CodeBlock code={target.command} />
          </article>
        ))}
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Publisher manifest examples</h2>
          <div className={cards.exampleGrid}>
            <article className={cards.exampleCard}>
              <h3>Cursor-only</h3>
              <CodeBlock code={`"targets": ["cursor"]`} />
              <p>Writes Cursor-compatible files only.</p>
            </article>
            <article className={cards.exampleCard}>
              <h3>Claude-only</h3>
              <CodeBlock code={`"targets": ["claude"]`} />
              <p>Targets Claude project skill folders only.</p>
            </article>
            <article className={cards.exampleCard}>
              <h3>Multi-tool</h3>
              <CodeBlock code={`"targets": ["cursor", "claude"]`} />
              <p>Installs the same package into multiple AI tools.</p>
            </article>
          </div>
        </section>

        <section>
          <h2>When detection is not enough</h2>
          <p>
            AIPM can detect `.cursor/` and `.claude/` folders in a project. In CI or ambiguous
            projects, pass `--target cursor` or `--target claude` so installation is explicit.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
