import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";

const principles = [
  {
    title: "Name the job, not the technology",
    body: "A useful package name says what the skill helps a user do: review pull requests, summarize Sentry issues, draft release notes, or prepare migration plans. Searchers usually look for the job first.",
  },
  {
    title: "Write descriptions for humans",
    body: "Explain the project situation, supported AI tools, expected output, and the files installed. Avoid vague claims like smarter workflow or AI productivity without saying what changes.",
  },
  {
    title: "Use stable keywords naturally",
    body: "Mention the target tools and workflow only when they are true: Cursor skill, Claude skill, Codex skill, prompt package, AI tool files, code review assistant, or incident summary skill.",
  },
  {
    title: "Publish examples that answer intent",
    body: "A real install command, a short before-and-after scenario, and a list of included files help both users and search engines understand the package.",
  },
  {
    title: "Keep versions and changelogs clear",
    body: "Search traffic is only useful if users trust what they find. Version behavior changes, explain compatibility, and make old releases understandable.",
  },
  {
    title: "Do not leak private context",
    body: "Discoverability should never come from private prompts, internal customer data, secret names, API keys, or company-only documents. Public packages must be safe to inspect.",
  },
];

const pageChecklist = [
  "One clear H1 that describes the page purpose.",
  "A concise meta description with the main user intent.",
  "Canonical URL, sitemap entry, and readable internal links.",
  "Structured data when the page is an article, FAQ, collection, or package detail.",
  "Fast static rendering where possible, with live registry data loaded separately.",
  "Useful text on the page, not only cards, icons, or JavaScript-rendered shells.",
];

export const metadata = pageMetadata({
  title: "AI Skill SEO and Discoverability Guide",
  description:
    "A practical SEO guide for publishing discoverable AI skills, prompt packages, Cursor skills, Claude skills, and reusable AI tool files with AIPM.",
  path: "/discoverability",
  keywords: [
    "AI skill SEO",
    "publish AI skills",
    "AI skill registry",
    "prompt package SEO",
    "Cursor skill publishing",
    "Claude skill publishing",
  ],
});

export default function DiscoverabilityPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "AI Skill SEO and Discoverability Guide",
            description:
              "A practical SEO guide for publishing discoverable AI skills, prompt packages, Cursor skills, Claude skills, and reusable AI tool files with AIPM.",
            author: { "@type": "Organization", name: "AIPM" },
            publisher: { "@type": "Organization", name: "AIPM" },
            mainEntityOfPage: "https://aipm-registry.com/discoverability",
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Discoverability</p>
        <h1>Make AI skills easy to find, understand, and trust.</h1>
        <p className={shell.lede}>
          AIPM will succeed only if useful skills are visible to the people who need them. Good SEO
          here is not keyword stuffing. It is clear naming, accurate package metadata, real examples,
          public safety, and pages that explain the workflow better than a search result snippet can.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/publish">
            Publish a skill
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/ai-practices">
            AI best practices
          </Link>
        </div>
      </section>

      <section className={cards.practiceGrid} aria-label="Discoverability principles">
        {principles.map((principle) => (
          <article className={cards.practiceCard} key={principle.title}>
            <h2>{principle.title}</h2>
            <p>{principle.body}</p>
          </article>
        ))}
      </section>

      <section className={cn(docs.doc, docs.wideDoc)} aria-labelledby="aipm-seo-foundation">
        <section>
          <h2 id="aipm-seo-foundation">AIPM page quality checklist</h2>
          <p>
            Every important AIPM page should be useful before a user signs in. The public website
            needs strong static content, live registry search where it matters, and clear paths from
            search intent to installation or publishing.
          </p>
          <ul className={docs.checkList}>
            {pageChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>How publishers should write package metadata</h2>
          <p>
            A package description should answer four questions in plain language: what task the skill
            helps with, which AI tools it supports, what files it installs, and what a user should
            expect after installation.
          </p>
          <CodeBlock
            code={`Good:
"Summarizes Sentry desktop app issues into triage notes for Cursor and Claude, with project rules and a reusable issue template."

Weak:
"AI-powered productivity helper for better workflows."`}
          />
        </section>

        <section>
          <h2>What AIPM should keep doing</h2>
          <p>
            The product should keep expanding high-quality public pages around real user intent:
            installing AI skills, publishing AI skills, Cursor and Claude setup, prompt package
            safety, team workflows, troubleshooting, and examples from real packages in the registry.
          </p>
        </section>
      </section>
    </DocLayout>
  );
}
