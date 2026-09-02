"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import styles from "./prompt-directory.module.css";

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
  initialQuery = "",
  initialCategory = "All",
  initialOutput = "all",
}: {
  initialPrompts: PromptSummary[];
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
  const [loading, setLoading] = useState(initialPrompts.length === 0);

  function updateFilterUrl(nextCategory: string, nextOutput: string) {
    const params = new URLSearchParams(window.location.search);
    if (nextCategory === "All") params.delete("category");
    else params.set("category", nextCategory);
    if (nextOutput === "all") params.delete("output");
    else params.set("output", nextOutput);
    const search = params.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
  }

  useEffect(() => {
    let cancelled = false;
    void api<{ prompts: PromptSummary[] }>("/v1/prompts?limit=100", undefined, {
      silent: true,
    })
      .then((data) => {
        if (!cancelled) setPrompts(data.prompts);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () =>
      [...PROMPT_CATEGORIES, ...prompts.map((prompt) => prompt.category)].filter(
        (item, index, list) => list.indexOf(item) === index,
      ),
    [prompts],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextPrompts = prompts.filter((prompt) => {
      const searchable = [
        prompt.title,
        prompt.summary,
        prompt.category,
        prompt.publisher.scope,
        prompt.publisher.user.name ?? "",
        ...prompt.tags,
        ...prompt.inputTypes,
        ...prompt.outputTypes,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === "All" ||
          prompt.category.toLowerCase() === category.toLowerCase()) &&
        (output === "all" || prompt.outputTypes.includes(output))
      );
    });

    return [...nextPrompts].sort((left, right) => {
      if (sort === "popular") return right.copyCount - left.copyCount;
      if (sort === "title") return left.title.localeCompare(right.title);
      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }, [category, output, prompts, query, sort]);

  const hasFilters = query.trim() || category !== "All" || output !== "all";

  return (
    <div className={styles.directory}>
      <div className={styles.searchBar}>
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
      </div>

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
          <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "prompt" : "prompts"}
        </p>
        <label className={styles.sortLabel}>
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Recently updated</option>
            <option value="popular">Most copied</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
      </div>

      {filtered.length ? (
        <div className={styles.promptGrid}>
          {filtered.map((prompt) => (
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
              </footer>
            </article>
          ))}
        </div>
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
