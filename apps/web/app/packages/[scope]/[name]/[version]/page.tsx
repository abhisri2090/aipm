import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyButton } from "../../../../../components/copy-button";
import {
  CLI_INSTALL_COMMAND,
  formatBytes,
  getPackage,
  installCommand,
  installCommandForTarget,
  packagePath,
  SITE_URL,
  shortIntegrity,
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
    integrity: pkg.integrity,
    sizeBytes: pkg.sizeBytes,
    createdAt: pkg.createdAt,
    publisher: pkg.publisher,
  };
}

function packageKeywords(pkg: PackageSummary): string[] {
  return [
    pkg.name,
    `${pkg.name} ${pkg.version}`,
    "AIPM package",
    "AI skill",
    "AI skill registry",
    "prompt package",
    ...pkg.targets.map((target) => `${target} skill`),
  ];
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const { scope, name, version } = await params;
  const packageName = `@${decodeURIComponent(scope)}/${decodeURIComponent(name)}`;
  const pkg = await getPackage(packageName, decodeURIComponent(version));
  if (!pkg) return { title: "Package not found | AIPM" };
  const title = `${pkg.name}@${pkg.version}`;
  const description = pkg.manifest.description;
  const path = packagePath(pkg.name, pkg.version);
  return {
    title,
    description,
    keywords: packageKeywords(toSummary(pkg)),
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: "AIPM",
      type: "article",
      images: [
        {
          url: `${SITE_URL}/og.svg`,
          width: 1200,
          height: 630,
          alt: "AIPM Registry - project-ready AI skills and tool files",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og.svg`],
    },
  };
}

export default async function PackagePage({ params }: PackagePageProps) {
  const { scope, name, version } = await params;
  const packageName = `@${decodeURIComponent(scope)}/${decodeURIComponent(name)}`;
  const pkg = await getPackage(packageName, decodeURIComponent(version));
  if (!pkg) notFound();

  const summary = toSummary(pkg);
  const command = installCommand(summary);
  const allTargetCommands = summary.targets.map((target) => ({
    target,
    command: installCommandForTarget(summary, target),
  }));
  const canonicalUrl = `${SITE_URL}${packagePath(summary.name, summary.version)}`;
  const publisherName = summary.publisher
    ? `${summary.publisher.org.name} (${summary.publisher.user.name ?? `@${summary.publisher.user.githubLogin}`})`
    : "AIPM";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareSourceCode",
                "@id": `${canonicalUrl}#package`,
                name: summary.name,
                version: summary.version,
                description: summary.description,
                codeRepository: SITE_URL,
                programmingLanguage: "AI tool configuration",
                license: summary.license ?? undefined,
                targetProduct: summary.targets,
                datePublished: summary.createdAt,
                identifier: `${summary.name}@${summary.version}`,
                isAccessibleForFree: true,
                keywords: packageKeywords(summary).join(", "),
                maintainer: {
                  "@type": summary.publisher ? "Organization" : "Organization",
                  name: publisherName,
                },
              },
              {
                "@type": "HowTo",
                "@id": `${canonicalUrl}#install`,
                name: `Install ${summary.name}@${summary.version}`,
                description: `Install ${summary.name}@${summary.version} into a supported AI tool project with AIPM.`,
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
                    text: "aipm init",
                  },
                  {
                    "@type": "HowToStep",
                    name: "Install the skill",
                    text: command,
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
      <section className="page-header">
        <p className="eyebrow">AIPM package</p>
        <h1>
          {summary.name}@{summary.version}
        </h1>
        <p className="lede">{summary.description}</p>
      </section>

      <section className="detail-grid">
        <article className="panel step-card">
          <h2>Install this skill</h2>
          <p className="muted">Install the CLI once, initialize the project, then add this package.</p>
          <pre>
            <code>{`${CLI_INSTALL_COMMAND}\naipm init\n${command}`}</code>
          </pre>
          <CopyButton label="Copy install command" value={command} />
        </article>

        <aside className="panel step-card">
          <h2>Package details</h2>
          <dl className="definition-list">
            <div>
              <dt>Publisher</dt>
              <dd>
                {summary.publisher
                  ? `${summary.publisher.user.name ?? `@${summary.publisher.user.githubLogin}`} in @${summary.publisher.org.slug}`
                  : "Unavailable"}
              </dd>
            </div>
            <div>
              <dt>Package</dt>
              <dd>{summary.name}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{summary.version}</dd>
            </div>
            <div>
              <dt>Targets</dt>
              <dd>{summary.targets.join(", ")}</dd>
            </div>
            <div>
              <dt>License</dt>
              <dd>{summary.license ?? "Not specified"}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(summary.sizeBytes)}</dd>
            </div>
            <div>
              <dt>Integrity</dt>
              <dd title={summary.integrity}>{shortIntegrity(summary.integrity)}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{new Date(summary.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Entry</dt>
              <dd>{pkg.manifest.entry ?? "Not specified"}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="panel-section" aria-labelledby="publisher-title">
        <article className="panel step-card publisher-panel">
          <div>
            <p className="eyebrow">Publisher</p>
            <h2 id="publisher-title">
              {summary.publisher ? summary.publisher.org.name : "Publisher identity unavailable"}
            </h2>
            {summary.publisher ? (
              <p className="muted">
                Reserved under @{summary.publisher.org.slug} by{" "}
                {summary.publisher.user.name ?? `@${summary.publisher.user.githubLogin}`}. This package name is tied
                to an AIPM publisher account.
              </p>
            ) : (
              <p className="muted">
                This package was published before publisher identity was attached, or it was published through an
                admin-only path. Review it carefully before installing.
              </p>
            )}
          </div>
          {summary.publisher?.user.avatarUrl ? (
            <img alt="" className="avatar avatar-large" src={summary.publisher.user.avatarUrl} />
          ) : (
            <span className="avatar avatar-large">
              {(summary.publisher?.user.name ?? summary.publisher?.user.githubLogin ?? "A").charAt(0).toUpperCase()}
            </span>
          )}
        </article>
      </section>

      <section className="panel-section" aria-labelledby="target-install-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tool targets</p>
            <h2 id="target-install-title">Install command by target</h2>
          </div>
        </div>
        <div className="example-grid">
          {allTargetCommands.map((targetCommand) => (
            <article className="panel step-card" key={targetCommand.target}>
              <h3>{targetCommand.target}</h3>
              <pre>
                <code>{targetCommand.command}</code>
              </pre>
              <CopyButton label="Copy" value={targetCommand.command} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel-section" aria-labelledby="install-safety-title">
        <article className="notice">
          <h2 id="install-safety-title">Before installing</h2>
          <p>
            AIPM skills can write AI-tool files into your project. Review the package name, target,
            description, license, and source trust before installing. Use a clean branch when trying
            a new skill in an existing project.
          </p>
        </article>
      </section>
    </main>
  );
}
