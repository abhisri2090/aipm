"use client";

import { useState } from "react";
import shell from "../app/page-shell.module.css";
import { copyToClipboard } from "../lib/copy-to-clipboard";

const COPY_ICON_SIZE = 22;

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg aria-hidden="true" width={COPY_ICON_SIZE} height={COPY_ICON_SIZE} viewBox="0 0 24 24" fill="none">
        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" width={COPY_ICON_SIZE} height={COPY_ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  showCopyIcon = false,
}: {
  value: string;
  label?: string;
  showCopyIcon?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className={shell.copy}
      type="button"
      aria-label={copied ? "Copied install command" : `Copy install command: ${value}`}
      onClick={async () => {
        const didCopy = await copyToClipboard(value);
        if (!didCopy) return;
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? (
        "Copied"
      ) : showCopyIcon ? (
        <span className={shell.copyLabel}>
          {label}
          <CopyIcon copied={false} />
        </span>
      ) : (
        label
      )}
    </button>
  );
}
