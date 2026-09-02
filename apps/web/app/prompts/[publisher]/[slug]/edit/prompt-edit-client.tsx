"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PromptSubmissionForm } from "../../../../../components/prompt-submission-form";
import { api } from "../../../../../lib/api-client";
import type { PromptDetail } from "../../../../../lib/prompts";
import shell from "../../../../page-shell.module.css";

export function PromptEditClient({
  publisher,
  slug,
}: {
  publisher: string;
  slug: string;
}) {
  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [state, setState] = useState<
    "loading" | "login" | "ready" | "forbidden" | "missing"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await api("/v1/me", undefined, { silent: true });
      } catch {
        if (!cancelled) setState("login");
        return;
      }
      try {
        const detail = await api<PromptDetail>(
          `/v1/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`,
          undefined,
          { silent: true },
        );
        if (cancelled) return;
        if (!detail.canEdit) {
          setState("forbidden");
          return;
        }
        setPrompt(detail);
        setState("ready");
      } catch {
        if (!cancelled) setState("missing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publisher, slug]);

  if (state === "loading") {
    return (
      <main>
        <div className={shell.empty}>Loading prompt…</div>
      </main>
    );
  }

  if (state === "login") {
    return (
      <main>
        <section className={shell.pageHeader}>
          <p className={shell.eyebrow}>Edit prompt</p>
          <h1>Sign in to edit this prompt.</h1>
          <p className={shell.lede}>
            Only the original publisher, or an organization owner/admin, can edit it.
          </p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/login">
              Sign in
            </Link>
            <Link className={shell.textLink} href="/prompts">
              Back to prompts
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (state === "missing") {
    return (
      <main>
        <section className={shell.pageHeader}>
          <p className={shell.eyebrow}>Edit prompt</p>
          <h1>Prompt not found.</h1>
          <p className={shell.lede}>This prompt may have been moved or removed.</p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/prompts">
              Back to prompts
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (state === "forbidden" || !prompt) {
    return (
      <main>
        <section className={shell.pageHeader}>
          <p className={shell.eyebrow}>Edit prompt</p>
          <h1>You can’t edit this prompt.</h1>
          <p className={shell.lede}>
            Only the original publisher, or an organization owner/admin, can edit it.
          </p>
          <div className={shell.actions}>
            <Link
              className={shell.button}
              href={`/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`}
            >
              View prompt
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <PromptSubmissionForm mode="edit" initialPrompt={prompt} />;
}
