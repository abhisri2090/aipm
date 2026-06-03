import Link from "next/link";
import { CopyButton } from "./copy-button";
import {
  formatBytes,
  installCommand,
  packagePath,
  shortIntegrity,
  type PackageSummary,
} from "../lib/registry";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PackageCard({ pkg, compact = false }: { pkg: PackageSummary; compact?: boolean }) {
  const command = installCommand(pkg);

  return (
    <article className={`result-card${compact ? " compact-card" : ""}`}>
      <div>
        <h3>
          <Link href={packagePath(pkg.name, pkg.version)}>
            {pkg.name}@{pkg.version}
          </Link>
        </h3>
        <p>{pkg.description}</p>
        {pkg.publisher ? (
          <p className="publisher-line">
            Published by {pkg.publisher.user.name ?? `@${pkg.publisher.user.githubLogin}`} in @
            {pkg.publisher.org.slug}
          </p>
        ) : (
          <p className="publisher-line">Publisher identity unavailable</p>
        )}
        <div className="meta">
          <span className="pill">{pkg.type}</span>
          {pkg.targets.map((target) => (
            <span className="pill" key={target}>
              {target}
            </span>
          ))}
          <span className="pill">{formatDate(pkg.createdAt)}</span>
          <span className="pill">{formatBytes(pkg.sizeBytes)}</span>
          <span className="pill">{pkg.license ?? "No license"}</span>
        </div>
        {!compact ? <p className="package-integrity">Integrity {shortIntegrity(pkg.integrity)}</p> : null}
      </div>
      <div className="card-actions">
        <CopyButton value={command} />
        {!compact ? (
          <Link className="text-link" href={packagePath(pkg.name, pkg.version)}>
            Details
          </Link>
        ) : null}
      </div>
    </article>
  );
}
