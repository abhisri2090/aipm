import { PublishersDirectory } from "../../components/publishers-directory";
import { DirectoryPageLinks } from "../../components/directory-page-links";
import { directoryPageNumber, directoryPagePath } from "../../lib/directory-pagination";
import { notFound } from "next/navigation";
import {
  filterPublishedPublishers,
  listPublishedPublisherSlugs,
  listPublishersPage,
  publisherPath,
  SITE_URL,
} from "../../lib/registry";
import { pageMetadata, paginatedPageMetadata } from "../../lib/seo";
import { cn, shell } from "../../lib/page-styles";

const publishersMetadata = {
  title: "AI Skill Publishers",
  description:
    "Browse publishers on AIPM — organizations and creators who publish or import reusable AI agent skills",
  keywords: ["AI skill publishers", "AIPM publishers", "agent skill authors"],
};

type SearchParams = { page?: string; q?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const filtered = Boolean(params.q);
  if (filtered) {
    return {
      ...pageMetadata({ ...publishersMetadata, path: "/publishers" }),
      robots: { index: false, follow: true },
    };
  }
  return paginatedPageMetadata({
    ...publishersMetadata,
    path: directoryPagePath("/publishers", currentPage),
    page: currentPage,
  });
}

export default async function PublishersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const query = params.q ?? "";
  const [page, publishedSlugs] = await Promise.all([
    listPublishersPage(
      query,
      24,
      undefined,
      true,
      currentPage > 1 ? (currentPage - 1) * 24 : undefined,
    ),
    listPublishedPublisherSlugs(),
  ]);
  if (currentPage > 1 && page.publishers.length === 0) notFound();
  // /v1/publishers only lists orgs with at least one published package version.
  // Keep the client-side filter as a safety net so cards stay consistent with /publishers/{slug}.
  const publishers = filterPublishedPublishers(page.publishers, publishedSlugs);
  const publishedSlugList = publishedSlugs ? [...publishedSlugs].sort() : null;

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

      <section className={shell.panelSection} aria-label="Publishers directory">
        <PublishersDirectory
          key={`${currentPage}:${query}`}
          initialPublishers={publishers}
          initialNextCursor={page.nextCursor}
          initialNextOffset={page.nextOffset}
          initialQuery={query}
          publishedSlugs={publishedSlugList}
        />
        {!query ? (
          <DirectoryPageLinks
            basePath="/publishers"
            currentPage={currentPage}
            hasNext={Boolean(page.nextCursor || page.nextOffset !== null)}
          />
        ) : null}
      </section>
    </main>
  );
}
