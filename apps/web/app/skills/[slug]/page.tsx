import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCard } from "../../../components/package-card";
import { SKILL_DISCOVERY_PAGES, getSkillDiscoveryPage } from "../../../lib/skill-discovery";
import { listPackages, packagePath, SITE_URL } from "../../../lib/registry";
import { pageMetadata } from "../../../lib/seo";
import { shell, cards, cn } from "../../../lib/page-styles";

type SkillDiscoveryRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SKILL_DISCOVERY_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: SkillDiscoveryRouteProps) {
  const { slug } = await params;
  const page = getSkillDiscoveryPage(slug);
  if (!page) return pageMetadata({ title: "Skills not found", description: "Skill category not found." });
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: `/skills/${page.slug}`,
    keywords: [...page.keywords],
  });
}

export default async function SkillDiscoveryPage({ params }: SkillDiscoveryRouteProps) {
  const { slug } = await params;
  const page = getSkillDiscoveryPage(slug);
  if (!page) notFound();

  const packages = await listPackages(page.registryQuery, 12);
  const filteredPackages = page.target
    ? packages.filter((pkg) => pkg.targets.includes(page.target ?? "") || pkg.targets.includes("*"))
    : packages;
  const relatedPages = SKILL_DISCOVERY_PAGES.filter((item) => item.slug !== page.slug);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page.title,
            description: page.description,
            url: `${SITE_URL}/skills/${page.slug}`,
            about: page.keywords,
            isPartOf: {
              "@type": "WebSite",
              name: "AIPM Registry",
              url: SITE_URL,
            },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: filteredPackages.map((pkg, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: `${pkg.name}@${pkg.version}`,
                url: `${SITE_URL}${packagePath(pkg.name, pkg.version)}`,
              })),
            },
          }),
        }}
      />
      <section className={cn(shell.pageHeader, shell.compactPageHeader)}>
        <p className={shell.eyebrow}>Skill discovery</p>
        <h1>{page.h1}</h1>
        <p className={shell.lede}>{page.description}</p>
        <div className={shell.actions}>
          <Link className={shell.button} href={`/registry?q=${encodeURIComponent(page.query)}`}>
            Search registry
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/publish">
            Publish a skill
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="use-cases-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Use cases</p>
            <h2 id="use-cases-title">What these skills are good for</h2>
          </div>
        </div>
        <div className={cards.guideGrid}>
          {page.useCases.map((useCase) => (
            <article className={cards.guideCard} key={useCase}>
              <h2>{useCase}</h2>
              <p>
                Package this workflow once, install it into supported AI tools, and keep it versioned
                with the projects that depend on it.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="matching-skills-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Registry matches</p>
            <h2 id="matching-skills-title">Public skills for {page.title.toLowerCase()}</h2>
          </div>
          <Link className={shell.textLink} href={`/registry?q=${encodeURIComponent(page.query)}`}>
            View all matches
          </Link>
        </div>
        <div className={cards.results}>
          {filteredPackages.length > 0 ? (
            filteredPackages.map((pkg) => <PackageCard key={`${pkg.name}@${pkg.version}`} pkg={pkg} />)
          ) : (
            <div className={shell.empty}>
              No matching public skills are listed yet. This page is ready for the first packages in this category.
            </div>
          )}
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="related-skills-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Related pages</p>
            <h2 id="related-skills-title">Browse more skill categories</h2>
          </div>
        </div>
        <div className={cards.templateGrid}>
          {relatedPages.map((related) => (
            <Link className={cards.templateCard} href={`/skills/${related.slug}`} key={related.slug}>
              <h3>{related.title}</h3>
              <p>{related.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
