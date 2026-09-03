import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCard } from "../../../components/package-card";
import { listPackages, publisherPath, SITE_URL } from "../../../lib/registry";
import { cards, cn, shell } from "../../../lib/page-styles";

type PublisherPageProps = {
  params: Promise<{ slug: string }>;
};

async function getPublisher(slug: string) {
  const packages = await listPackages("", 100);
  const publisherPackages = packages.filter((pkg) => pkg.publisher?.org.slug === slug);
  const publisher = publisherPackages[0]?.publisher;
  return publisher ? { publisher, packages: publisherPackages } : null;
}

export async function generateMetadata({ params }: PublisherPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublisher(decodeURIComponent(slug));
  if (!result) return { title: "Publisher not found | AIPM" };

  const { publisher, packages } = result;
  const title = `${publisher.org.name} AI Skills`;
  const description = `Browse ${packages.length} reusable AI ${packages.length === 1 ? "skill" : "skills"} published or imported under ${publisher.org.name} on AIPM.`;
  const canonical = `${SITE_URL}${publisherPath(publisher.org.slug)}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "profile", siteName: "AIPM" },
  };
}

export default async function PublisherPage({ params }: PublisherPageProps) {
  const { slug } = await params;
  const result = await getPublisher(decodeURIComponent(slug));
  if (!result) notFound();
  const { publisher, packages } = result;
  const canonical = `${SITE_URL}${publisherPath(publisher.org.slug)}`;
  const connected = publisher.user.verified === true;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            name: `${publisher.org.name} AI skills on AIPM`,
            url: canonical,
            mainEntity: {
              "@type": "Organization",
              name: publisher.org.name,
              identifier: `@${publisher.org.slug}`,
            },
          }),
        }}
      />
      <section className={cn(shell.pageHeader, shell.compactPageHeader)}>
        <p className={shell.eyebrow}>AIPM publisher</p>
        <h1>{publisher.org.name}</h1>
        <p className={shell.lede}>
          {connected
            ? "This publisher has connected the linked GitHub account to AIPM."
            : "These public skills were imported from their linked source repositories. This publisher has not claimed the AIPM account yet."}
        </p>
        <p className={shell.muted}>
          Account verification confirms account control. It does not guarantee that every package is safe.
        </p>
      </section>
      <section className={shell.panelSection} aria-labelledby="publisher-skills-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>
              {packages.length} {packages.length === 1 ? "skill" : "skills"}
            </p>
            <h2 id="publisher-skills-title">Skills from {publisher.org.name}</h2>
          </div>
        </div>
        <div className={cards.results}>
          {packages.map((pkg) => (
            <PackageCard compact key={`${pkg.name}@${pkg.version}`} pkg={pkg} />
          ))}
        </div>
      </section>
    </main>
  );
}
