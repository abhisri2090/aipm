"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api-client";
import { cn } from "../lib/class-names";
import {
  PROMPT_CATEGORIES,
  PROMPT_OUTPUT_FILTERS,
  displayPromptType,
  formatCopyCount,
  formatPromptDate,
  promptPath,
  type PromptSummary,
} from "../lib/prompts";
import { LoadMoreSentinel } from "./load-more-sentinel";
import styles from "./prompt-directory.module.css";

const PAGE_SIZE = 40;

type PromptsPage = {
  prompts: PromptSummary[];
  nextCursor?: string | null;
  nextOffset?: number | null;
  total?: number;
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function OutputMark({ output }: { output: string }) {
  const label = output === "structured-data" ? "{}" : output.slice(0, 1).toUpperCase();
  return (
    <span className={styles.outputMark} data-output={output} aria-hidden="true">
      {label}
    </span>
  );
}

function Publisher({ prompt }: { prompt: PromptSummary }) {
  const user = prompt.publisher.user;
  const displayName = prompt.publisher.org?.name ?? user.name ?? user.username;
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";
  return (
    <div className={styles.publisher}>
      {user.avatarUrl ? (
        <img alt="" src={user.avatarUrl} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
      <div>
        <strong>{displayName}</strong>
        <small>
          @{prompt.publisher.scope}
          {user.verified ? " · Verified" : ""}
        </small>
      </div>
    </div>
  );
}

function sampleImagePath(prompt: PromptSummary): string {
  return `/v1/prompts/${encodeURIComponent(prompt.publisher.scope)}/${encodeURIComponent(
    prompt.slug,
  )}/sample-image`;
}

export function PromptDirectory({
  initialPrompts,
  initialNextCursor = null,
  initialNextOffset = null,
  initialTotal = 0,
  initialQuery = "",
  initialCategory = "All",
  initialOutput = "all",
}: {
  initialPrompts: PromptSummary[];
  initialNextCursor?: string | null;
  initialNextOffset?: number | null;
  initialTotal?: number;
  initialQuery?: string;
  initialCategory?: string;
  initialOutput?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [prompts, setPrompts] = useState(initialPrompts);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory.trim() || "All");
  const [output, setOutput] = useState(
    PROMPT_OUTPUT_FILTERS.find((item) => item === initialOutput) ?? "all",
  );
  const [sort, setSort] = useState("newest");
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [nextOffset, setNextOffset] = useState<number | null>(initialNextOffset);
  const [total, setTotal] = useState(initialTotal || initialPrompts.length);
  const [loading, setLoading] = useState(initialPrompts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  function updateFilterUrl(nextCategory: string, nextOutput: string) {
    const params = new URLSearchParams(window.location.search);
    if (nextCategory === "All") params.delete("category");
    else params.set("category", nextCategory);
    if (nextOutput === "all") params.delete("output");
    else params.set("output", nextOutput);
    const search = params.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
  }

  const fetchPage = useCallback(
    async (options: {
      append: boolean;
      cursor?: string | null;
      offset?: number | null;
      queryValue: string;
      categoryValue: string;
      outputValue: string;
      sortValue: string;
    }) => {
      const requestId = ++requestIdRef.current;
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), sort: options.sortValue });
      if (options.queryValue.trim()) params.set("q", options.queryValue.trim());
      if (options.categoryValue !== "All") params.set("category", options.categoryValue);
      if (options.outputValue !== "all") params.set("output", options.outputValue);
      if (options.sortValue === "newest" && options.cursor) params.set("cursor", options.cursor);
      if (options.sortValue !== "newest" && options.offset != null && options.offset > 0) {
        params.set("offset", String(options.offset));
      }

      const data = await api<PromptsPage>(`/v1/prompts?${params}`, undefined, { silent: true });
      if (requestId !== requestIdRef.current) return;

      setTotal(data.total ?? data.prompts.length);
      setNextCursor(data.nextCursor ?? null);
      setNextOffset(data.nextOffset ?? null);
      setPrompts((current) => {
        if (!options.append) return data.prompts;
        const seen = new Set(current.map((prompt) => prompt.id));
        return [...current, ...data.prompts.filter((prompt) => !seen.has(prompt.id))];
      });
    },
    [],
  );

  useEffect(() => {
    if (initialPrompts.length > 0) return;
    let cancelled = false;
    setLoading(true);
    void fetchPage({
      append: false,
      queryValue: initialQuery,
      categoryValue: initialCategory.trim() || "All",
      outputValue: PROMPT_OUTPUT_FILTERS.find((item) => item === initialOutput) ?? "all",
      sortValue: "newest",
    })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, initialCategory, initialOutput, initialPrompts.length, initialQuery]);

  const reload = useCallback(
    async (next: {
      queryValue?: string;
      categoryValue?: string;
      outputValue?: string;
      sortValue?: string;
    }) => {
      setLoading(true);
      setNextCursor(null);
      setNextOffset(null);
      try {
        await fetchPage({
          append: false,
          queryValue: next.queryValue ?? query,
          categoryValue: next.categoryValue ?? category,
          outputValue: next.outputValue ?? output,
          sortValue: next.sortValue ?? sort,
        });
      } catch {
        setPrompts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [category, fetchPage, output, query, sort],
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    if (sort === "newest" && !nextCursor) return;
    if (sort !== "newest" && nextOffset == null) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await fetchPage({
        append: true,
        cursor: nextCursor,
        offset: nextOffset,
        queryValue: query,
        categoryValue: category,
        outputValue: output,
        sortValue: sort,
      });
    } catch {
      setNextCursor(null);
      setNextOffset(null);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [category, fetchPage, nextCursor, nextOffset, output, query, sort]);

  const categories = useMemo(
    () =>
      [...PROMPT_CATEGORIES, ...prompts.map((prompt) => prompt.category)].filter(
        (item, index, list) => list.indexOf(item) === index,
      ),
    [prompts],
  );

  const hasFilters = query.trim() || category !== "All" || output !== "all";
  const hasMore = sort === "newest" ? Boolean(nextCursor) : nextOffset != null;

  return (
    <div className={styles.directory}>
      <form
        className={styles.searchBar}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          void reload({ queryValue: query });
        }}
      >
        <SearchIcon />
        <label className={styles.srOnly} htmlFor="prompt-search">
          Search prompts
        </label>
        <input
          id="prompt-search"
          type="search"
          autoComplete="off"
          placeholder="Search by task, tag, publisher, or output…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>

      <div className={styles.filterPanel} aria-label="Prompt filters">
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Category</span>
          <div className={styles.chips}>
            {categories.map((item) => (
              <button
                className={cn(styles.chip, category === item && styles.chipActive)}
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  updateFilterUrl(item, output);
                  void reload({ categoryValue: item });
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Output</span>
          <div className={styles.chips}>
            {PROMPT_OUTPUT_FILTERS.map((item) => (
              <button
                className={cn(styles.chip, output === item && styles.chipActive)}
                key={item}
                type="button"
                onClick={() => {
                  setOutput(item);
                  updateFilterUrl(category, item);
                  void reload({ outputValue: item });
                }}
              >
                {displayPromptType(item)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.resultsHeader}>
        <p aria-live="polite">
          <strong>{total}</strong> {total === 1 ? "prompt" : "prompts"}
          {hasMore ? ` · showing ${prompts.length}` : ""}
        </p>
        <label className={styles.sortLabel}>
          Sort
          <select
            value={sort}
            onChange={(event) => {
              const nextSort = event.target.value;
              setSort(nextSort);
              void reload({ sortValue: nextSort });
            }}
          >
            <option value="newest">Recently updated</option>
            <option value="popular">Most copied</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
      </div>

      {prompts.length ? (
        <>
          <div className={styles.promptGrid}>
            {prompts.map((prompt) => (
              <article className={styles.promptCard} key={prompt.id}>
                <Link
                  className={styles.cardLink}
                  href={promptPath(prompt)}
                  aria-label={`Open ${prompt.title}`}
                />
                <div className={styles.cardTopline}>
                  <OutputMark output={prompt.outputTypes[0] ?? "text"} />
                  <span className={styles.categoryBadge}>{prompt.category}</span>
                </div>
                {prompt.outputTypes.includes("image") && prompt.hasSampleImage ? (
                  <img
                    alt=""
                    className={styles.sampleImage}
                    decoding="async"
                    loading="lazy"
                    src={sampleImagePath(prompt)}
                  />
                ) : null}
                <div className={styles.cardContent}>
                  <h2>{prompt.title}</h2>
                  <p>{prompt.summary}</p>
                </div>
                <div className={styles.tags} aria-label="Tags">
                  {prompt.tags.slice(0, 4).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
                <dl className={styles.cardFacts}>
                  <div>
                    <dt>Output</dt>
                    <dd>{prompt.outputTypes.map(displayPromptType).join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Input</dt>
                    <dd>{prompt.inputTypes.map(displayPromptType).join(", ")}</dd>
                  </div>
                </dl>
                <Publisher prompt={prompt} />
                <footer className={styles.cardFooter}>
                  {prompt.copyCount >= 2 ? (
                    <span>{formatCopyCount(prompt.copyCount)}</span>
                  ) : null}
                  <span>Updated {formatPromptDate(prompt.updatedAt)}</span>
                  {prompt.canEdit ? (
                    <Link
                      className={styles.editLink}
                      href={`${promptPath(prompt)}/edit`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      Edit
                    </Link>
                  ) : null}
                </footer>
              </article>
            ))}
          </div>
          <LoadMoreSentinel
            enabled={hasMore}
            loading={loadingMore}
            onLoadMore={() => void loadMore()}
            label="Loading more prompts…"
          />
        </>
      ) : (
        <div className={styles.emptyState}>
          <h2>
            {loading
              ? "Loading prompts…"
              : hasFilters
                ? "No prompts match those filters."
                : "Be the first to publish a prompt."}
          </h2>
          <p>
            {hasFilters
              ? "Try a broader search, a different output, or clear the filters."
              : "Share a useful prompt with clear inputs, tested models, and an example output."}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All");
                setOutput("all");
                updateFilterUrl("All", "all");
                void reload({
                  queryValue: "",
                  categoryValue: "All",
                  outputValue: "all",
                });
              }}
            >
              Clear filters
            </button>
          ) : (
            <Link className={styles.emptyLink} href="/prompts/new">
              List a prompt
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
