"use client";

import { useState } from "react";
import { publicApiError, apiResponseError } from "../lib/public-api-error";
import { dash, shell } from "../lib/page-styles";

type SyncResult = {
  updated: number;
  reposFetched: number;
  errors: Array<{ repo: string; message: string }>;
};

async function runStarsSync(path: string): Promise<SyncResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 600_000);
  try {
    const response = await fetch(path, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => ({}))) as Partial<SyncResult> & {
      error?: string;
      message?: string;
    };
    if (!response.ok) {
      throw new Error(apiResponseError(body, response.status));
    }
    return body as SyncResult;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AdminGithubStarsPanel() {
  const [fillResult, setFillResult] = useState<SyncResult | null>(null);
  const [refreshResult, setRefreshResult] = useState<SyncResult | null>(null);
  const [fillSubmitting, setFillSubmitting] = useState(false);
  const [refreshSubmitting, setRefreshSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFillMissing() {
    setFillSubmitting(true);
    setError(null);
    setFillResult(null);
    try {
      setFillResult(await runStarsSync("/v1/admin/github-stars/fill-missing"));
    } catch (err) {
      setError(publicApiError(err));
    } finally {
      setFillSubmitting(false);
    }
  }

  async function onRefreshAll() {
    setRefreshSubmitting(true);
    setError(null);
    setRefreshResult(null);
    try {
      setRefreshResult(await runStarsSync("/v1/admin/github-stars/refresh-all"));
    } catch (err) {
      setError(publicApiError(err));
    } finally {
      setRefreshSubmitting(false);
    }
  }

  return (
    <section className={dash.formPanel}>
      <h2>GitHub stars</h2>
      <p className={shell.muted}>
        Pull star counts from GitHub for imported skills. Fill missing only updates packages with no
        stars yet; refresh updates every skill with a GitHub source.
      </p>
      <div className={shell.actions}>
        <button
          className={shell.button}
          type="button"
          onClick={() => void onFillMissing()}
          disabled={fillSubmitting || refreshSubmitting}
        >
          {fillSubmitting ? "Filling…" : "Fill missing GitHub stars"}
        </button>
        <button
          className={shell.button}
          type="button"
          onClick={() => void onRefreshAll()}
          disabled={fillSubmitting || refreshSubmitting}
        >
          {refreshSubmitting ? "Refreshing…" : "Refresh all GitHub stars"}
        </button>
      </div>
      {error ? <p className={dash.fieldHelp}>{error}</p> : null}
      {fillResult ? (
        <p className={shell.muted}>
          Fill missing: updated {fillResult.updated} packages across {fillResult.reposFetched} repos
          {fillResult.errors.length > 0 ? ` (${fillResult.errors.length} errors)` : ""}.
        </p>
      ) : null}
      {refreshResult ? (
        <p className={shell.muted}>
          Refresh all: updated {refreshResult.updated} packages across {refreshResult.reposFetched}{" "}
          repos
          {refreshResult.errors.length > 0 ? ` (${refreshResult.errors.length} errors)` : ""}.
        </p>
      ) : null}
      {fillResult && fillResult.errors.length > 0 ? (
        <ul className={shell.muted}>
          {fillResult.errors.slice(0, 5).map((item) => (
            <li key={`fill-${item.repo}`}>
              {item.repo}: {item.message}
            </li>
          ))}
        </ul>
      ) : null}
      {refreshResult && refreshResult.errors.length > 0 ? (
        <ul className={shell.muted}>
          {refreshResult.errors.slice(0, 5).map((item) => (
            <li key={`refresh-${item.repo}`}>
              {item.repo}: {item.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
