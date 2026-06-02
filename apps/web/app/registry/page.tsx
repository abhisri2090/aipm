import { RegistrySearch } from "../../components/registry-search";
import { listPackages } from "../../lib/registry";
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
  const packages = await listPackages(params.q ?? "", 50);

  return (
    <main>
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
        <RegistrySearch initialPackages={packages} />
      </section>
    </main>
  );
}
