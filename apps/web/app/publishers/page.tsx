import { PublishersDirectory } from "../../components/publishers-directory";
import { DirectoryPageLinks } from "../../components/directory-page-links";
import { directoryPageNumber, directoryPagePath, loadCursorDirectoryPage } from "../../lib/directory-pagination";
import { listPublishersPage, publisherPath, SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";
import { cn, shell } from "../../lib/page-styles";

const publishersMetadata = {
  title: "AI Skill Publishers",
  description:
    "Browse publishers on AIPM — organizations and creators who publish or import reusable AI agent skills.",
  path: "/publishers",
  keywords: ["AI skill publishers", "AIPM publishers", "agent skill authors"],
};

type SearchParams = { page?: string; q?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const filtered = Boolean(params.q);
  return {
    ...pageMetadata({ ...publishersMetadata, path: filtered ? "/publishers" : directoryPagePath("/publishers", currentPage) }),
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function PublishersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const query = params.q ?? "";
  const { items: publishers, nextCursor } = await loadCursorDirectoryPage(
    currentPage,
    async (cursor) => {
      const page = await listPublishersPage(query, 24, cursor, true);
      return { items: page.publishers, nextCursor: page.nextCursor };
    },
  );

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
            url: `${SITE_URL}${query ? "/publishers" : directoryPagePath("/publishers", currentPage)}`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: publishers.map((publisher, index) => ({
                "@type": "ListItem",
                position: (currentPage - 1) * 24 + index + 1,
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
          key={`${currentPage}:${query}`}
          initialPublishers={publishers}
          initialNextCursor={nextCursor}
          initialQuery={query}
        />
        {!query ? (
          <DirectoryPageLinks
            basePath="/publishers"
            currentPage={currentPage}
            hasNext={Boolean(nextCursor)}
          />
        ) : null}
      </section>
    </main>
  );
}
