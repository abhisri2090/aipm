import Link from "next/link";
import { notFound } from "next/navigation";
import { DocLayout } from "../../../components/doc-layout";
import { CodeBlock } from "../../../components/code-block";
import { GuideInline } from "../../../components/guide-inline";
import { SEO_GUIDES, getSeoGuide, type GuideTable } from "../../../lib/seo-guides";
import { guideSectionId, stripGuideInline } from "../../../lib/guide-inline";
import { SITE_URL } from "../../../lib/registry";
import { pageMetadata } from "../../../lib/seo";
import { shell, cards, docs, cn } from "../../../lib/page-styles";
import tableStyles from "../../compatibility/compatibility.module.css";

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

function formatGuideDate(day: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(day));
}

function GuideTableView({ table, id }: { table: GuideTable; id?: string }) {
  return (
    <div className={tableStyles.tableWrap}>
      <table className={tableStyles.matrix} id={id}>
        <caption className={tableStyles.note}>
          <GuideInline text={table.caption} />
        </caption>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column} scope="col">
                <GuideInline text={column} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row[0]}`}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th className={tableStyles.formatName} key={index} scope="row">
                    <GuideInline text={cell} />
                  </th>
                ) : (
                  <td key={index}>
                    <GuideInline text={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  const faqItems = guide.faqs.length > 0 ? guide.faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: stripGuideInline(faq.answer),
    },
  })) : null;

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
                author: {
                  "@type": "Person",
                  name: "Abhishek Srivastava",
                  url: "https://www.linkedin.com/in/abhisri2090",
                },
                publisher: {
                  "@type": "Organization",
                  name: "AIPM",
                  url: SITE_URL,
                  logo: {
                    "@type": "ImageObject",
                    url: `${SITE_URL}/aipm-logo.svg`,
                  },
                },
                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": `${SITE_URL}/guides/${guide.slug}`,
                },
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
              ...(faqItems ? [{
                "@type": "FAQPage",
                "@id": `${SITE_URL}/guides/${guide.slug}#faq`,
                mainEntity: faqItems,
              }] : []),
            ],
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Plain-English guide</p>
        <h1>{guide.h1}</h1>
        <p className={shell.lede}>{guide.description}</p>
        <p className={shell.muted}>
          Published {formatGuideDate(publishedAt)}.
          {" "}Last reviewed {formatGuideDate(updatedAt)}.
          {guide.lastChecked ? <>{" "}Facts checked against official docs on {formatGuideDate(guide.lastChecked)}.</> : null}
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/use">
            Get started with AIPM
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/skills">
            Browse skills
          </Link>
        </div>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Short answer</h2>
          <p>
            <GuideInline text={guide.answer} />
          </p>
          {guide.answerTable ? <GuideTableView table={guide.answerTable} /> : null}
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
              <h2 id={guideSectionId(section.title)}>{section.title}</h2>
              <p>
                <GuideInline text={section.body} />
              </p>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>
                  <GuideInline text={paragraph} />
                </p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>
                      <GuideInline text={bullet} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.table ? <GuideTableView table={section.table} /> : null}
              {section.code?.map((block) => (
                <div key={block.code}>
                  {block.label ? (
                    <p className={shell.muted}>
                      <GuideInline text={block.label} />
                    </p>
                  ) : null}
                  <CodeBlock code={block.code} />
                </div>
              ))}
            </div>
          ))}
        </section>

        {guide.comparison ? (
          <section aria-labelledby="comparison-title">
            <h2 id="comparison-title">Comparison table</h2>
            <GuideTableView table={guide.comparison} />
          </section>
        ) : null}

        <section>
          <h2>Simple steps</h2>
          <ol className={docs.flowList}>
            {guide.steps.map((step) => (
              <li key={step}>
                <GuideInline text={step} />
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2>Where to go next</h2>
          <p>
            If you want to try this in a real project, start with{" "}
            <Link href="/use">how to use AIPM</Link> and the{" "}
            <Link href="/commands">command reference</Link>. If you want to share your own workflow, read
            the <Link href="/publish">publishing guide</Link>.
          </p>
        </section>

        <section>
          <h2>FAQ</h2>
          {guide.faqs.map((faq) => (
            <div key={faq.question}>
              <h2>{faq.question}</h2>
              <p>
                <GuideInline text={faq.answer} />
              </p>
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
