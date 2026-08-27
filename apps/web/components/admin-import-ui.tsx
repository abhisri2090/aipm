"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { publicApiError } from "../lib/public-api-error";
import { packagePath } from "../lib/registry";
import { dash, shell } from "../lib/page-styles";

type ImportResult = {
  action: "published" | "skipped";
  sourceUrl: string;
  packageName: string;
  version: string | null;
  contentHash: string;
  integrity?: string;
};

type BulkImportItem = ImportResult & { subfolder: string };

type BulkImportResult = {
  action?: "bulk";
  parentUrl: string;
  orgName: string;
  subfolders: string[];
  results: BulkImportItem[];
  summary: { published: number; skipped: number; failed: number };
  aborted?: { subfolder: string; error: string };
};

function isBulkImportResult(value: ImportResult | BulkImportResult): value is BulkImportResult {
  return "summary" in value && "results" in value;
}

async function importFromUrl(sourceUrl: string): Promise<ImportResult | BulkImportResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 600_000);

  try {
    const response = await fetch("/v1/admin/import-from-url", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceUrl }),
    });
    const body = (await response.json().catch(() => ({}))) as Partial<ImportResult> &
      Partial<BulkImportResult> & { error?: string };

    if (response.ok) return body as ImportResult | BulkImportResult;
    if (response.status === 400 && Array.isArray(body.results)) {
      return body as BulkImportResult;
    }
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AdminImportSkillPanel({ onImported }: { onImported: () => Promise<void> }) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | BulkImportResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const importResult = await importFromUrl(sourceUrl.trim());
      setResult(importResult);
      const publishedOrSkipped = isBulkImportResult(importResult)
        ? importResult.summary.published + importResult.summary.skipped > 0
        : true;
      if (publishedOrSkipped) {
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
        <h2>Import skill from GitHub</h2>
        <p className={shell.muted}>
          Paste a GitHub repo or folder URL. A repo with a <code>skills/</code> folder is imported as
          one package per skill. Single-skill folders publish at version 1.0.0 with all-tool targets.
        </p>
        <form className={dash.formPanel} onSubmit={(event) => void onSubmit(event)}>
          <label htmlFor="admin-import-url">GitHub repo or folder URL</label>
          <input
            id="admin-import-url"
            name="sourceUrl"
            type="url"
            placeholder="https://github.com/owner/repo"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            required
          />
          {error ? <p className={dash.fieldHelp}>{error}</p> : null}
          {result && !isBulkImportResult(result) ? (
            <p className={dash.fieldHelp}>
              {result.action === "skipped" ? (
                <>
                  Skipped <strong>{result.packageName}</strong> — content unchanged at version{" "}
                  {result.version ?? "unknown"}.
                </>
              ) : (
                <>
                  Published{" "}
                  {result.version ? (
                    <Link href={packagePath(result.packageName, result.version)}>
                      {result.packageName}@{result.version}
                    </Link>
                  ) : (
                    result.packageName
                  )}
                  .
                </>
              )}
            </p>
          ) : null}
          {result && isBulkImportResult(result) ? (
            <>
              <p className={dash.fieldHelp}>
                {result.aborted ? (
                  <>
                    Aborted on <strong>{result.aborted.subfolder}</strong>: {result.aborted.error}
                  </>
                ) : (
                  <>
                    Imported {result.subfolders.length} skill
                    {result.subfolders.length === 1 ? "" : "s"} as @{result.orgName} —{" "}
                    {result.summary.published} published, {result.summary.skipped} skipped.
                  </>
                )}
              </p>
              {result.results.length > 0 ? (
                <div className={dash.tableWrap}>
                  <table className={dash.table}>
                    <thead>
                      <tr>
                        <th>Skill</th>
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
              {submitting ? "Importing…" : "Import skill"}
            </button>
          </div>
        </form>
    </article>
  );
}
