"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { publicApiError } from "../lib/public-api-error";
import { packagePath } from "../lib/registry";
import { dash, shell } from "../lib/page-styles";

type BulkImportItem = {
  subfolder: string;
  action: "published" | "skipped";
  sourceUrl: string;
  packageName: string;
  version: string | null;
  contentHash: string;
  integrity?: string;
};

type BulkImportResult = {
  parentUrl: string;
  subfolders: string[];
  results: BulkImportItem[];
  summary: { published: number; skipped: number; failed: number };
  aborted?: { subfolder: string; error: string };
};

async function bulkImportFromUrl(sourceUrl: string): Promise<BulkImportResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 600_000);

  try {
    const response = await fetch("/v1/admin/bulk-import-from-url", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceUrl }),
    });
    const body = (await response.json().catch(() => ({}))) as BulkImportResult & { error?: string };

    if (response.ok) return body;
    if (response.status === 400 && body.results) return body;
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AdminBulkImportSkillPanel({ onImported }: { onImported: () => Promise<void> }) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const importResult = await bulkImportFromUrl(sourceUrl.trim());
      setResult(importResult);
      if (importResult.summary.published > 0 || importResult.summary.skipped > 0) {
        await onImported();
      }
    } catch (requestError) {
      setError(publicApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className={dash.dashboardPanel} style={{ marginBottom: 24 }}>
      <h2>Bulk import skills from GitHub</h2>
      <p className={shell.muted}>
        Paste a GitHub folder URL containing skill subfolders. Each immediate subfolder is imported
        as a separate skill. Import stops on the first failure.
      </p>
      <form className={dash.formPanel} onSubmit={(event) => void onSubmit(event)}>
        <label htmlFor="admin-bulk-import-url">GitHub parent folder URL</label>
        <input
          id="admin-bulk-import-url"
          name="sourceUrl"
          type="url"
          placeholder="https://github.com/owner/repo/tree/main/path/to/skills"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          required
        />
        {error ? <p className={dash.fieldHelp}>{error}</p> : null}
        {result ? (
          <>
            <p className={dash.fieldHelp}>
              {result.aborted ? (
                <>
                  Aborted on <strong>{result.aborted.subfolder}</strong>: {result.aborted.error}
                </>
              ) : (
                <>
                  Completed {result.subfolders.length} subfolder
                  {result.subfolders.length === 1 ? "" : "s"} — {result.summary.published} published,{" "}
                  {result.summary.skipped} skipped.
                </>
              )}
            </p>
            {result.results.length > 0 ? (
              <div className={dash.tableWrap}>
                <table className={dash.table}>
                  <thead>
                    <tr>
                      <th>Subfolder</th>
                      <th>Package</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((item) => (
                      <tr key={item.subfolder}>
                        <td>{item.subfolder}</td>
                        <td>
                          {item.action === "published" && item.version ? (
                            <Link href={packagePath(item.packageName, item.version)}>
                              {item.packageName}@{item.version}
                            </Link>
                          ) : (
                            item.packageName
                          )}
                        </td>
                        <td>{item.action === "skipped" ? "Skipped (unchanged)" : "Published"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : null}
        <div className={shell.actions}>
          <button className={shell.button} type="submit" disabled={submitting || !sourceUrl.trim()}>
            {submitting ? "Importing…" : "Bulk import skills"}
          </button>
        </div>
      </form>
    </article>
  );
}
