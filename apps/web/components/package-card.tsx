import Link from "next/link";
import { CopyButton } from "./copy-button";
import {
  displayTargets,
  formatBytes,
  formatInstallCount,
  GITHUB_LOGIN_URL,
  installCommand,
  isUnverifiedImportedPackage,
  packagePath,
  parsePackageName,
  type PackageSummary,
} from "../lib/registry";
import cards from "../app/cards.module.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PackageTitle({ pkg }: { pkg: PackageSummary }) {
  const { scope, skillName } = parsePackageName(pkg.name);
  const orgName = pkg.publisher?.org.name ?? scope;
  const avatarUrl = pkg.publisher?.user.avatarUrl;
  const avatarLabel =
    pkg.publisher?.user.name ?? pkg.publisher?.user.githubLogin ?? pkg.publisher?.org.name ?? scope;
  const initial = avatarLabel.trim().charAt(0).toUpperCase() || "A";

  return (
    <h3 className={cards.packageTitle}>
      {avatarUrl ? (
        <img alt="" className={cards.packageTitleAvatar} src={avatarUrl} />
      ) : (
        <span aria-hidden="true" className={cards.packageTitleAvatar}>
          {initial}
        </span>
      )}
      <span className={cards.packageTitleText}>
        <span className={cards.packageTitleOrg}>{orgName}/</span>
        <span>{skillName}</span>
      </span>
    </h3>
  );
}

export function PackageCard({ pkg, compact = false }: { pkg: PackageSummary; compact?: boolean }) {
  const command = installCommand(pkg);
  const skillPath = packagePath(pkg.name, pkg.version);

  return (
    <article className={cards.resultCard}>
      <Link href={skillPath} className={cards.resultCardOverlay} aria-label={`View ${pkg.name}`} />
      <div className={cards.resultCardBody}>
        <PackageTitle pkg={pkg} />
        <p className={cards.resultDescription}>{pkg.description}</p>
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
          {(pkg.categories ?? []).slice(0, 2).map((category) => (
            <span className={cards.pill} key={`category-${category}`}>
              {category}
            </span>
          ))}
          {(pkg.tags ?? []).slice(0, compact ? 1 : 3).map((tag) => (
            <span className={cards.pill} key={`tag-${tag}`}>
              {tag}
            </span>
          ))}
          <span className={cards.pill}>{formatDate(pkg.createdAt)}</span>
          {pkg.installCount && pkg.installCount > 0 ? (
            <span className={cards.pill}>{formatInstallCount(pkg.installCount)}</span>
          ) : null}
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
        <CopyButton label="Add" showCopyIcon value={command} />
      </div>
    </article>
  );
}
