import { PublishersDirectory } from "../../components/publishers-directory";
import { DirectoryPageLinks } from "../../components/directory-page-links";
import { directoryPageNumber, directoryPagePath } from "../../lib/directory-pagination";
import { notFound } from "next/navigation";
import { listPublishersPage, publisherPath, SITE_URL } from "../../lib/registry";
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
  const page = await listPublishersPage(
    query,
    24,
    undefined,
    true,
    currentPage > 1 ? (currentPage - 1) * 24 : undefined,
  );
  const publishers = page.publishers;
  if (currentPage > 1 && publishers.length === 0) notFound();

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

      <section className={shell.panelSection} aria-labelledby="publishers-about-title">
        <div className={shell.sectionHeading}>
          <h2 id="publishers-about-title">About publishers</h2>
        </div>
        <p>
          Publishers are the individuals and organizations who create and maintain AI skill packages on AIPM.
          Each publisher has a unique namespace that appears before the package name, like <code>@publisher/skill-name</code>.
          When you install a skill, the publisher namespace tells you who created and maintains it.
        </p>
        <p>
          Publisher profiles show all public packages under that namespace, along with source links and any
          verification badges. Verified publishers have confirmed their identity through GitHub or another
          connected account. This helps you decide whether to trust a skill before installing it in your project.
        </p>
        <p>
          Anyone can become a publisher by creating an account and reserving a namespace. Organizations can
          create org namespaces for team-owned packages. Read the{" "}
          <a href="/publish">publishing guide</a> to learn how to publish your first skill.
        </p>
      </section>

      <section className={shell.panelSection} aria-labelledby="publishers-directory-title">
        <div className={shell.sectionHeading}>
          <h2 id="publishers-directory-title">All publishers</h2>
        </div>
        <PublishersDirectory
          key={`${currentPage}:${query}`}
          initialPublishers={publishers}
          initialNextCursor={page.nextCursor}
          initialNextOffset={page.nextOffset}
          initialQuery={query}
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
