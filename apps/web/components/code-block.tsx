"use client";

import { useState } from "react";

type CodeBlockProps = {
  code: string;
  className?: string;
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

export function CodeBlock({ code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={["code-block", className].filter(Boolean).join(" ")}>
      <div className="code-block-shell">
        <button
          type="button"
          className="code-block-copy"
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
