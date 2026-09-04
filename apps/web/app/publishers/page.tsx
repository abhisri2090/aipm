import { PublishersDirectory } from "../../components/publishers-directory";
import { listPublishersPage, publisherPath, SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";
import { cn, shell } from "../../lib/page-styles";

export const metadata = pageMetadata({
  title: "AI Skill Publishers",
  description:
    "Browse publishers on AIPM — organizations and creators who publish or import reusable AI agent skills.",
  path: "/publishers",
  keywords: ["AI skill publishers", "AIPM publishers", "agent skill authors"],
});

export default async function PublishersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const { publishers, nextCursor } = await listPublishersPage(query, 24);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AIPM Publishers",
            description: "Publishers of reusable AI agent skills on AIPM.",
            url: `${SITE_URL}/publishers`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: publishers.map((publisher, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: publisher.name,
                url: `${SITE_URL}${publisherPath(publisher.slug)}`,
              })),
            },
          }),
        }}
      />
      <section className={cn(shell.pageHeader, shell.compactPageHeader)}>
        <p className={shell.eyebrow}>Publishers</p>
        <h1>Meet the people and orgs behind public skills.</h1>
        <p className={shell.lede}>
          Browse every publisher with public skills on AIPM. Open a profile to inspect their
          packages, source links, and verification status.
        </p>
      </section>

      <section className={shell.panelSection} aria-labelledby="publishers-directory-title">
        <div className={shell.sectionHeading}>
          <h2 id="publishers-directory-title">All publishers</h2>
        </div>
        <PublishersDirectory
          initialPublishers={publishers}
          initialNextCursor={nextCursor}
          initialQuery={query}
        />
      </section>
    </main>
  );
}
