"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PackageCard } from "./package-card";
import type { PackageSummary } from "../lib/registry";
import { cn } from "../lib/class-names";
import cards from "../app/cards.module.css";
import shell from "../app/page-shell.module.css";
import styles from "./registry-search.module.css";

function publicSearchError(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Registry API timed out. It may be offline or starting.";
  }
  return "Search unavailable";
}

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
    () =>
      target === "all"
        ? packages
        : packages.filter(
            (pkg) => pkg.targets.includes(target) || pkg.targets.includes("*"),
          ),
    [packages, target],
  );

  const search = useCallback(async (nextQuery: string) => {
    setStatus("Searching");
    const params = new URLSearchParams({ limit: compact ? "3" : "50" });
    if (nextQuery) params.set("q", nextQuery);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`/v1/packages?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = (await response.json()) as { packages?: PackageSummary[] };
      const nextPackages = data.packages ?? [];
      setPackages(nextPackages);
      setStatus(nextPackages.length === 1 ? "1 package found" : `${nextPackages.length} packages found`);
    } catch (error) {
      setPackages([]);
      setStatus(publicSearchError(error));
    } finally {
      window.clearTimeout(timeout);
    }
  }, [compact]);

  useEffect(() => {
    if (initialPackages.length === 0) void search(initialQuery.trim());
  }, [initialPackages.length, initialQuery, search]);

  return (
    <>
      <form
        className={styles.searchForm}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          void search(query.trim());
        }}
      >
        <label htmlFor={compact ? "home-search-input" : "registry-search-input"}>
          Package, target, or description
        </label>
        <div className={styles.searchRow}>
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
        <div className={styles.filters} aria-label="Target filters">
          {["all", "cursor", "claude"].map((filter) => (
            <button
              className={cn(styles.chip, target === filter && styles.chipActive)}
              key={filter}
              type="button"
              onClick={() => setTarget(filter)}
            >
              {filter === "all" ? "All" : filter[0]?.toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      ) : null}

      <p className={shell.muted}>{status}</p>
      <div className={cards.results} aria-live="polite">
        {filtered.length > 0 ? (
          filtered.slice(0, compact ? 3 : filtered.length).map((pkg) => (
            <PackageCard compact={compact} key={`${pkg.name}@${pkg.version}`} pkg={pkg} />
          ))
        ) : (
          <div className={shell.empty}>
            {status === "Search unavailable" || status.includes("timed out")
              ? "The public registry API is not responding right now. Docs and guides are still available."
              : "No public skills are listed yet. Demo packages are hidden while starter skills are prepared."}
          </div>
        )}
      </div>
    </>
  );
}
