import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";

const examples = [
  {
    title: "Code review helper for Cursor",
    scenario: "A team wants every project to use the same pull request review checklist in Cursor.",
    publish: `aipm publish init --name @team/review-helper --template code-review --targets cursor
cd review-helper
aipm publish add .
aipm publish preview # (optional)
AIPM_TOKEN=<5-minute-token> aipm publish push --yes`,
    install: "aipm add @team/review-helper@1.0.0 --target cursor --ci",
    notes: ["Best for PR review behavior", "Installs into .cursor/aipm/skills/<skill>.md"],
  },
  {
    title: "Sentry issue summariser for Claude",
    scenario: "A product engineer wants Claude to turn error reports into triage notes with impact and next action.",
    publish: `aipm publish init --name @team/sentry-issue-summary --template issue-summary --targets claude
cd sentry-issue-summary
aipm publish add .
aipm publish validate # (optional)
AIPM_TOKEN=<5-minute-token> aipm publish push --yes`,
    install: "aipm add @team/sentry-issue-summary@1.0.0 --target claude --ci",
    notes: ["Best for incidents, support, and bug triage", "Installs into .claude/aipm/skills/<skill>/SKILL.md"],
  },
  {
    title: "Release notes skill for Cursor and Claude",
    scenario: "A maintainer wants one skill that helps both tools draft user-facing release notes.",
    publish: `aipm publish init --name @team/release-notes --template release-notes --targets cursor,claude
cd release-notes
aipm publish add .
aipm publish preview # (optional)
AIPM_TOKEN=<5-minute-token> aipm publish push --yes`,
    install: `aipm add @team/release-notes@1.0.0 --target cursor --ci
aipm add @team/release-notes@1.0.0 --target claude --ci`,
    notes: ["Best for multi-tool teams", "Manifest should include both cursor and claude targets"],
  },
  {
    title: "Import an existing Codex skill folder",
    scenario: "A user already has a local skill folder and wants to publish it as an AIPM package.",
    publish: `aipm publish import ~/.codex/skills/review-helper --name @team/review-helper
cd review-helper
aipm publish add .
aipm publish preview # (optional)
AIPM_TOKEN=<5-minute-token> aipm publish push --yes`,
    install: "aipm add @team/review-helper@1.0.0 --target cursor --ci",
    notes: ["Best when an AI tool created the first draft", "Review .aipmignore before staging imported files"],
  },
];

export const metadata = pageMetadata({
  title: "AIPM Skill Examples",
  description:
    "Real AIPM publishing and install examples for code review, issue summaries, release notes, multi-tool skills, and imported AI skill folders.",
  path: "/examples",
  keywords: [
    "AIPM examples",
    "AI skill examples",
    "Cursor skill example",
    "Claude skill example",
    "publish AI skill",
    "AIPM install example",
  ],
});

export default function ExamplesPage() {
  return (
    <DocLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AIPM Skill Examples",
            description:
              "Real AIPM publishing and install examples for code review, issue summaries, release notes, multi-tool skills, and imported AI skill folders.",
            url: "https://aipm-registry.com/examples",
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Examples</p>
        <h1>Copy a complete AIPM workflow for a real skill scenario.</h1>
        <p className={shell.lede}>
          These examples combine templates, targets, staging, publish tokens, and install commands
          so you can see the whole flow before creating your first package.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/templates">
            Templates
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/targets">
            Targets
          </Link>
        </div>
      </section>

      <section className={cards.exampleList} aria-label="AIPM publishing examples">
        {examples.map((example) => (
          <article className={cards.exampleCard} key={example.title}>
            <h2>{example.title}</h2>
            <p>{example.scenario}</p>
            <h3>Publish</h3>
            <CodeBlock code={example.publish} />
            <h3>Install</h3>
            <CodeBlock code={example.install} />
            <ul className={docs.checkList}>
              {example.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
