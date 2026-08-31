"use client";

import { useState } from "react";
import styles from "./prompt-copy-button.module.css";

export function PromptCopyButton({
  value,
  label = "Copy prompt",
  trackingPath,
}: {
  value: string;
  label?: string;
  trackingPath?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className={styles.copyButton}
      type="button"
      aria-label={copied ? "Prompt copied" : label}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        if (trackingPath) {
          void fetch(`${trackingPath}/copy`, {
            method: "POST",
            credentials: "include",
          }).catch(() => undefined);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        {copied ? (
          <path
            d="m5 12 4 4L19 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        ) : (
          <>
            <rect
              x="9"
              y="9"
              width="11"
              height="11"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
      {copied ? "Copied" : label}
    </button>
  );
}
