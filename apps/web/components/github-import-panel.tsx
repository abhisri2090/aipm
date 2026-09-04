"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { apiResponseError, publicApiError } from "../lib/public-api-error";
import { GITHUB_CONNECT_URL, packagePath } from "../lib/registry";
import { dash, shell } from "../lib/page-styles";
import { cn } from "../lib/class-names";

type ManifestDraft = {
  schemaVersion: "0.1";
  name: string;
  version: string;
  type: "skill";
  description: string;
  entry: string;
  targets: string[];
  license?: string;
  usage?: string;
  agentDescription?: string;
  tags?: string[];
  categories?: string[];
  sourceUrl?: string;
  examples?: Array<{ title: string; description?: string; prompt: string }>;
  releaseNotes?: string;
};

type PreviewResult = {
  sourceUrl: string;
  commitSha: string;
  entry: string;
  files: string[];
  packageName: string;
  existingVersion: string | null;
  updateNotice: string | null;
  manifest: ManifestDraft;
  visibility: "public" | "private";
  provenance: { license: string; contentHash: string };
};

type ConfirmResult = {
  packageName: string;
  version: string;
  sourceUrl: string;
  contentHash: string;
  integrity: string;
  isUpdate: boolean;
};

type OrgInfo = {
  slug: string;
  role?: "owner" | "admin" | "member" | "viewer";
};

const IMPORT_TIMEOUT_MS = 600_000;

async function postImport<T>(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string; code?: string; files?: string[] }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), IMPORT_TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as Partial<T> & {
      error?: string;
      message?: string;
      code?: string;
      files?: string[];
    };
    if (response.ok) return { ok: true, data: payload as T };
    return {
      ok: false,
      status: response.status,
      error: apiResponseError(payload, response.status),
      code: payload.code,
      files: payload.files,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

function shortName(packageName: string, orgSlug: string): string {
  const prefix = `@${orgSlug}/`;
  return packageName.startsWith(prefix) ? packageName.slice(prefix.length) : packageName.replace(/^@[^/]+\//, "");
}

export function GithubImportPanel({
  org,
  githubLogin,
  onImported,
}: {
  org: OrgInfo;
  githubLogin: string | null;
  onImported: () => Promise<void>;
}) {
  const canImport = org.role === "owner" || org.role === "admin";
  const [sourceUrl, setSourceUrl] = useState("");
  const [entry, setEntry] = useState("");
  const [entryChoices, setEntryChoices] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [shortPackageName, setShortPackageName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [targets, setTargets] = useState("*");
  const [license, setLicense] = useState("");
  const [usage, setUsage] = useState("");
  const [tags, setTags] = useState("");
  const [categories, setCategories] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const github = params.get("github");
    const authError = params.get("error");
    if (github === "connected") setNotice("GitHub connected. You can import a public skill you own.");
    if (github === "already_linked") setNotice("This account is already linked to GitHub.");
    if (authError) setError(authError);
    if (github || authError) {
      const next = new URL(window.location.href);
      next.searchParams.delete("github");
      next.searchParams.delete("error");
      window.history.replaceState({}, "", `${next.pathname}${next.search}`);
    }
  }, []);

  function applyPreview(data: PreviewResult) {
    setPreview(data);
    setEntry(data.entry);
    setEntryChoices(data.files);
    setShortPackageName(shortName(data.packageName, org.slug));
    setVersion(data.manifest.version);
    setDescription(data.manifest.description);
    setAgentDescription(data.manifest.agentDescription ?? "");
    setTargets((data.manifest.targets ?? ["*"]).join(","));
    setLicense(data.manifest.license ?? data.provenance.license);
    setUsage(data.manifest.usage ?? "");
    setTags((data.manifest.tags ?? []).join(", "));
    setCategories((data.manifest.categories ?? []).join(", "));
    setReleaseNotes(data.manifest.releaseNotes ?? "");
    setVisibility(data.visibility);
    setNotice(data.updateNotice);
    setResult(null);
  }

  async function runPreview(event?: FormEvent) {
    event?.preventDefault();
    if (!canImport || !githubLogin) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await postImport<PreviewResult>(`/v1/orgs/${org.slug}/imports/github/preview`, {
        sourceUrl: sourceUrl.trim(),
        ...(entry.trim() ? { entry: entry.trim() } : {}),
      });
      if (!response.ok) {
        if (response.code === "entry_required" && response.files?.length) {
          setEntryChoices(response.files);
          setPreview(null);
          setError(response.error);
          return;
        }
        throw new Error(response.error);
      }
      applyPreview(response.data);
    } catch (requestError) {
      setError(publicApiError(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm(event: FormEvent) {
    event.preventDefault();
    if (!preview || !canImport || !githubLogin) return;
    setBusy(true);
    setError(null);
    try {
      const packageName = `@${org.slug}/${shortPackageName.trim()}`;
      const targetList = targets
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const tagList = tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const categoryList = categories
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const manifest: ManifestDraft = {
        schemaVersion: "0.1",
        name: packageName,
        version: version.trim(),
        type: "skill",
        description: description.trim(),
        entry: preview.entry,
        targets: targetList.length ? targetList : ["*"],
        ...(license.trim() ? { license: license.trim() } : {}),
        ...(usage.trim() ? { usage: usage.trim() } : {}),
        ...(agentDescription.trim() ? { agentDescription: agentDescription.trim() } : {}),
        ...(tagList.length ? { tags: tagList } : {}),
        ...(categoryList.length ? { categories: categoryList } : {}),
        ...(releaseNotes.trim() ? { releaseNotes: releaseNotes.trim() } : {}),
        sourceUrl: preview.sourceUrl,
      };
      const response = await postImport<ConfirmResult>(`/v1/orgs/${org.slug}/imports/github`, {
        sourceUrl: preview.sourceUrl,
        entry: preview.entry,
        commitSha: preview.commitSha,
        manifest,
        visibility,
      });
      if (!response.ok) throw new Error(response.error);
      setResult(response.data);
      setNotice(
        response.data.isUpdate
          ? `Published a new version of ${response.data.packageName}.`
          : `Imported ${response.data.packageName}.`,
      );
      await onImported();
    } catch (requestError) {
      setError(publicApiError(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={cn(dash.dashboardPanel, dash.formPanel)}>
      <p className={shell.eyebrow}>Import</p>
      <h2>Import skill from GitHub</h2>
      <p className={shell.muted}>
        Paste a public GitHub repo or folder you own (or admin). One skill per URL. Skill files stay as-is; you review
        the skill details before publishing under @{org.slug}.
      </p>

      {!githubLogin ? (
        <div className={shell.actions}>
          <a className={shell.button} href={GITHUB_CONNECT_URL}>
            Connect GitHub
          </a>
          <p className={dash.fieldHelp}>GitHub is required so we can confirm you own the repo.</p>
        </div>
      ) : null}

      {githubLogin && !canImport ? (
        <p className={dash.fieldHelp}>Only owners and admins can import from GitHub.</p>
      ) : null}

      {githubLogin && canImport ? (
        <>
          <form onSubmit={(event) => void runPreview(event)}>
            <label htmlFor="github-import-url">GitHub repo or folder URL</label>
            <input
              id="github-import-url"
              name="sourceUrl"
              type="url"
              placeholder="https://github.com/you/skill-repo"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              required
              disabled={busy}
            />
            {entryChoices.length > 0 && !preview ? (
              <>
                <label htmlFor="github-import-entry">Entry file</label>
                <select
                  id="github-import-entry"
                  value={entry}
                  onChange={(event) => setEntry(event.target.value)}
                  required
                  disabled={busy}
                >
                  <option value="">Select a file…</option>
                  {entryChoices.map((file) => (
                    <option key={file} value={file}>
                      {file}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <div className={shell.actions}>
              <button className={shell.button} type="submit" disabled={busy || !sourceUrl.trim()}>
                {busy && !preview ? "Checking…" : preview ? "Refresh preview" : "Preview import"}
              </button>
            </div>
          </form>

          {preview ? (
            <form onSubmit={(event) => void runConfirm(event)} style={{ marginTop: 24 }}>
              {notice ? <p className={shell.notice}>{notice}</p> : null}
              <p className={dash.fieldHelp}>
                Entry file: <code>{preview.entry}</code> (from GitHub; not editable). Commit{" "}
                <code>{preview.commitSha.slice(0, 7)}</code>.
              </p>
              <label htmlFor="github-import-name">Skill name</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span>@{org.slug}/</span>
                <input
                  id="github-import-name"
                  value={shortPackageName}
                  onChange={(event) => setShortPackageName(event.target.value)}
                  required
                  disabled={busy}
                />
              </div>
              <label htmlFor="github-import-version">Version</label>
              <input
                id="github-import-version"
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                required
                disabled={busy}
              />
              <label htmlFor="github-import-description">Description</label>
              <textarea
                id="github-import-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={3}
                disabled={busy}
              />
              <label htmlFor="github-import-agent">Agent description</label>
              <textarea
                id="github-import-agent"
                value={agentDescription}
                onChange={(event) => setAgentDescription(event.target.value)}
                rows={6}
                disabled={busy}
              />
              <label htmlFor="github-import-targets">Targets (comma-separated)</label>
              <input
                id="github-import-targets"
                value={targets}
                onChange={(event) => setTargets(event.target.value)}
                placeholder="* or cursor,claude"
                disabled={busy}
              />
              <label htmlFor="github-import-license">License</label>
              <input
                id="github-import-license"
                value={license}
                onChange={(event) => setLicense(event.target.value)}
                disabled={busy}
              />
              <label htmlFor="github-import-usage">Usage</label>
              <textarea
                id="github-import-usage"
                value={usage}
                onChange={(event) => setUsage(event.target.value)}
                rows={3}
                disabled={busy}
              />
              <label htmlFor="github-import-tags">Tags (comma-separated)</label>
              <input id="github-import-tags" value={tags} onChange={(event) => setTags(event.target.value)} disabled={busy} />
              <label htmlFor="github-import-categories">Categories (comma-separated)</label>
              <input
                id="github-import-categories"
                value={categories}
                onChange={(event) => setCategories(event.target.value)}
                disabled={busy}
              />
              <label htmlFor="github-import-notes">Release notes</label>
              <textarea
                id="github-import-notes"
                value={releaseNotes}
                onChange={(event) => setReleaseNotes(event.target.value)}
                rows={2}
                disabled={busy}
              />
              <label htmlFor="github-import-visibility">Visibility</label>
              <select
                id="github-import-visibility"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as "public" | "private")}
                disabled={busy}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <div className={shell.actions}>
                <button className={shell.button} type="submit" disabled={busy}>
                  {busy ? "Importing…" : "Import skill"}
                </button>
              </div>
            </form>
          ) : null}
        </>
      ) : null}

      {error ? <p className={dash.fieldHelp}>{error}</p> : null}
      {result ? (
        <p className={dash.fieldHelp}>
          Published{" "}
          <Link href={packagePath(result.packageName, result.version)}>
            {result.packageName}@{result.version}
          </Link>
          .
        </p>
      ) : null}
      <p className={dash.fieldHelp}>
        Need help? See the <Link href="/publish/github">GitHub import guide</Link>.
      </p>
    </article>
  );
}
