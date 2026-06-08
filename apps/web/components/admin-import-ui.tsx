"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
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

async function importFromUrl(sourceUrl: string): Promise<ImportResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch("/v1/admin/import-from-url", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceUrl }),
    });
    const body = (await response.json().catch(() => ({}))) as ImportResult & { error?: string };
    if (!response.ok) {
      throw new Error(body.error ?? `Import failed: ${response.status}`);
    }
    return body;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AdminImportSkillPanel({ onImported }: { onImported: () => Promise<void> }) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const importResult = await importFromUrl(sourceUrl.trim());
      setResult(importResult);
      await onImported();
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === "AbortError"
          ? "Import timed out. Try again or use the CLI script for large folders."
          : requestError instanceof Error
            ? requestError.message
            : "Import failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className={dash.dashboardPanel} style={{ marginBottom: 24 }}>
        <h2>Import skill from GitHub</h2>
        <p className={shell.muted}>
          Paste a GitHub folder URL (tree view). The registry fetches the skill, creates an unverified
          publisher account if needed, and publishes at version 1.0.0 with all-tool targets.
        </p>
        <form className={dash.formPanel} onSubmit={(event) => void onSubmit(event)}>
          <label htmlFor="admin-import-url">GitHub folder URL</label>
          <input
            id="admin-import-url"
            name="sourceUrl"
            type="url"
            placeholder="https://github.com/owner/repo/tree/main/path/to/skill"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            required
          />
          {error ? <p className={dash.fieldHelp}>{error}</p> : null}
          {result ? (
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
          <div className={shell.actions}>
            <button className={shell.button} type="submit" disabled={submitting || !sourceUrl.trim()}>
              {submitting ? "Importing…" : "Import skill"}
            </button>
          </div>
        </form>
    </article>
  );
}
