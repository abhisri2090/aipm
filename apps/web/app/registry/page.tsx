import { shell, cn } from "../../lib/page-styles";
import Link from "next/link";
import { RegistrySearch } from "../../components/registry-search";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";
// import { SKILL_DISCOVERY_PAGES } from "../../lib/skill-discovery";

export const metadata = pageMetadata({
  title: "AI Skills Registry",
  description: "Search public AIPM skills by name, tool, or description.",
  path: "/registry",
});

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";

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
            url: `${SITE_URL}/registry`,
            about: ["AI skills", "prompt packages", "Cursor skills", "Claude skills", "AI tool files"],
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

      {/* Browse-by-category hidden until the catalog has more skills.
      <section className={shell.panelSection} aria-labelledby="browse-by-category-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Browse by tool or intent</p>
            <h2 id="browse-by-category-title">SEO-ready skill entry points</h2>
          </div>
        </div>
        <div className={cards.templateGrid}>
          {SKILL_DISCOVERY_PAGES.map((page) => (
            <Link className={cards.templateCard} href={`/skills/${page.slug}`} key={page.slug}>
              <h3>{page.title}</h3>
              <p>{page.description}</p>
            </Link>
          ))}
        </div>
      </section>
      */}

      <section className={shell.panelSection} aria-labelledby="registry-search-title">
        <div className={shell.sectionHeading}>
          <h2 id="registry-search-title">Skills</h2>
        </div>
        <RegistrySearch initialPackages={[]} initialQuery={query} />
      </section>
    </main>
  );
}
