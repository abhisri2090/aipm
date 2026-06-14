import Link from "next/link";
import { CopyButton } from "./copy-button";
import {
  displayTargets,
  formatBytes,
  GITHUB_LOGIN_URL,
  installCommand,
  isUnverifiedImportedPackage,
  packagePath,
  type PackageSummary,
} from "../lib/registry";
import cards from "../app/cards.module.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PackageCard({ pkg, compact = false }: { pkg: PackageSummary; compact?: boolean }) {
  const command = installCommand(pkg);
  const skillPath = packagePath(pkg.name, pkg.version);

  return (
    <article className={cards.resultCard}>
      <Link href={skillPath} className={cards.resultCardOverlay} aria-label={`View ${pkg.description}`} />
      <div className={cards.resultCardBody}>
        <h3>{pkg.description}</h3>
        {pkg.publisher ? (
          <p className={cards.publisherLine}>
            Published by {pkg.publisher.user.name ?? `@${pkg.publisher.user.githubLogin}`}
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
          <p className={cards.claimLine}>
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
      </div>
      <div className={cards.cardActions}>
        <CopyButton value={command} />
      </div>
    </article>
  );
}
