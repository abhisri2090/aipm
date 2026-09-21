import Link from "next/link";
import { CodeBlock } from "../../../components/code-block";
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
            "@graph": [
              {
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
              },
              ...(page.faqs?.length
                ? [
                    {
                      "@type": "FAQPage",
                      mainEntity: page.faqs.map((faq) => ({
                        "@type": "Question",
                        name: faq.question,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: faq.answer,
                        },
                      })),
                    },
                  ]
                : []),
            ],
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
          <Link className={shell.button} href="/install">
            Install AIPM
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/publish">
            Publish a skill
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="skill-collection-answer-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Short answer</p>
            <h2 id="skill-collection-answer-title">What you will find here</h2>
          </div>
        </div>
        <p>{page.answer}</p>
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
            filteredPackages.map((pkg) => <PackageCard key={pkg.name} pkg={pkg} />)
          ) : (
            <div className={shell.empty}>
              No matching public skills are listed yet. This page is ready for the first packages in this category.
            </div>
          )}
        </div>
      </section>

      {page.installCommands?.length ? (
        <section className={shell.panelSection} aria-labelledby="install-skills-title">
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>Install</p>
              <h2 id="install-skills-title">Install these skills with AIPM</h2>
            </div>
            <Link className={shell.textLink} href="/install">
              Full install guide
            </Link>
          </div>
          <p>
            Package-manager install keeps a pinned version in your repo. Browse a skill above, then
            run the matching target commands.
          </p>
          <div className={cards.steps}>
            {page.installCommands.map((step, index) => (
              <article className={cards.stepCard} key={step.label}>
                <div className={cards.stepHeading}>
                  <span className={cards.stepNumber}>{index + 1}</span>
                  <h3>{step.label}</h3>
                </div>
                <CodeBlock code={step.code} trackingEvent="Skill Hub Install Command Copied" />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {page.faqs?.length ? (
        <section className={shell.panelSection} aria-labelledby="skill-faq-title">
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>FAQ</p>
              <h2 id="skill-faq-title">Common questions</h2>
            </div>
          </div>
          <dl className={cards.guideGrid}>
            {page.faqs.map((faq) => (
              <div className={cards.guideCard} key={faq.question}>
                <dt>
                  <h3>{faq.question}</h3>
                </dt>
                <dd>
                  <p>{faq.answer}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {page.relatedLinks?.length ? (
        <section className={shell.panelSection} aria-labelledby="skill-related-links-title">
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>Next steps</p>
              <h2 id="skill-related-links-title">Install guides and related hubs</h2>
            </div>
          </div>
          <div className={cards.templateGrid}>
            {page.relatedLinks.map((link) => (
              <Link className={cards.templateCard} href={link.href} key={link.href}>
                <h3>{link.label}</h3>
                <p>Open {link.label.toLowerCase()}.</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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

      {page.sources?.length ? (
        <section className={shell.panelSection} aria-labelledby="skill-sources-title">
          <div className={shell.sectionHeading}>
            <h2 id="skill-sources-title">Primary sources</h2>
          </div>
          <ul>
            {page.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href} rel="noreferrer" target="_blank">{source.label}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
