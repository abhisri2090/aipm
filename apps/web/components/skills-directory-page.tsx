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
  const sort =
    params.sort === "popular" || params.sort === "title" || params.sort === "stars"
      ? params.sort
      : "newest";
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
            name: "AI Agent Skills Registry and Marketplace",
            description: "Browse versioned Claude Code, Cursor, and agent skills. Search by name, tool, or description.",
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
        <h1>AI agent skills registry for Claude Code, Cursor, and more</h1>
        <p>
          Browse versioned skills, review source, then install with AIPM. Start with the{" "}
          <Link href="/skills/claude">Claude Code skills</Link> or{" "}
          <Link href="/skills/cursor">Cursor skills</Link> hubs—or read how an{" "}
          <Link href="/guides/ai-package-manager">AI package manager</Link> differs from copy-paste.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/skills/claude">
            Claude Code skills
          </Link>
          <Link className={shell.button} href="/skills/cursor">
            Cursor skills
          </Link>
          <Link className={shell.button} href="/install">
            Install AIPM
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/guides/aipm-vs-skills-sh">
            vs skills.sh
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="skill-hubs-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>High-intent hubs</p>
            <h2 id="skill-hubs-title">Start with Claude Code or Cursor</h2>
          </div>
        </div>
        <div className={shell.actions}>
          <Link className={shell.button} href="/skills/claude">
            Claude Code skills marketplace
          </Link>
          <Link className={shell.button} href="/skills/cursor">
            Cursor skills registry
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/prompts">
            AI prompt directory
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
