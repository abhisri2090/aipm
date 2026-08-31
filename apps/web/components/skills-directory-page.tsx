import Link from "next/link";
import { listPackages, packagePath, SITE_URL } from "../lib/registry";
import { cn, shell } from "../lib/page-styles";
import { DirectoryListTile } from "./directory-list-tile";
import { RegistrySearch } from "./registry-search";

export async function SkillsDirectoryPage({
  searchParams,
  canonicalPath,
}: {
  searchParams: Promise<{ q?: string }>;
  canonicalPath: "/registry" | "/skills";
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const initialPackages = await listPackages(query, 50);

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
            url: `${SITE_URL}${canonicalPath}`,
            about: ["AI skills", "prompt packages", "Cursor skills", "Claude skills", "AI tool files"],
            mainEntity: {
              "@type": "ItemList",
              itemListElement: initialPackages.map((pkg, index) => ({
                "@type": "ListItem",
                position: index + 1,
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
        <p className={shell.eyebrow}>Registry</p>
        <h1>Search public skills.</h1>
        <p className={shell.lede}>
          Find AI skills by package name, supported tool, or description. Demo packages are hidden so
          the list stays focused on usable skills.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/popular-skills">
            See popular skill ideas
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="registry-search-title">
        <div className={shell.sectionHeading}>
          <h2 id="registry-search-title">Skills</h2>
        </div>
        <DirectoryListTile kind="skill" />
        <RegistrySearch initialPackages={initialPackages} initialQuery={query} />
      </section>
    </main>
  );
}
