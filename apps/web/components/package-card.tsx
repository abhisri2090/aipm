import Link from "next/link";
import { CopyButton } from "./copy-button";
import { installCommand, packagePath, type PackageSummary } from "../lib/registry";

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
        <div className="meta">
          <span className="pill">{pkg.type}</span>
          {pkg.targets.map((target) => (
            <span className="pill" key={target}>
              {target}
            </span>
          ))}
          <span className="pill">{formatDate(pkg.createdAt)}</span>
        </div>
      </div>
      <CopyButton value={command} />
    </article>
  );
}
