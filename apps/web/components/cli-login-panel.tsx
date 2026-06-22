"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api-client";
import { publicApiError } from "../lib/public-api-error";
import { shell, cards, cn } from "../lib/page-styles";

type Me = {
  username?: string | null;
  githubLogin?: string | null;
  name?: string | null;
  primaryEmail?: string | null;
};

function currentReturnPath(): string {
  if (typeof window === "undefined") return "/cli/login";
  return `${window.location.pathname}${window.location.search}`;
}

function loginPath(): string {
  return `/login?returnTo=${encodeURIComponent(currentReturnPath())}`;
}

export function CliLoginPanel() {
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";
  const device = params.get("device") ?? "AIPM CLI";
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api<Me>("/v1/me", undefined, { silent: true })
      .then((user) => {
        if (!cancelled) setMe(user);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasValidParams = redirectUri && state && codeChallenge;
  const label = me?.name ?? me?.username ?? me?.githubLogin ?? me?.primaryEmail ?? "your AIPM account";

  async function authorize() {
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ redirectTo: string }>("/v1/cli-auth/authorize", {
        method: "POST",
        body: JSON.stringify({
          redirectUri,
          state,
          codeChallenge,
          deviceName: device,
        }),
      });
      window.location.href = result.redirectTo;
    } catch (authError) {
      setError(publicApiError(authError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <section className={cn(shell.pageHeader, shell.compactPageHeader)}>
        <p className={shell.eyebrow}>CLI login</p>
        <h1>Authorize AIPM CLI.</h1>
        <p className={shell.lede}>
          This lets the CLI install private packages available to your account without pasting tokens
          every time.
        </p>
      </section>

      <section className={shell.panelSection}>
        <article className={cn(shell.panel, cards.stepCard)}>
          {!hasValidParams ? (
            <>
              <h2>Invalid login request</h2>
              <p className={shell.muted}>Start again from the terminal with <code>aipm login</code>.</p>
            </>
          ) : loading ? (
            <>
              <h2>Checking your session</h2>
              <p className={shell.muted}>One moment.</p>
            </>
          ) : !me ? (
            <>
              <h2>Sign in first</h2>
              <p className={shell.muted}>After sign-in, you will return here to authorize {device}.</p>
              <div className={shell.actions}>
                <a className={shell.button} href={loginPath()}>
                  Sign in
                </a>
              </div>
            </>
          ) : (
            <>
              <h2>Authorize {device}</h2>
              <p className={shell.muted}>
                You are signed in as {label}. The CLI will be able to read public packages and private
                packages from organizations where you are a member.
              </p>
              {error ? <p className={shell.notice}>{error}</p> : null}
              <div className={shell.actions}>
                <button className={shell.button} disabled={busy} type="button" onClick={authorize}>
                  {busy ? "Authorizing" : "Authorize CLI"}
                </button>
              </div>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
