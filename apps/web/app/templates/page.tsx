import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";

const templates = [
  {
    name: "Blank",
    value: "blank",
    command: "aipm publish init --name @team/my-skill --template blank",
    bestFor: "custom skills where you already know the structure",
    includes: ["minimal SKILL.md", "manifest", ".aipmignore"],
  },
  {
    name: "Code review",
    value: "code-review",
    command: "aipm publish init --name @team/review-helper --template code-review",
    bestFor: "pull request review, code quality checks, and findings-first assistant output",
    includes: ["review goals", "checklist", "findings format"],
  },
  {
    name: "Issue summary",
    value: "issue-summary",
    command: "aipm publish init --name @team/issue-summary --template issue-summary",
    bestFor: "bug triage, Sentry summaries, support tickets, and incident handoff notes",
    includes: ["impact", "evidence", "likely cause", "next action"],
  },
  {
    name: "Release notes",
    value: "release-notes",
    command: "aipm publish init --name @team/release-notes --template release-notes",
    bestFor: "user-facing release summaries, upgrade notes, and known issue sections",
    includes: ["highlights", "fixes", "upgrade notes", "known issues"],
  },
];

export const metadata = pageMetadata({
  title: "AIPM Skill Templates",
  description:
    "Choose an AIPM starter template for publishing reusable AI skills: blank, code review, issue summary, and release notes.",
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
              "Choose an AIPM starter template for publishing reusable AI skills: blank, code review, issue summary, and release notes.",
            url: "https://aipm-registry.com/templates",
            hasPart: templates.map((template) => ({
              "@type": "HowTo",
              name: `${template.name} AIPM template`,
              text: template.command,
            })),
          }),
        }}
      />

      <section className="page-header">
        <p className="eyebrow">Templates</p>
        <h1>Start publishing from a skill shape that already fits the job.</h1>
        <p className="lede">
          AIPM templates create starter skill files for common AI workflows. They do not lock you
          in; edit the generated SKILL.md, manifest, and ignored files before staging and pushing.
        </p>
        <div className="actions">
          <Link className="button" href="/publish">
            Publishing guide
          </Link>
          <Link className="button secondary" href="/examples">
            Examples
          </Link>
        </div>
      </section>

      <section className="template-grid" aria-label="AIPM starter templates">
        {templates.map((template) => (
          <article className="template-card" key={template.value}>
            <p className="eyebrow">{template.value}</p>
            <h2>{template.name}</h2>
            <p>{template.bestFor}</p>
            <CodeBlock code={template.command} />
            <h3>Starts with</h3>
            <ul className="check-list">
              {template.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <article className="doc wide-doc">
        <section>
          <h2>After choosing a template</h2>
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
