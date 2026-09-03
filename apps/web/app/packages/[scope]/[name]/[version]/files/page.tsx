import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageFilesExplorer } from "../../../../../../components/package-files-explorer";
import { shell, cn } from "../../../../../../lib/page-styles";
import {
  getPackage,
  packagePath,
  packageShortName,
  SITE_URL,
} from "../../../../../../lib/registry";

type PackageFilesPageProps = {
  params: Promise<{ scope: string; name: string; version: string }>;
};

export async function generateMetadata({ params }: PackageFilesPageProps): Promise<Metadata> {
  const { scope, name, version } = await params;
  const packageName = `@${decodeURIComponent(scope)}/${decodeURIComponent(name)}`;
  const pkg = await getPackage(packageName, decodeURIComponent(version));
  if (!pkg) return { title: "Package not found | AIPM" };

  const title = `${pkg.name}@${pkg.version} files`;
  const path = packagePath(pkg.name, pkg.version);
  return {
    title,
    description: `Browse files bundled in ${pkg.name}@${pkg.version}.`,
    alternates: { canonical: `${SITE_URL}${path}` },
    robots: { index: false, follow: true },
  };
}

export default async function PackageFilesPage({ params }: PackageFilesPageProps) {
  const { scope, name, version } = await params;
  const packageName = `@${decodeURIComponent(scope)}/${decodeURIComponent(name)}`;
  const pkg = await getPackage(packageName, decodeURIComponent(version));
  if (!pkg) notFound();

  return (
    <main>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Package content</p>
        <h1>
          {packageShortName(pkg.name)}@{pkg.version}
        </h1>
        <p className={shell.lede}>Browse manifest, skill files, and license bundled in this package.</p>
        <div className={shell.actions}>
          <Link className={cn(shell.button, shell.secondary)} href={packagePath(pkg.name, pkg.version)}>
            Back to package
          </Link>
        </div>
      </section>

      <PackageFilesExplorer
        packageName={pkg.name}
        version={pkg.version}
        entryPath={pkg.manifest.entry}
        hideHeading
      />
    </main>
  );
}
