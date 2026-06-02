import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyButton } from "../../../../../components/copy-button";
import {
  CLI_INSTALL_COMMAND,
  getPackage,
  installCommand,
  packagePath,
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
    integrity: pkg.integrity,
    sizeBytes: pkg.sizeBytes,
    createdAt: pkg.createdAt,
  };
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
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: "AIPM",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
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

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            name: summary.name,
            version: summary.version,
            description: summary.description,
            codeRepository: SITE_URL,
            programmingLanguage: "AI tool configuration",
            license: summary.license ?? undefined,
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
              <dd>{summary.sizeBytes.toLocaleString()} bytes</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
