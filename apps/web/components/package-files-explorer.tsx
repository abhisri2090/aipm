"use client";

import { useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { api } from "../lib/api-client";
import { publicApiError } from "../lib/public-api-error";
import { shell, cards, cn } from "../lib/page-styles";
import { CodeBlock } from "./code-block";
import styles from "./package-files-explorer.module.css";

type PackageFileEntry = {
  path: string;
  sizeBytes: number;
};

type PackageFilesResponse = {
  entry: string | null;
  files: PackageFileEntry[];
};

type PackageFileContentResponse = {
  path: string;
  sizeBytes: number;
  binary: boolean;
  content?: string;
};

type PackageFilesExplorerProps = {
  packageName: string;
  version: string;
  entryPath?: string;
  hideHeading?: boolean;
};

function filesBaseUrl(packageName: string, version: string): string {
  return `/v1/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(version)}/files`;
}

function isMarkdownPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown");
}

function pickDefaultPath(files: PackageFileEntry[], entryPath?: string): string | null {
  if (files.length === 0) return null;
  if (entryPath && files.some((file) => file.path === entryPath)) return entryPath;
  return files[0]?.path ?? null;
}

export function PackageFilesExplorer({
  packageName,
  version,
  entryPath,
  hideHeading = false,
}: PackageFilesExplorerProps) {
  const [files, setFiles] = useState<PackageFileEntry[]>([]);
  const [resolvedEntry, setResolvedEntry] = useState<string | null>(entryPath ?? null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<PackageFileContentResponse | null>(null);
  const [listError, setListError] = useState("");
  const [contentError, setContentError] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError("");
    setFiles([]);
    setSelectedPath(null);
    setContent(null);

    api<PackageFilesResponse>(filesBaseUrl(packageName, version), undefined, { silent: true })
      .then((data) => {
        if (cancelled) return;
        const nextFiles = data.files ?? [];
        setFiles(nextFiles);
        setResolvedEntry(data.entry ?? entryPath ?? null);
        setSelectedPath(pickDefaultPath(nextFiles, data.entry ?? entryPath ?? undefined));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setListError(publicApiError(error));
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [packageName, version, entryPath]);

  const loadContent = useCallback(
    async (path: string) => {
      setContentLoading(true);
      setContentError("");
      setContent(null);
      try {
        const params = new URLSearchParams({ path });
        const data = await api<PackageFileContentResponse>(
          `${filesBaseUrl(packageName, version)}/content?${params}`,
          undefined,
          { silent: true },
        );
        setContent(data);
      } catch (error: unknown) {
        setContentError(publicApiError(error));
      } finally {
        setContentLoading(false);
      }
    },
    [packageName, version],
  );

  useEffect(() => {
    if (!selectedPath) return;
    void loadContent(selectedPath);
  }, [selectedPath, loadContent]);

  return (
    <section
      className={cn(shell.panelSection, shell.panelSectionFlush)}
      aria-label={hideHeading ? "Package files" : undefined}
      aria-labelledby={hideHeading ? undefined : "package-files-title"}
    >
      {hideHeading ? null : (
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Source</p>
            <h2 id="package-files-title">Package files</h2>
          </div>
        </div>
      )}
      <article className={cn(shell.panel, cards.stepCard)}>
        {listLoading ? <p className={styles.status}>Loading package files…</p> : null}
        {!listLoading && listError ? <p className={styles.status}>{listError}</p> : null}
        {!listLoading && !listError && files.length === 0 ? (
          <p className={styles.status}>This package has no readable files.</p>
        ) : null}
        {!listLoading && !listError && files.length > 0 ? (
          <div className={styles.explorer}>
            <nav aria-label="Package files" className={styles.fileTree}>
              {files.map((file) => {
                const isEntry = file.path === resolvedEntry;
                const isActive = file.path === selectedPath;
                return (
                  <button
                    key={file.path}
                    type="button"
                    className={cn(styles.fileButton, isActive && styles.fileButtonActive)}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setSelectedPath(file.path)}
                  >
                    <span>{file.path}</span>
                    {isEntry ? <span className={styles.entryBadge}>Entry</span> : null}
                  </button>
                );
              })}
            </nav>
            <div className={styles.contentPane}>
              {selectedPath ? <p className={styles.contentHeader}>{selectedPath}</p> : null}
              {contentLoading ? <p className={styles.status}>Loading file…</p> : null}
              {!contentLoading && contentError ? <p className={styles.status}>{contentError}</p> : null}
              {!contentLoading && !contentError && content?.binary ? (
                <p className={shell.muted}>Binary file — not displayable in browser.</p>
              ) : null}
              {!contentLoading && !contentError && content && !content.binary && content.content != null ? (
                isMarkdownPath(content.path) ? (
                  <div className={styles.markdown}>
                    <Markdown>{content.content}</Markdown>
                  </div>
                ) : (
                  <CodeBlock code={content.content} />
                )
              ) : null}
            </div>
          </div>
        ) : null}
      </article>
    </section>
  );
}
