"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/api-client";
import type { PromptDetail } from "../lib/prompts";

export function PromptEditLink({
  publisher,
  slug,
  className,
  label = "Edit",
}: {
  publisher: string;
  slug: string;
  className?: string;
  label?: string;
}) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api<PromptDetail>(
      `/v1/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`,
      undefined,
      { silent: true },
    )
      .then((prompt) => {
        if (!cancelled) setCanEdit(Boolean(prompt.canEdit));
      })
      .catch(() => {
        if (!cancelled) setCanEdit(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publisher, slug]);

  if (!canEdit) return null;

  return (
    <Link
      className={className}
      href={`/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}/edit`}
    >
      {label}
    </Link>
  );
}
