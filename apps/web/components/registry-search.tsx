"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PackageCard } from "./package-card";
import type { PackageSummary } from "../lib/registry";

export function RegistrySearch({
  initialPackages,
  initialQuery = "",
  compact = false,
}: {
  initialPackages: PackageSummary[];
  initialQuery?: string;
  compact?: boolean;
}) {
  const [packages, setPackages] = useState(initialPackages);
  const [query, setQuery] = useState(initialQuery);
  const [target, setTarget] = useState("all");
  const [status, setStatus] = useState(
    initialPackages.length === 0
      ? "Loading skills"
      : initialPackages.length === 1
        ? "1 package found"
        : `${initialPackages.length} packages found`,
  );

  const filtered = useMemo(
    () => (target === "all" ? packages : packages.filter((pkg) => pkg.targets.includes(target))),
    [packages, target],
  );

  const search = useCallback(async (nextQuery: string) => {
    setStatus("Searching");
    const params = new URLSearchParams({ limit: compact ? "3" : "50" });
    if (nextQuery) params.set("q", nextQuery);
    try {
      const response = await fetch(`/v1/packages?${params}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = (await response.json()) as { packages?: PackageSummary[] };
      const nextPackages = data.packages ?? [];
      setPackages(nextPackages);
      setStatus(nextPackages.length === 1 ? "1 package found" : `${nextPackages.length} packages found`);
    } catch {
      setPackages([]);
      setStatus("Search unavailable");
    }
  }, [compact]);

  useEffect(() => {
    if (initialPackages.length === 0) void search(initialQuery.trim());
  }, [initialPackages.length, initialQuery, search]);

  return (
    <>
      <form
        className="search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          void search(query.trim());
        }}
      >
        <label htmlFor={compact ? "home-search-input" : "registry-search-input"}>
          Package, target, or description
        </label>
        <div className="search-row">
          <input
            id={compact ? "home-search-input" : "registry-search-input"}
            name="q"
            type="search"
            autoComplete="off"
            placeholder="@scope/name, cursor, claude..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Search</button>
        </div>
      </form>

      {!compact ? (
        <div className="filters" aria-label="Target filters">
          {["all", "cursor", "claude"].map((filter) => (
            <button
              className={`chip${target === filter ? " active" : ""}`}
              key={filter}
              type="button"
              onClick={() => setTarget(filter)}
            >
              {filter === "all" ? "All" : filter[0]?.toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      ) : null}

      <p className="muted">{status}</p>
      <div className={`results${compact ? " compact" : ""}`} aria-live="polite">
        {filtered.length > 0 ? (
          filtered.slice(0, compact ? 3 : filtered.length).map((pkg) => (
            <PackageCard compact={compact} key={`${pkg.name}@${pkg.version}`} pkg={pkg} />
          ))
        ) : (
          <div className="empty">
            No public skills are listed yet. Demo packages are hidden while starter skills are prepared.
          </div>
        )}
      </div>
    </>
  );
}
