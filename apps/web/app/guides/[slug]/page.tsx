import Link from "next/link";
import { notFound } from "next/navigation";
import { DocLayout } from "../../../components/doc-layout";
import { SEO_GUIDES, getSeoGuide } from "../../../lib/seo-guides";
import { SITE_URL } from "../../../lib/registry";
import { pageMetadata } from "../../../lib/seo";
import { shell, cards, docs, cn } from "../../../lib/page-styles";

type GuideRouteProps = {
  params: Promise<{ slug: string }>;
};

const GUIDE_PUBLISHED_AT = "2026-08-27";
const GUIDE_UPDATED_AT = "2026-08-28";

const PLAIN_ENGLISH_TERMS = [
  { match: "AIPM", term: "AIPM", meaning: "a tool that installs and updates reusable AI instructions" },
  { match: "package", term: "Package", meaning: "a named group of files that people can install and update together" },
  { match: "workflow", term: "Workflow", meaning: "a set of steps used to finish a task" },
  { match: "repo", term: "Repository or repo", meaning: "a project folder whose changes are saved and tracked" },
  { match: "Git", term: "Git", meaning: "a tool that records file changes so people can review or undo them" },
  { match: "config", term: "Config", meaning: "settings that tell a tool how to work" },
  { match: "MCP", term: "MCP", meaning: "a standard way for an AI tool to connect to other tools and information" },
  { match: "CLI", term: "CLI", meaning: "a tool that you use by typing commands in a terminal" },
  {
    match: "environment variable",
    term: "Environment variable",
    meaning: "a private setting stored on your computer, often used for a password or token",
  },
] as const;

const RELATED_STOP_WORDS = new Set([
  "aipm", "and", "best", "code", "for", "guide", "how", "install", "manage", "share", "the", "to", "vs", "what",
]);

function guideTerms(guide: (typeof SEO_GUIDES)[number]): Set<string> {
  return new Set(
    [guide.slug, guide.title, guide.h1, ...guide.keywords]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9.]+/)
      .filter((term) => term.length > 2 && !RELATED_STOP_WORDS.has(term)),
  );
}

function findRelatedGuides(guide: (typeof SEO_GUIDES)[number]) {
  const terms = guideTerms(guide);
  return SEO_GUIDES.filter((item) => item.slug !== guide.slug)
    .map((item) => ({
      item,
      score: [...guideTerms(item)].filter((term) => terms.has(term)).length,
    }))
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, 4)
    .map(({ item }) => item);
}

export function generateStaticParams() {
  return SEO_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuideRouteProps) {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (!guide) return pageMetadata({ title: "Guide not found", description: "AIPM guide not found." });
  return pageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords,
  });
}

export default async function GuidePage({ params }: GuideRouteProps) {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (!guide) notFound();

  const relatedGuides = findRelatedGuides(guide);
  const guideText = JSON.stringify(guide);
  const terms = PLAIN_ENGLISH_TERMS.filter((item) => guideText.includes(item.match));
  const publishedAt = guide.publishedAt ?? GUIDE_PUBLISHED_AT;
  const updatedAt = guide.updatedAt ?? GUIDE_UPDATED_AT;

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
                "@id": `${SITE_URL}/guides/${guide.slug}#article`,
                headline: guide.title,
                description: guide.description,
                url: `${SITE_URL}/guides/${guide.slug}`,
                datePublished: publishedAt,
                dateModified: updatedAt,
                inLanguage: "en",
                author: { "@type": "Person", name: "Abhishek Srivastava" },
                publisher: { "@type": "Organization", name: "AIPM" },
                mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
                isPartOf: { "@type": "WebSite", name: "AIPM Registry", url: SITE_URL },
                breadcrumb: { "@id": `${SITE_URL}/guides/${guide.slug}#breadcrumbs` },
              },
              {
                "@type": "BreadcrumbList",
                "@id": `${SITE_URL}/guides/${guide.slug}#breadcrumbs`,
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "AIPM", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Resources", item: `${SITE_URL}/resources` },
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: guide.title,
                    item: `${SITE_URL}/guides/${guide.slug}`,
                  },
                ],
              },
            ],
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Plain-English guide</p>
        <h1>{guide.h1}</h1>
        <p className={shell.lede}>{guide.description}</p>
        <p className={shell.muted}>
          Published {new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(publishedAt))}.
          {" "}Last reviewed {new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(updatedAt))}.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/install">
            Install AIPM
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/skills">
            Browse skills
          </Link>
        </div>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Short answer</h2>
          <p>{guide.answer}</p>
        </section>

        {terms.length > 0 ? (
          <section>
            <h2>Words used in this guide</h2>
            <ul>
              {terms.map((item) => (
                <li key={item.term}>
                  <strong>{item.term}:</strong> {item.meaning}.
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2>What this means</h2>
          {guide.sections.map((section) => (
            <div key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </section>

        <section>
          <h2>Simple steps</h2>
          <ol className={docs.flowList}>
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2>Where to go next</h2>
          <p>
            If you want to try this in a real project, start with the{" "}
            <Link href="/install">install guide</Link>, then read{" "}
            <Link href="/use">how to use AIPM</Link>. If you want to share your own workflow, read
            the <Link href="/publish">publishing guide</Link>.
          </p>
        </section>

        <section>
          <h2>FAQ</h2>
          {guide.faqs.map((faq) => (
            <div key={faq.question}>
              <h2>{faq.question}</h2>
              <p>{faq.answer}</p>
            </div>
          ))}
        </section>

        {guide.sources && guide.sources.length > 0 ? (
          <section>
            <h2>Sources</h2>
            <ul>
              {guide.sources.map((source) => (
                <li key={source.href}>
                  <a href={source.href} rel="noreferrer" target="_blank">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2>How this guide was checked</h2>
          <p>
            Abhishek Srivastava reviewed this guide for plain English and current product behavior.
            Official references are linked above when the guide depends on outside product details.
            Product details can change, so the review date is shown at the top of the page.
          </p>
        </section>
      </article>

      <section className={shell.panelSection} aria-labelledby="related-guides-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Related guides</p>
            <h2 id="related-guides-title">Keep learning</h2>
          </div>
        </div>
        <div className={cards.guideGrid}>
          {relatedGuides.map((related) => (
            <Link className={cards.guideCard} href={`/guides/${related.slug}`} key={related.slug}>
              <h2>{related.title}</h2>
              <p>{related.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </DocLayout>
  );
}
