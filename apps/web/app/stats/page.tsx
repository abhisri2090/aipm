import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { cards, docs, shell } from "../../lib/page-styles";
import { listPackages, SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

export const revalidate = 120;

export const metadata = pageMetadata({
  title: "AIPM Registry Statistics",
  description: "Live public statistics for AIPM packages, installs, supported AI tools, and package categories.",
  path: "/stats",
  keywords: ["AIPM statistics", "AI skill registry data", "AI agent skills data", "AIPM packages"],
});

function countValues(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function displayTarget(target: string): string {
  return target === "*" ? "All supported tools" : target;
}

export default async function StatsPage() {
  const packages = await listPackages("", 100);
  const available = packages.length > 0;
  const installs = packages.reduce((sum, pkg) => sum + (pkg.installCount ?? 0), 0);
  const targets = countValues(packages.flatMap((pkg) => pkg.targets.map(displayTarget)));
  const categories = countValues(packages.flatMap((pkg) => pkg.categories ?? []));
  const checkedAt = new Date().toISOString();
  const canonical = `${SITE_URL}/stats`;

  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Dataset",
                name: "AIPM Registry public statistics",
                description: "Current counts for public AIPM packages, installs, targets, and categories.",
                url: canonical,
                creator: { "@type": "Organization", name: "AIPM" },
                dateModified: checkedAt,
                inLanguage: "en",
                isAccessibleForFree: true,
                variableMeasured: ["Public packages", "Installs", "Supported targets", "Package categories"],
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "AIPM", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Registry statistics", item: canonical },
                ],
              },
            ],
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Public data</p>
        <h1>AIPM Registry statistics</h1>
        <p className={shell.lede}>Live numbers from the public registry. The page refreshes its data every two minutes.</p>
      </section>

      {available ? (
        <>
          <section className={shell.panelSection} aria-label="Registry totals">
            <div className={cards.guideGrid}>
              <article className={cards.guideCard}><h2>{packages.length}</h2><p>Public packages returned by the registry</p></article>
              <article className={cards.guideCard}><h2>{installs}</h2><p>Recorded package installs</p></article>
              <article className={cards.guideCard}><h2>{targets.length}</h2><p>AI tool targets represented</p></article>
            </div>
          </section>

          <article className={docs.doc}>
            <section>
              <h2>Packages by AI tool</h2>
              <dl className={docs.definitionList}>
                {targets.map(([name, count]) => <div key={name}><dt>{name}</dt><dd>{count} packages</dd></div>)}
              </dl>
            </section>
            <section>
              <h2>Top package categories</h2>
              {categories.length ? (
                <dl className={docs.definitionList}>
                  {categories.slice(0, 10).map(([name, count]) => <div key={name}><dt>{name}</dt><dd>{count} packages</dd></div>)}
                </dl>
              ) : <p>No package categories have been reported yet.</p>}
            </section>
            <section>
              <h2>How to cite this page</h2>
              <p>
                These are live counts from the AIPM public registry. Include the date you viewed the page because
                packages and install counts can change. Browse the <Link href="/registry">public package list</Link>.
              </p>
            </section>
          </article>
        </>
      ) : (
        <section className={shell.panelSection}>
          <div className={shell.notice}>
            <h2>Live data is temporarily unavailable</h2>
            <p>The public registry could not be reached. This page will try again automatically.</p>
          </div>
        </section>
      )}
    </DocLayout>
  );
}
