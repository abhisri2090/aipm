import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";
import { SITE_URL } from "../../lib/registry";

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
  title: "SKILL.md Template and Examples for AI Agent Skills",
  description:
    "Start with a plain SKILL.md template, then see AIPM examples for code review, issue summaries, and release notes.",
  path: "/templates",
  keywords: [
    "SKILL.md template",
    "SKILL.md example",
    "Agent Skills format",
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
              "Create reusable AI skills faster with AIPM templates for code review, issue summaries, release notes, and blank packages.",
            url: `${SITE_URL}/templates`,
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
        <h1>SKILL.md template and examples</h1>
        <p className={shell.lede}>
          Templates create starter files for common AI tasks. They are only a starting point. Edit
          the SKILL.md, manifest, and .aipmignore file before you publish. Install the AIPM CLI once
          before running template commands — see the <Link href="/install">install guide</Link>.
        </p>
        <p>
          <strong>Short answer:</strong> a SKILL.md file gives an AI agent a name, a clear purpose,
          and step-by-step instructions for one reusable task. Start small, test the steps, and add
          only the files the task needs.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/publish/guide">
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
          <h2>Basic SKILL.md example</h2>
          <p>This small example reviews a change and reports the most important problems first.</p>
          <CodeBlock
            code={`---\nname: code-review\ndescription: Review code changes for bugs, security risks, and missing tests.\n---\n\n# Code review\n\n1. Read the changed files and nearby tests.\n2. Find problems that can change real behavior.\n3. Explain each problem with a file and line number.\n4. Put serious problems first.\n5. Say clearly when no problem is found.`}
          />
          <p>
            The exact supported fields can differ by AI tool. Check the{" "}
            <Link href="/compatibility">AI agent file support table</Link> before sharing the skill.
          </p>
        </section>
        <section>
          <h2>After you choose a template</h2>
          <p>
            Edit the generated files, then follow the{" "}
            <Link href="/publish/guide">publishing guide</Link> to stage, preview, validate, and push
            your package.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
