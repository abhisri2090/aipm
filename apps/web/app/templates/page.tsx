import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";

const templates = [
  {
    name: "Blank",
    value: "blank",
    command: "aipm publish init --name @team/my-skill --template blank",
    bestFor: "custom skills when you already know what files you need",
    includes: ["minimal SKILL.md", "manifest", ".aipmignore"],
  },
  {
    name: "Code review",
    value: "code-review",
    command: "aipm publish init --name @team/review-helper --template code-review",
    bestFor: "pull request reviews and code quality checks",
    includes: ["review goals", "checklist", "format for findings"],
  },
  {
    name: "Issue summary",
    value: "issue-summary",
    command: "aipm publish init --name @team/issue-summary --template issue-summary",
    bestFor: "bug triage, Sentry summaries, support tickets, and handoff notes",
    includes: ["impact", "evidence", "likely cause", "next action"],
  },
  {
    name: "Release notes",
    value: "release-notes",
    command: "aipm publish init --name @team/release-notes --template release-notes",
    bestFor: "release summaries, upgrade notes, and known issues",
    includes: ["highlights", "fixes", "upgrade notes", "known issues"],
  },
];

export const metadata = pageMetadata({
  title: "AIPM Skill Templates",
  description:
    "Choose a starter template for an AIPM skill.",
  path: "/templates",
  keywords: [
    "AIPM templates",
    "AI skill templates",
    "code review skill",
    "issue summary skill",
    "release notes skill",
    "AI package starter",
  ],
});

export default function TemplatesPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AIPM Skill Templates",
            description:
              "Choose a starter template for an AIPM skill.",
            url: "https://aipm-registry.com/templates",
            hasPart: templates.map((template) => ({
              "@type": "HowTo",
              name: `${template.name} AIPM template`,
              text: template.command,
            })),
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Templates</p>
        <h1>Start with a template, then edit it.</h1>
        <p className={shell.lede}>
          Templates create starter files for common AI tasks. They are only a starting point. Edit
          the SKILL.md, manifest, and .aipmignore file before you publish.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/publish">
            Read publishing guide
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/examples">
            Examples
          </Link>
        </div>
      </section>

      <section className={cards.templateGrid} aria-label="AIPM starter templates">
        {templates.map((template) => (
          <article className={cards.templateCard} key={template.value}>
            <p className={shell.eyebrow}>{template.value}</p>
            <h2>{template.name}</h2>
            <p>{template.bestFor}</p>
            <CodeBlock code={template.command} />
            <h3>Starts with</h3>
            <ul className={docs.checkList}>
              {template.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>After you choose a template</h2>
          <CodeBlock
            code={`cd review-helper
aipm publish add .
aipm publish preview # (optional)
aipm publish validate # (optional)
AIPM_TOKEN=<5-minute-token> aipm publish push --yes`}
          />
        </section>
      </article>
    </DocLayout>
  );
}
