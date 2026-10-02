import Link from "next/link";
import { notFound } from "next/navigation";
import { DocLayout } from "../../../components/doc-layout";
import {
  getDocSectionIndex,
  listDocSectionIndexes,
} from "../../../lib/doc-section-index";
import { shell, cards } from "../../../lib/page-styles";
import { SITE_URL } from "../../../lib/registry";
import { pageMetadata } from "../../../lib/seo";

type SectionRouteProps = {
  params: Promise<{ section: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return listDocSectionIndexes().map((section) => ({ section: section.slug }));
}

export async function generateMetadata({ params }: SectionRouteProps) {
  const { section: slug } = await params;
  const section = getDocSectionIndex(slug);
  if (!section) {
    return pageMetadata({
      title: "Docs section not found",
      description: "AIPM docs section not found.",
      path: "/resources",
    });
  }
  return pageMetadata({
    title: section.title,
    description: `Pages listed under ${section.title}.`,
    path: section.path,
  });
}

export default async function DocSectionIndexPage({ params }: SectionRouteProps) {
  const { section: slug } = await params;
  const section = getDocSectionIndex(slug);
  if (!section) notFound();

  return (
    <DocLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: section.title,
            description: `Pages listed under ${section.title}.`,
            url: `${SITE_URL}${section.path}`,
            isPartOf: { "@type": "WebSite", name: "AIPM Registry", url: SITE_URL },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: section.items.length,
              itemListElement: section.items.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.label,
                description: item.body,
                url: `${SITE_URL}${item.href}`,
              })),
            },
          }),
        }}
      />
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Documentation</p>
        <h1>{section.title}</h1>
        <p className={shell.lede}>
          Each card is a page already listed under this heading.
        </p>
      </section>

      <section>
        <div className={cards.guideGrid}>
          {section.items.map((item) => (
            <Link className={cards.guideCard} href={item.href} key={item.href}>
              <h2>{item.label}</h2>
              <p>{item.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </DocLayout>
  );
}
