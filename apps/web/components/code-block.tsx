"use client";

import { useState } from "react";
import { cn } from "../lib/class-names";
import styles from "./code-block.module.css";

type CodeBlockProps = {
  code: string;
  className?: string;
  muted?: boolean;
};

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6 9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
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

export function CodeBlock({ code, className, muted = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={cn(styles.codeBlock, muted && styles.codeBlockMuted, className)}>
      <div className={styles.codeBlockShell}>
        <button
          type="button"
          className={styles.codeBlockCopy}
          data-copied={copied ? "" : undefined}
          aria-label={copied ? "Copied" : "Copy code"}
          title={copied ? "Copied" : "Copy to clipboard"}
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          }}
        >
          <CopyIcon copied={copied} />
        </button>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
