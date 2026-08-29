"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { api } from "../lib/api-client";
import { shell, cards, cn } from "../lib/page-styles";
import styles from "./readme-preview.module.css";

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

type PackageReadmePreviewProps = {
  packageName: string;
  version: string;
};

function filesBaseUrl(packageName: string, version: string): string {
  return `/v1/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(version)}/files`;
}

function findReadmePath(files: PackageFileEntry[]): string | null {
  return files.find((file) => /^readme\.md$/i.test(file.path))?.path ?? null;
}

export function PackageReadmePreview({ packageName, version }: PackageReadmePreviewProps) {
  const [readmeContent, setReadmeContent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReadme() {
      try {
        const listing = await api<PackageFilesResponse>(filesBaseUrl(packageName, version), undefined, {
          silent: true,
        });
        const readmePath = findReadmePath(listing.files ?? []);
        if (!readmePath) return;

        const params = new URLSearchParams({ path: readmePath });
        const file = await api<PackageFileContentResponse>(
          `${filesBaseUrl(packageName, version)}/content?${params}`,
          undefined,
          { silent: true },
        );
        if (cancelled || file.binary || !file.content?.trim()) return;
        setReadmeContent(file.content);
      } catch {
        // No readme or package files unavailable — leave section hidden.
      }
    }

    void loadReadme();
    return () => {
      cancelled = true;
    };
  }, [packageName, version]);

  if (!readmeContent) return null;

  return (
    <article className={cn(shell.panel, cards.stepCard)}>
      <p className={shell.eyebrow}>Overview</p>
      <h2>Readme</h2>
      <div className={styles.preview}>
        <div className={styles.markdown}>
          <Markdown>{readmeContent}</Markdown>
        </div>
      </div>
    </article>
  );
}
