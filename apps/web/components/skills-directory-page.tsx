import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryPageLinks } from "./directory-page-links";
import { directoryPageNumber, directoryPagePath } from "../lib/directory-pagination";
import { listPackagesPage, packagePath, SITE_URL } from "../lib/registry";
import { cn, shell } from "../lib/page-styles";
import { DirectoryListTile } from "./directory-list-tile";
import { RegistrySearch } from "./registry-search";

export async function SkillsDirectoryPage({
  searchParams,
  canonicalPath,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string; target?: string; sort?: string }>;
  canonicalPath: "/registry" | "/skills";
}) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const query = params.q ?? "";
  const sort = params.sort === "popular" || params.sort === "title" ? params.sort : "newest";
  const filtered = Boolean(query || params.category || params.target || params.sort);
  const listingOptions = { query, limit: 20, category: params.category, target: params.target, sort, throwOnError: true };
  const page = await listPackagesPage({
    ...listingOptions,
    offset: currentPage > 1 ? (currentPage - 1) * 20 : undefined,
  });
  const initialPackages = page.packages;
  const initialNextCursor = page.nextCursor;
  const initialNextOffset = page.nextOffset;
  if (currentPage > 1 && initialPackages.length === 0) notFound();

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AIPM AI Skills Registry",
            description: "Search public AIPM skills by name, tool, or description.",
            url: `${SITE_URL}${filtered ? canonicalPath : directoryPagePath(canonicalPath, currentPage)}`,
            about: ["AI skills", "prompt packages", "Cursor skills", "Claude skills", "AI tool files"],
            mainEntity: {
              "@type": "ItemList",
              itemListElement: initialPackages.map((pkg, index) => ({
                "@type": "ListItem",
                position: (currentPage - 1) * 20 + index + 1,
                name: `${pkg.name}@${pkg.version}`,
                url: `${SITE_URL}${packagePath(pkg.name, pkg.version)}`,
              })),
            },
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/registry?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <section className={cn(shell.pageHeader, shell.compactPageHeader)}>
        <p className={shell.eyebrow}>Agent skills registry</p>
        <h1>AI skills that you can trust</h1>
        <p>
          Not sure how packages help? Read the plain-English guide to{" "}
          <Link href="/guides/ai-package-manager">AI package managers</Link>.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/popular-skills">
            See popular skill ideas
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/publishers">
            Browse publishers
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="registry-search-title">
        <div className={shell.sectionHeading}>
          <h2 id="registry-search-title">Skills</h2>
        </div>
        <DirectoryListTile kind="skill" />
        <RegistrySearch
          key={`${currentPage}:${query}:${params.category ?? ""}:${params.target ?? ""}:${sort}`}
          initialPackages={initialPackages}
          initialNextCursor={initialNextCursor}
          initialNextOffset={initialNextOffset}
          initialQuery={query}
          initialCategory={params.category}
          initialTarget={params.target}
          initialSort={sort}
        />
        {!filtered ? (
          <DirectoryPageLinks
            basePath={canonicalPath}
            currentPage={currentPage}
            hasNext={Boolean(initialNextCursor || initialNextOffset !== null)}
          />
        ) : null}
      </section>
    </main>
  );
}
