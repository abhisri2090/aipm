import { shell, cards, cn } from "../../../../../lib/page-styles";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageDetailView } from "../../../../../components/package-detail-view";
import { PackageCard } from "../../../../../components/package-card";
import {
  CLI_INSTALL_COMMAND,
  commandTargets,
  displayTargets,
  getPackage,
  installCommand,
  installCommandForTarget,
  listPackages,
  packagePath,
  resolveSkillInvokeCommand,
  SITE_URL,
  type PackageSummary,
} from "../../../../../lib/registry";

type PackagePageProps = {
  params: Promise<{ scope: string; name: string; version: string }>;
};

function toSummary(pkg: Awaited<ReturnType<typeof getPackage>>): PackageSummary {
  if (!pkg) throw new Error("Package is required");
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.manifest.description,
    type: pkg.manifest.type,
    targets: pkg.manifest.targets,
    license: pkg.manifest.license ?? null,
    usage: pkg.manifest.usage ?? null,
    tags: pkg.manifest.tags ?? [],
    categories: pkg.manifest.categories ?? [],
    sourceUrl: pkg.manifest.sourceUrl ?? null,
    integrity: pkg.integrity,
    sizeBytes: pkg.sizeBytes,
    createdAt: pkg.createdAt,
    installCount: pkg.installCount,
    publisher: pkg.publisher,
    import: pkg.import,
  };
}

function packageKeywords(pkg: PackageSummary): string[] {
  const targets = displayTargets(pkg.targets);
  return [
    pkg.name,
    `${pkg.name} ${pkg.version}`,
    `install ${pkg.name}`,
    `install ${pkg.name}@${pkg.version}`,
    "AIPM package",
    "AI skill",
    "AI skill registry",
    "prompt package",
    ...targets.map((target) => `${target} skill`),
    ...targets.map((target) => `${pkg.name} ${target}`),
    ...(pkg.tags ?? []),
    ...(pkg.categories ?? []),
  ];
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const { scope, name, version } = await params;
  const packageName = `@${decodeURIComponent(scope)}/${decodeURIComponent(name)}`;
  const pkg = await getPackage(packageName, decodeURIComponent(version));
  if (!pkg) return { title: "Package not found | AIPM" };
  const summary = toSummary(pkg);
  const title = `${pkg.name}@${pkg.version}`;
  const targetLabel = displayTargets(pkg.manifest.targets).join(", ");
  const description = `${pkg.manifest.description} Install ${pkg.name}@${pkg.version} for ${targetLabel} with AIPM.`;
  const path = packagePath(pkg.name, pkg.version);
  const publisher = pkg.publisher?.org.name ?? "AIPM";
  return {
    title,
    description,
    applicationName: "AIPM Registry",
    category: "developer tools",
    keywords: packageKeywords(summary),
    authors: [{ name: publisher }],
    publisher,
    alternates: { canonical: `${SITE_URL}${path}` },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: "AIPM",
      type: "article",
      publishedTime: pkg.createdAt,
      authors: [publisher],
      tags: packageKeywords(summary),
      images: [
        {
          url: `${SITE_URL}/og.svg`,
          width: 1200,
          height: 630,
          alt: "AIPM Registry - AI skills and tool files",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og.svg`],
    },
    other: {
      "aipm:package": pkg.name,
      "aipm:version": pkg.version,
      "aipm:type": pkg.manifest.type,
      "aipm:targets": targetLabel,
      "aipm:install-command": installCommand(summary),
      "aipm:tags": (summary.tags ?? []).join(", "),
      "aipm:categories": (summary.categories ?? []).join(", "),
      "aipm:source-url": pkg.manifest.sourceUrl ?? pkg.import?.sourceUrl ?? "",
      "ai:package": pkg.name,
      "ai:skill-version": pkg.version,
      "ai:skill-targets": targetLabel,
      "ai:install-command": installCommand(summary),
      "ai:skill-tags": (summary.tags ?? []).join(", "),
    },
  };
}

export default async function PackagePage({ params }: PackagePageProps) {
  const { scope, name, version } = await params;
  const packageName = `@${decodeURIComponent(scope)}/${decodeURIComponent(name)}`;
  const [pkg, allPackages] = await Promise.all([
    getPackage(packageName, decodeURIComponent(version)),
    listPackages("", 100),
  ]);
  if (!pkg) notFound();

  const summary = toSummary(pkg);
  const command = installCommand(summary);
  const invokeCommand = resolveSkillInvokeCommand(summary.name);
  const canonicalUrl = `${SITE_URL}${packagePath(summary.name, summary.version)}`;
  const targetLabel = displayTargets(summary.targets).join(", ");
  const aiContext = {
    packageName: summary.name,
    version: summary.version,
    description: summary.description,
    type: summary.type,
    targets: displayTargets(summary.targets),
    entry: pkg.manifest.entry ?? null,
    tags: summary.tags ?? [],
    categories: summary.categories ?? [],
    sourceUrl: pkg.manifest.sourceUrl ?? summary.import?.sourceUrl ?? null,
    examples: pkg.manifest.examples ?? [],
    releaseNotes: pkg.manifest.releaseNotes ?? null,
    installCommand: command,
    targetInstallCommands: commandTargets(summary.targets).map((target) => ({
      target,
      command: installCommandForTarget(summary, target),
    })),
    usage: invokeCommand,
    publisher: summary.publisher
      ? {
          org: summary.publisher.org.slug,
          orgName: summary.publisher.org.name,
          user: summary.publisher.user.githubLogin,
          verified: summary.publisher.user.verified ?? null,
        }
      : null,
    canonicalUrl,
  };
  const publisherName = summary.publisher
    ? `${summary.publisher.org.name} (${summary.publisher.user.name ?? `@${summary.publisher.user.githubLogin}`})`
    : "AIPM";
  const packageTerms = new Set(
    [...(summary.categories ?? []), ...(summary.tags ?? [])].map((value) => value.toLowerCase()),
  );
  const relatedPackages = allPackages
    .filter((candidate) => candidate.name !== summary.name)
    .map((candidate) => ({
      candidate,
      score:
        (candidate.publisher?.org.slug === summary.publisher?.org.slug ? 3 : 0) +
        [...(candidate.categories ?? []), ...(candidate.tags ?? [])].filter((value) =>
          packageTerms.has(value.toLowerCase()),
        ).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.candidate.installCount ?? 0) - (a.candidate.installCount ?? 0))
    .slice(0, 3)
    .map(({ candidate }) => candidate);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": `${canonicalUrl}#webpage`,
                url: canonicalUrl,
                name: `${summary.name}@${summary.version}`,
                description: summary.description,
                isPartOf: {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}#website`,
                  name: "AIPM Registry",
                  url: SITE_URL,
                },
                breadcrumb: { "@id": `${canonicalUrl}#breadcrumbs` },
                mainEntity: { "@id": `${canonicalUrl}#package` },
                datePublished: summary.createdAt,
                dateModified: summary.createdAt,
                inLanguage: "en",
              },
              {
                "@type": "SoftwareSourceCode",
                "@id": `${canonicalUrl}#package`,
                name: summary.name,
                version: summary.version,
                description: summary.description,
                url: canonicalUrl,
                codeRepository: SITE_URL,
                programmingLanguage: "AI tool configuration",
                runtimePlatform: displayTargets(summary.targets),
                softwareRequirements: "AIPM CLI",
                license: summary.license ?? undefined,
                targetProduct: displayTargets(summary.targets),
                usageInfo: invokeCommand,
                datePublished: summary.createdAt,
                identifier: `${summary.name}@${summary.version}`,
                isAccessibleForFree: true,
                keywords: packageKeywords(summary).join(", "),
                codeSampleType: "AI skill",
                installUrl: canonicalUrl,
                sameAs: pkg.manifest.sourceUrl ?? summary.import?.sourceUrl ?? undefined,
                downloadUrl: `${SITE_URL}/registry`,
                maintainer: {
                  "@type": summary.publisher ? "Organization" : "Organization",
                  name: publisherName,
                },
              },
              {
                "@type": "HowTo",
                "@id": `${canonicalUrl}#install`,
                name: `Install ${summary.name}@${summary.version}`,
                description: `Install ${summary.name}@${summary.version} into a supported AI tool with AIPM.`,
                tool: [{ "@type": "HowToTool", name: "AIPM CLI" }],
                step: [
                  {
                    "@type": "HowToStep",
                    name: "Install the AIPM CLI",
                    text: CLI_INSTALL_COMMAND,
                  },
                  {
                    "@type": "HowToStep",
                    name: "Initialize the project",
                    text: "aipm init --target cursor",
                  },
                  {
                    "@type": "HowToStep",
                    name: "Install the skill",
                    text: command,
                    url: `${canonicalUrl}#install-command`,
                  },
                ],
              },
              {
                "@type": "FAQPage",
                "@id": `${canonicalUrl}#faq`,
                mainEntity: [
                  {
                    "@type": "Question",
                    name: `How do I install ${summary.name}@${summary.version}?`,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: `Run ${command} in a project that has AIPM initialized.`,
                    },
                  },
                  {
                    "@type": "Question",
                    name: `Which AI tools does ${summary.name}@${summary.version} support?`,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: `${summary.name}@${summary.version} supports ${targetLabel}.`,
                    },
                  },
                ],
              },
              {
                "@type": "BreadcrumbList",
                "@id": `${canonicalUrl}#breadcrumbs`,
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Registry",
                    item: `${SITE_URL}/registry`,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: summary.name,
                    item: canonicalUrl,
                  },
                ],
              },
            ],
          }),
        }}
      />
      <script
        id="aipm-package-context"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aiContext) }}
      />
      <PackageDetailView canonicalUrl={canonicalUrl} pkg={pkg} />

      {relatedPackages.length > 0 ? (
        <section className={shell.panelSection} aria-labelledby="related-skills-title">
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>Keep exploring</p>
              <h2 id="related-skills-title">Related AI skills</h2>
            </div>
          </div>
          <div className={cards.results}>
            {relatedPackages.map((related) => (
              <PackageCard compact key={`${related.name}@${related.version}`} pkg={related} />
            ))}
          </div>
        </section>
      ) : null}

      <section className={shell.panelSection} aria-labelledby="package-faq-title">
        <article className={cn(shell.panel, cards.stepCard)}>
          <p className={shell.eyebrow}>Package FAQ</p>
          <h2 id="package-faq-title">Install and compatibility</h2>
          <dl className={shell.packageDetailList}>
            <div className={shell.packageDetailItem}>
              <dt>How to install</dt>
              <dd>Run {command} in a project that has AIPM initialized.</dd>
            </div>
            <div className={shell.packageDetailItem}>
              <dt>Supported tools</dt>
              <dd>
                {summary.name}@{summary.version} supports {targetLabel}.
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className={shell.panelSection} aria-labelledby="install-safety-title">
        <article className={shell.notice}>
          <h2 id="install-safety-title">Before installing</h2>
          <p>
            AIPM skills can add files to your project. Review the package name, target, description, license, and
            publisher before installing. Use a clean branch when trying a new skill.
          </p>
        </article>
      </section>
    </main>
  );
}
