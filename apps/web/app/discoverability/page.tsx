import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";

const principles = [
  {
    title: "Name the task",
    body: "A useful package name says what the skill helps users do: review pull requests, summarize Sentry issues, draft release notes, or plan migrations.",
  },
  {
    title: "Write for people",
    body: "Explain when to use the skill, which tools it supports, what output to expect, and what files it installs. Avoid vague claims like smarter workflow.",
  },
  {
    title: "Use honest keywords",
    body: "Mention tools and workflows only when they are true: Cursor skill, Claude skill, prompt package, code review assistant, or incident summary skill.",
  },
  {
    title: "Show examples",
    body: "A real install command, a short example, and a list of included files help users understand the package.",
  },
  {
    title: "Explain versions",
    body: "Users need to trust what they install. Explain behavior changes, compatibility, and old releases clearly.",
  },
  {
    title: "Do not leak private details",
    body: "Do not include private prompts, customer data, secret names, API keys, or internal documents. Public packages must be safe to inspect.",
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
    "Learn how to name and describe AIPM packages so users can find and trust them.",
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
              "Learn how to name and describe AIPM packages so users can find and trust them.",
            author: { "@type": "Organization", name: "AIPM" },
            publisher: { "@type": "Organization", name: "AIPM" },
            mainEntityOfPage: "https://aipm-registry.com/discoverability",
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Discoverability</p>
        <h1>Help users find and understand your skill.</h1>
        <p className={shell.lede}>
          Good discoverability is not keyword stuffing. Use clear names, accurate descriptions, real
          examples, and safe public content.
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
          <h2 id="aipm-seo-foundation">Page quality checklist</h2>
          <p>
            Every important page should help users before they sign in. Pages should explain the
            topic, link to the next step, and make install or publish actions easy to find.
          </p>
          <ul className={docs.checkList}>
            {pageChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>How to write package metadata</h2>
          <p>
            A package description should answer four questions: what task the skill helps with, which
            AI tools it supports, what files it installs, and what happens after install.
          </p>
          <CodeBlock
            code={`Good:
"Summarizes Sentry desktop app issues into triage notes for Cursor and Claude, with project rules and a reusable issue template."

Weak:
"AI-powered productivity helper for better workflows."`}
          />
          <p>
            Add the supporting fields too: <code>usage</code> for longer guidance,{" "}
            <code>tags</code> and <code>categories</code> for discovery pages,{" "}
            <code>sourceUrl</code> for imported or open-source packages, <code>examples</code> for
            real prompts, and <code>releaseNotes</code> for every published version.
          </p>
        </section>

        <section>
          <h2>What AIPM should keep improving</h2>
          <p>
            AIPM should keep adding helpful public pages for real user needs: installing skills,
            publishing skills, Cursor and Claude setup, safety, team workflows, troubleshooting, and
            package examples.
          </p>
        </section>
      </section>
    </DocLayout>
  );
}
