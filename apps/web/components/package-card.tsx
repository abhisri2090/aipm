import Link from "next/link";
import { CopyButton } from "./copy-button";
import {
  displayTargets,
  formatBytes,
  GITHUB_LOGIN_URL,
  installCommand,
  isUnverifiedImportedPackage,
  packagePath,
  shortIntegrity,
  type PackageSummary,
} from "../lib/registry";
import cards from "../app/cards.module.css";
import shell from "../app/page-shell.module.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PackageCard({ pkg, compact = false }: { pkg: PackageSummary; compact?: boolean }) {
  const command = installCommand(pkg);

  return (
    <article className={cards.resultCard}>
      <div>
        <h3>
          <Link href={packagePath(pkg.name, pkg.version)}>
            {pkg.name}@{pkg.version}
          </Link>
        </h3>
        <p>{pkg.description}</p>
        {pkg.publisher ? (
          <p className={cards.publisherLine}>
            Published by {pkg.publisher.user.name ?? `@${pkg.publisher.user.githubLogin}`} in @
            {pkg.publisher.org.slug}
          </p>
        ) : (
          <p className={cards.publisherLine}>Publisher identity unavailable</p>
        )}
        <div className={cards.meta}>
          <span className={cards.pill}>{pkg.type}</span>
          {isUnverifiedImportedPackage(pkg) ? (
            <span className={cards.pill}>Imported · Unverified</span>
          ) : null}
          {displayTargets(pkg.targets).map((target) => (
            <span className={cards.pill} key={target}>
              {target}
            </span>
          ))}
          <span className={cards.pill}>{formatDate(pkg.createdAt)}</span>
          <span className={cards.pill}>{formatBytes(pkg.sizeBytes)}</span>
          <span className={cards.pill}>{pkg.license ?? "No license"}</span>
        </div>
        {!compact && isUnverifiedImportedPackage(pkg) ? (
          <p className={cards.publisherLine}>
            {pkg.import?.sourceUrl ? (
              <>
                Imported from{" "}
                <a href={pkg.import.sourceUrl} rel="noreferrer" target="_blank">
                  source
                </a>
                .{" "}
              </>
            ) : null}
            <a href={GITHUB_LOGIN_URL}>Claim this skill</a>
          </p>
        ) : null}
        {!compact ? <p className={cards.packageIntegrity}>Integrity {shortIntegrity(pkg.integrity)}</p> : null}
      </div>
      <div className={cards.cardActions}>
        <CopyButton value={command} />
        {!compact ? (
          <Link className={shell.textLink} href={packagePath(pkg.name, pkg.version)}>
            Details
          </Link>
        ) : null}
      </div>
    </article>
  );
}
