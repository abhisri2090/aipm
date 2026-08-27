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

  const relatedGuides = SEO_GUIDES.filter((item) => item.slug !== guide.slug).slice(0, 4);

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
                headline: guide.title,
                description: guide.description,
                author: { "@type": "Organization", name: "AIPM" },
                publisher: { "@type": "Organization", name: "AIPM" },
                mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
                isPartOf: { "@type": "WebSite", name: "AIPM Registry", url: SITE_URL },
              },
              {
                "@type": "FAQPage",
                mainEntity: guide.faqs.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer,
                  },
                })),
              },
            ],
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Plain-English guide</p>
        <h1>{guide.h1}</h1>
        <p className={shell.lede}>{guide.description}</p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/install">
            Install AIPM
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/registry">
            Browse skills
          </Link>
        </div>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Short answer</h2>
          <p>{guide.answer}</p>
        </section>

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
