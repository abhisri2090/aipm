import { RegistrySearch } from "../../components/registry-search";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AI Skills Registry",
  description: "Search published AIPM skills by package name, supported tool, or description.",
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
            description: "Search published AIPM skills by package name, supported tool, or description.",
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
      <section className="page-header">
        <p className="eyebrow">Registry</p>
        <h1>Search published skills.</h1>
        <p className="lede">
          Find installable AI skills by package name, supported tool, or description. Demo packages
          are hidden from the public listing so this page stays focused on usable skills.
        </p>
      </section>

      <section className="panel-section" aria-labelledby="registry-search-title">
        <div className="section-heading">
          <h2 id="registry-search-title">Skills</h2>
        </div>
        <RegistrySearch initialPackages={[]} initialQuery={query} />
      </section>
    </main>
  );
}
