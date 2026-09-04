"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { api } from "../lib/api-client";
import { publicApiError } from "../lib/public-api-error";
import { publisherPath, type PublisherSummary } from "../lib/registry";
import { cn } from "../lib/class-names";
import { LoadMoreSentinel } from "./load-more-sentinel";
import cards from "../app/cards.module.css";
import shell from "../app/page-shell.module.css";
import styles from "./publishers-directory.module.css";

const PAGE_SIZE = 24;

type PublishersPage = {
  publishers?: PublisherSummary[];
  nextCursor?: string | null;
};

export function PublishersDirectory({
  initialPublishers,
  initialNextCursor = null,
  initialQuery = "",
}: {
  initialPublishers: PublisherSummary[];
  initialNextCursor?: string | null;
  initialQuery?: string;
}) {
  const [publishers, setPublishers] = useState(initialPublishers);
  const [query, setQuery] = useState(initialQuery);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState(
    initialPublishers.length === 0
      ? "Loading publishers"
      : `${initialPublishers.length} publishers loaded`,
  );
  const loadingMoreRef = useRef(false);

  const search = useCallback(async (nextQuery: string) => {
    setStatus("Searching");
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (nextQuery) params.set("q", nextQuery);
    try {
      const data = await api<PublishersPage>(`/v1/publishers?${params}`);
      const next = data.publishers ?? [];
      const cursor = data.nextCursor ?? null;
      setPublishers(next);
      setNextCursor(cursor);
      setStatus(
        next.length === 0
          ? "No publishers found"
          : cursor
            ? `${next.length} publishers loaded · scroll for more`
            : `${next.length} publishers loaded`,
      );
    } catch (error) {
      setPublishers([]);
      setNextCursor(null);
      setStatus(publicApiError(error));
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      cursor: nextCursor,
    });
    if (query.trim()) params.set("q", query.trim());
    try {
      const data = await api<PublishersPage>(`/v1/publishers?${params}`);
      const next = data.publishers ?? [];
      const cursor = data.nextCursor ?? null;
      setPublishers((current) => {
        const seen = new Set(current.map((item) => item.slug));
        const merged = [...current, ...next.filter((item) => !seen.has(item.slug))];
        setStatus(
          cursor
            ? `${merged.length} publishers loaded · scroll for more`
            : `${merged.length} publishers loaded`,
        );
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
  }, [nextCursor, query]);

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
        <label htmlFor="publishers-search-input">Publisher name or handle</label>
        <div className={styles.searchRow}>
          <input
            id="publishers-search-input"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="anthropics, coreyhaines31…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Search</button>
        </div>
      </form>

      <p className={shell.muted}>{status}</p>
      <div className={styles.grid} aria-live="polite">
        {publishers.length > 0 ? (
          publishers.map((publisher) => {
            const avatar = publisher.avatarUrl ?? publisher.user.avatarUrl;
            const initial = publisher.name.trim().charAt(0).toUpperCase() || "A";
            return (
              <article className={cn(cards.resultCard, styles.card)} key={publisher.slug}>
                <Link
                  className={styles.cardLink}
                  href={publisherPath(publisher.slug)}
                  aria-label={`Open ${publisher.name}`}
                />
                <div className={styles.cardHeader}>
                  {avatar ? (
                    <img alt="" className={styles.avatar} src={avatar} />
                  ) : (
                    <span aria-hidden="true" className={styles.avatar}>
                      {initial}
                    </span>
                  )}
                  <div>
                    <h2>{publisher.name}</h2>
                    <p className={shell.muted}>@{publisher.slug}</p>
                  </div>
                </div>
                {publisher.description ? (
                  <p className={styles.description}>{publisher.description}</p>
                ) : (
                  <p className={styles.description}>
                    Public skills published or imported under @{publisher.slug}.
                  </p>
                )}
                <footer className={styles.footer}>
                  <span>
                    {publisher.packageCount}{" "}
                    {publisher.packageCount === 1 ? "skill" : "skills"}
                  </span>
                  {publisher.user.verified ? <span>Verified</span> : null}
                </footer>
              </article>
            );
          })
        ) : (
          <div className={shell.empty}>No publishers match that search yet.</div>
        )}
      </div>
      <LoadMoreSentinel
        enabled={Boolean(nextCursor)}
        loading={loadingMore}
        onLoadMore={() => void loadMore()}
        label="Loading more publishers…"
      />
    </>
  );
}
