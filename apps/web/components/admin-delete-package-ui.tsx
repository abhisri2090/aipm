"use client";

import { FormEvent, useCallback, useState } from "react";
import { isValidScopeName, normalizePackageSearchQuery } from "@aipm-registry/schemas";
import { api } from "../lib/api-client";
import { publicApiError } from "../lib/public-api-error";
import { cn, dash, shell } from "../lib/page-styles";

type AdminPackage = {
  name: string;
  version: string;
  description: string;
  visibility: "public" | "private";
  versionCount: number;
  createdAt: string;
};

async function fetchAdminPackages(query: string): Promise<AdminPackage[]> {
  const params = new URLSearchParams({ limit: "50", q: query });
  const data = await api<{ packages?: AdminPackage[] }>(`/v1/admin/packages?${params}`);
  return data.packages ?? [];
}

async function deleteAdminPackage(name: string): Promise<void> {
  await api<void>(`/v1/admin/packages/${encodeURIComponent(name)}`, { method: "DELETE" });
}

export function AdminDeletePackagePanel({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const loadPackages = useCallback(async (nextQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      setPackages(await fetchAdminPackages(nextQuery));
      setActiveQuery(nextQuery);
      setHasSearched(true);
    } catch (requestError) {
      setPackages([]);
      setError(publicApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizePackageSearchQuery(query);
    if (!isValidScopeName(normalized)) {
      setError("Enter the exact package name (for example @scope/name).");
      setPackages([]);
      setHasSearched(false);
      setActiveQuery("");
      return;
    }
    setStatus(null);
    setSelectedName(null);
    setConfirmName("");
    await loadPackages(normalized);
  }

  async function onDelete() {
    if (!selectedName || confirmName !== selectedName) return;
    setSubmitting(true);
    setError(null);
    setStatus(null);
    try {
      await deleteAdminPackage(selectedName);
      setStatus(`Deleted ${selectedName}.`);
      setSelectedName(null);
      setConfirmName("");
      if (activeQuery) await loadPackages(activeQuery);
      await onDeleted();
    } catch (requestError) {
      setError(publicApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className={dash.dashboardPanel}>
      <h2>Delete package</h2>
      <p className={shell.muted}>
        Permanently remove any package from the registry, including all versions, blobs, and the
        reserved name. Search by the exact package name only.
      </p>

      <form className={dash.formPanel} onSubmit={(event) => void onSearch(event)}>
        <label htmlFor="admin-package-search">Package name</label>
        <input
          id="admin-package-search"
          name="q"
          placeholder="@scope/name"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className={shell.actions}>
          <button className={shell.button} disabled={loading} type="submit">
            {loading ? "Searching…" : "Find package"}
          </button>
        </div>
      </form>

      {error ? <p className={dash.fieldHelp}>{error}</p> : null}
      {status ? <p className={dash.fieldHelp}>{status}</p> : null}

      {packages.length > 0 ? (
        <ul className={dash.resourceList}>
          {packages.map((pkg) => (
            <li className={dash.resourceRow} key={pkg.name}>
              <div>
                <strong>{pkg.name}</strong>
                <span>
                  {pkg.version} · {pkg.versionCount} version{pkg.versionCount === 1 ? "" : "s"} ·{" "}
                  {pkg.visibility}
                </span>
                {pkg.description ? <span>{pkg.description}</span> : null}
              </div>
              <button
                className={cn(shell.button, shell.secondary)}
                type="button"
                onClick={() => {
                  setSelectedName(pkg.name);
                  setConfirmName("");
                  setStatus(null);
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : hasSearched && !loading ? (
        <p className={shell.muted}>No package found with that exact name.</p>
      ) : null}

      {selectedName ? (
        <section className={dash.dangerAction}>
          <h2>Confirm delete</h2>
          <p className={shell.muted}>
            This cannot be undone. Type <strong>{selectedName}</strong> to confirm.
          </p>
          <label htmlFor="admin-delete-package-name">Package name</label>
          <input
            id="admin-delete-package-name"
            placeholder={selectedName}
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
          />
          <div className={shell.actions}>
            <button
              className={dash.secondaryButton}
              disabled={submitting || confirmName !== selectedName}
              type="button"
              onClick={() => void onDelete()}
            >
              {submitting ? "Deleting…" : "Delete package"}
            </button>
            <button
              className={cn(shell.button, shell.secondary)}
              disabled={submitting}
              type="button"
              onClick={() => {
                setSelectedName(null);
                setConfirmName("");
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}
    </article>
  );
}
