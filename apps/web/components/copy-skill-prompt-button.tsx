"use client";

import { useState } from "react";
import { cn, shell } from "../lib/page-styles";

export function CopySkillPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className={cn(shell.button, shell.secondary)}
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? "Copied — paste into your AI tool" : "Copy prompt to create this skill"}
    </button>
  );
}
