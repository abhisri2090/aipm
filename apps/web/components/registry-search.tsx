"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PackageCard } from "./package-card";
import { LoadMoreSentinel } from "./load-more-sentinel";
import { api } from "../lib/api-client";
import { PACKAGE_TARGET_FILTERS, type PackageSummary } from "../lib/registry";
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
  nextOffset?: number | null;
};

function collectCategories(current: string[], packages: PackageSummary[]): string[] {
  const seen = new Set(current);
  for (const pkg of packages) {
    for (const category of pkg.categories ?? []) seen.add(category);
  }
  return [...seen];
}

export function RegistrySearch({
  initialPackages,
  initialNextCursor = null,
  initialNextOffset = null,
  initialQuery = "",
  initialCategory = "All",
  initialTarget = "all",
  initialSort = "newest",
  compact = false,
}: {
  initialPackages: PackageSummary[];
  initialNextCursor?: string | null;
  initialNextOffset?: number | null;
  initialQuery?: string;
  initialCategory?: string;
  initialTarget?: string;
  initialSort?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [packages, setPackages] = useState(initialPackages);
  const [query, setQuery] = useState(initialQuery);
  const [target, setTarget] = useState(
    PACKAGE_TARGET_FILTERS.find((item) => item === initialTarget) ?? "all",
  );
  const [category, setCategory] = useState(initialCategory.trim() || "All");
  const [sort, setSort] = useState(initialSort || "newest");
  const [categories, setCategories] = useState<string[]>(() =>
    collectCategories([], initialPackages),
  );
  const [nextCursor, setNextCursor] = useState<string | null>(
    compact ? null : initialNextCursor,
  );
  const [nextOffset, setNextOffset] = useState<number | null>(initialNextOffset);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState(
    initialPackages.length === 0
      ? "Loading skills"
      : initialPackages.length === 1
        ? "1 skill loaded"
        : `${initialPackages.length} skills loaded`,
  );
  const loadingMoreRef = useRef(false);

  function updateFilterUrl(nextCategory: string, nextTarget: string, nextSort: string) {
    if (compact) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("page");
    if (nextCategory === "All") params.delete("category");
    else params.set("category", nextCategory);
    if (nextTarget === "all") params.delete("target");
    else params.set("target", nextTarget);
    if (nextSort === "newest") params.delete("sort");
    else params.set("sort", nextSort);
    const search = params.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
  }

  const updateStatus = useCallback((count: number, hasMore: boolean) => {
    if (count === 0) {
      setStatus("No skills found");
      return;
    }
    const label = count === 1 ? "1 skill loaded" : `${count} skills loaded`;
    setStatus(hasMore ? `${label} · scroll for more` : label);
  }, []);

  const search = useCallback(
    async (options: { queryValue?: string; categoryValue?: string; targetValue?: string; sortValue?: string }) => {
      setStatus("Searching");
      const queryValue = options.queryValue ?? query;
      const categoryValue = options.categoryValue ?? category;
      const targetValue = options.targetValue ?? target;
      const sortValue = options.sortValue ?? sort;
      const params = new URLSearchParams({
        limit: compact ? "3" : String(PAGE_SIZE),
        sort: sortValue,
      });
      if (queryValue.trim()) params.set("q", queryValue.trim());
      if (categoryValue !== "All") params.set("category", categoryValue);
      if (targetValue !== "all") params.set("target", targetValue);
      try {
        const data = await api<PackagesPage>(`/v1/packages?${params}`);
        const nextPackages = data.packages ?? [];
        const cursor = compact ? null : (data.nextCursor ?? null);
        const offset = compact ? null : (data.nextOffset ?? null);
        setPackages(nextPackages);
        setCategories((current) => collectCategories(current, nextPackages));
        setNextCursor(cursor);
        setNextOffset(offset);
        updateStatus(nextPackages.length, Boolean(cursor) || offset != null);
      } catch (error) {
        setPackages([]);
        setNextCursor(null);
        setNextOffset(null);
        setStatus(publicApiError(error));
      }
    },
    [category, compact, query, sort, target, updateStatus],
  );

  const loadMore = useCallback(async () => {
    if (compact || loadingMoreRef.current) return;
    if (sort === "newest" && !nextCursor) return;
    if (sort !== "newest" && nextOffset == null) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), sort });
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All") params.set("category", category);
    if (target !== "all") params.set("target", target);
    if (sort === "newest" && nextCursor) params.set("cursor", nextCursor);
    if (sort !== "newest" && nextOffset != null) params.set("offset", String(nextOffset));
    try {
      const data = await api<PackagesPage>(`/v1/packages?${params}`);
      const nextPackages = data.packages ?? [];
      const cursor = data.nextCursor ?? null;
      const offset = data.nextOffset ?? null;
      setPackages((current) => {
        const seen = new Set(current.map((pkg) => pkg.name));
        const merged = [...current, ...nextPackages.filter((pkg) => !seen.has(pkg.name))];
        updateStatus(merged.length, Boolean(cursor) || offset != null);
        return merged;
      });
      setCategories((current) => collectCategories(current, nextPackages));
      setNextCursor(cursor);
      setNextOffset(offset);
    } catch (error) {
      setStatus(publicApiError(error));
      setNextCursor(null);
      setNextOffset(null);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [category, compact, nextCursor, nextOffset, query, sort, target, updateStatus]);

  const didBootstrap = useRef(false);
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    if (initialPackages.length === 0) void search({ queryValue: initialQuery.trim() });
  }, [initialPackages.length, initialQuery, search]);

  const hasMore = sort === "newest" ? Boolean(nextCursor) : nextOffset != null;

  return (
    <>
      <form
        className={styles.searchForm}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          void search({ queryValue: query });
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
            <span className={styles.filterLabel}>Category</span>
            <div className={styles.filters} aria-label="Category filters">
              {["All", ...categories].map((item) => (
                <button
                  className={cn(styles.chip, category === item && styles.chipActive)}
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory(item);
                    updateFilterUrl(item, target, sort);
                    void search({ categoryValue: item });
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Tool</span>
            <div className={styles.filters} aria-label="Target filters">
              {PACKAGE_TARGET_FILTERS.map((filter) => (
                <button
                  className={cn(styles.chip, target === filter && styles.chipActive)}
                  key={filter}
                  type="button"
                  onClick={() => {
                    setTarget(filter);
                    updateFilterUrl(category, filter, sort);
                    void search({ targetValue: filter });
                  }}
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
                      void search({ queryValue: nextQuery });
                    }}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.resultsHeader}>
            <p className={shell.muted}>{status}</p>
            <label className={styles.sortLabel}>
              Sort
              <select
                value={sort}
                onChange={(event) => {
                  const nextSort = event.target.value;
                  setSort(nextSort);
                  updateFilterUrl(category, target, nextSort);
                  void search({ sortValue: nextSort });
                }}
              >
                <option value="newest">Recently updated</option>
                <option value="popular">Most installed</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>
          </div>
        </>
      ) : (
        <p className={shell.muted}>{status}</p>
      )}

      <div className={cards.results} aria-live="polite">
        {packages.length > 0 ? (
          packages
            .slice(0, compact ? 3 : packages.length)
            .map((pkg) => <PackageCard compact={compact} key={pkg.name} pkg={pkg} />)
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
          enabled={hasMore}
          loading={loadingMore}
          onLoadMore={() => void loadMore()}
          label="Loading more skills…"
        />
      ) : null}
    </>
  );
}
