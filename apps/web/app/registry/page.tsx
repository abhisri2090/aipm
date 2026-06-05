import { shell, cn } from "../../lib/page-styles";
import { RegistrySearch } from "../../components/registry-search";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

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
      </section>

      <section className={shell.panelSection} aria-labelledby="registry-search-title">
        <div className={shell.sectionHeading}>
          <h2 id="registry-search-title">Skills</h2>
        </div>
        <RegistrySearch initialPackages={[]} initialQuery={query} />
      </section>
    </main>
  );
}
