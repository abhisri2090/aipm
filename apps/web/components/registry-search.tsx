"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PackageCard } from "./package-card";
import { LoadMoreSentinel } from "./load-more-sentinel";
import { api } from "../lib/api-client";
import type { PackageSummary } from "../lib/registry";
import { publicApiError } from "../lib/public-api-error";
import { cn } from "../lib/class-names";
import cards from "../app/cards.module.css";
import shell from "../app/page-shell.module.css";
import styles from "./registry-search.module.css";

const QUICK_FILTERS = [
  { label: "Code review", query: "code review" },
  { label: "Issue summarizer", query: "issue summarizer" },
  { label: "Testing", query: "testing" },
  { label: "Documentation", query: "documentation" },
] as const;

const PAGE_SIZE = 20;

type PackagesPage = {
  packages?: PackageSummary[];
  nextCursor?: string | null;
};

export function RegistrySearch({
  initialPackages,
  initialNextCursor = null,
  initialQuery = "",
  compact = false,
}: {
  initialPackages: PackageSummary[];
  initialNextCursor?: string | null;
  initialQuery?: string;
  compact?: boolean;
}) {
  const [packages, setPackages] = useState(initialPackages);
  const [query, setQuery] = useState(initialQuery);
  const [target, setTarget] = useState("all");
  const [nextCursor, setNextCursor] = useState<string | null>(
    compact ? null : initialNextCursor,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState(
    initialPackages.length === 0
      ? "Loading skills"
      : initialPackages.length === 1
        ? "1 skill loaded"
        : `${initialPackages.length} skills loaded`,
  );
  const loadingMoreRef = useRef(false);

  const filtered = useMemo(
    () =>
      target === "all"
        ? packages
        : packages.filter(
            (pkg) => pkg.targets.includes(target) || pkg.targets.includes("*"),
          ),
    [packages, target],
  );

  const updateStatus = useCallback((count: number, hasMore: boolean) => {
    if (count === 0) {
      setStatus("No skills found");
      return;
    }
    const label = count === 1 ? "1 skill loaded" : `${count} skills loaded`;
    setStatus(hasMore ? `${label} · scroll for more` : label);
  }, []);

  const search = useCallback(
    async (nextQuery: string) => {
      setStatus("Searching");
      const params = new URLSearchParams({ limit: compact ? "3" : String(PAGE_SIZE) });
      if (nextQuery) params.set("q", nextQuery);
      try {
        const data = await api<PackagesPage>(`/v1/packages?${params}`);
        const nextPackages = data.packages ?? [];
        const cursor = compact ? null : (data.nextCursor ?? null);
        setPackages(nextPackages);
        setNextCursor(cursor);
        updateStatus(nextPackages.length, Boolean(cursor));
      } catch (error) {
        setPackages([]);
        setNextCursor(null);
        setStatus(publicApiError(error));
      }
    },
    [compact, updateStatus],
  );

  const loadMore = useCallback(async () => {
    if (compact || !nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      cursor: nextCursor,
    });
    if (query.trim()) params.set("q", query.trim());
    try {
      const data = await api<PackagesPage>(`/v1/packages?${params}`);
      const nextPackages = data.packages ?? [];
      const cursor = data.nextCursor ?? null;
      setPackages((current) => {
        const seen = new Set(current.map((pkg) => pkg.name));
        const merged = [...current, ...nextPackages.filter((pkg) => !seen.has(pkg.name))];
        updateStatus(merged.length, Boolean(cursor));
        return merged;
      });
      setNextCursor(cursor);
    } catch (error) {
      setStatus(publicApiError(error));
      setNextCursor(null);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [compact, nextCursor, query, updateStatus]);

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
        <>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Tool</span>
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
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Intent</span>
            <div className={styles.filters} aria-label="Skill intent filters">
              {QUICK_FILTERS.map((filter) => {
                const selected = query === filter.query;
                return (
                  <button
                    className={cn(styles.chip, selected && styles.chipActive)}
                    key={filter.query}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      const nextQuery = selected ? "" : filter.query;
                      setQuery(nextQuery);
                      void search(nextQuery);
                    }}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <p className={shell.muted}>{status}</p>
      <div className={cards.results} aria-live="polite">
        {filtered.length > 0 ? (
          filtered.slice(0, compact ? 3 : filtered.length).map((pkg) => (
            <PackageCard compact={compact} key={pkg.name} pkg={pkg} />
          ))
        ) : (
          <div className={shell.empty}>
            {status === "Search unavailable" || status.includes("timed out")
              ? "The public registry API is not responding right now. Docs and guides are still available."
              : "No public skills are listed yet. Demo packages are hidden while starter skills are prepared."}
          </div>
        )}
      </div>
      {!compact ? (
        <LoadMoreSentinel
          enabled={Boolean(nextCursor)}
          loading={loadingMore}
          onLoadMore={() => void loadMore()}
          label="Loading more skills…"
        />
      ) : null}
    </>
  );
}
