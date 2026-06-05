"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GITHUB_LOGIN_URL } from "../lib/registry";
import { cn, dash, shell } from "../lib/page-styles";
import { InternalStatsPanel } from "./internal-stats-ui";
import type { InternalStats } from "./internal-stats-types";

type Me = {
  username: string;
  githubLogin: string;
  name: string | null;
  avatarUrl: string | null;
};

type AdminSession = Me;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    signal: init?.signal ?? controller.signal,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  }).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function AdminPanel() {
  const [me, setMe] = useState<Me | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [stats, setStats] = useState<InternalStats | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const data = await api<InternalStats>("/v1/admin/stats");
    setStats(data);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnavailable(null);
    try {
      const meResponse = await fetch("/v1/me", { credentials: "include" });
      const user = meResponse.ok ? ((await meResponse.json()) as Me) : null;
      setMe(user);
      if (!user) {
        setAdminSession(null);
        setStats(null);
        return;
      }

      const sessionResponse = await fetch("/v1/admin/session", { credentials: "include" });
      if (sessionResponse.status === 503) {
        setUnavailable("Admin access is not configured on the API.");
        setAdminSession(null);
        setStats(null);
        return;
      }
      const session = sessionResponse.ok ? ((await sessionResponse.json()) as AdminSession) : null;
      setAdminSession(session);
      if (session) {
        await loadStats();
      } else {
        setStats(null);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Admin dashboard is unavailable.";
      if (message.includes("not configured")) {
        setUnavailable(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session = await api<AdminSession>("/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setAdminSession(session);
      setPassword("");
      await loadStats();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Admin login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogout() {
    setSubmitting(true);
    setError(null);
    try {
      await api("/v1/admin/logout", { method: "POST" });
      setAdminSession(null);
      setStats(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Admin logout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className={cn(dash.dashboardPage, dash.dashboardPageFull)}>
        <section className={dash.dashboardEmptyState}>
          <p className={shell.eyebrow}>Admin</p>
          <h1>Loading admin dashboard…</h1>
        </section>
      </main>
    );
  }

  if (unavailable) {
    return (
      <main className={cn(dash.dashboardPage, dash.dashboardPageFull)}>
        <section className={dash.dashboardEmptyState}>
          <p className={shell.eyebrow}>Admin</p>
          <h1>Admin access is not configured.</h1>
          <p className={shell.lede}>
            Set `AIPM-ADMIN-PASSWORD-SHA256` and `AIPM-ADMIN-ALLOWED-USERNAMES` in Key Vault, redeploy
            the API, then try again.
          </p>
        </section>
      </main>
    );
  }

  if (!me) {
    return (
      <main className={cn(dash.dashboardPage, dash.dashboardPageFull)}>
        <section className={dash.dashboardEmptyState}>
          <p className={shell.eyebrow}>Admin</p>
          <h1>Sign in before opening admin.</h1>
          <p className={shell.lede}>
            Admin access uses your GitHub account plus the shared admin password. Sign in first, then
            return to this page.
          </p>
          <div className={shell.actions}>
            <a className={shell.button} href={GITHUB_LOGIN_URL}>
              Continue with GitHub
            </a>
            <Link className={cn(shell.button, shell.secondary)} href="/">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!adminSession || !stats) {
    return (
      <main className={cn(dash.dashboardPage, dash.dashboardPageFull)}>
        <section className={dash.dashboardEmptyState}>
          <p className={shell.eyebrow}>Admin</p>
          <h1>Enter the admin password.</h1>
          <p className={shell.lede}>
            Signed in as <strong>{me.username}</strong> (GitHub @{me.githubLogin}). Only allowlisted
            AIPM usernames can unlock admin after the password check.
          </p>
          <form className={dash.formPanel} onSubmit={onSubmit}>
            <label htmlFor="admin-password">Admin password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? <p className={dash.fieldHelp}>{error}</p> : null}
            <div className={shell.actions}>
              <button className={shell.button} type="submit" disabled={submitting || !password.trim()}>
                {submitting ? "Checking…" : "Unlock admin"}
              </button>
              <Link className={cn(shell.button, shell.secondary)} href="/dashboard">
                Publisher dashboard
              </Link>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className={dash.dashboardWorkspace} style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 24 }}>
        <div className={dash.dashboardHeroActions} style={{ justifyContent: "flex-end", marginBottom: 16 }}>
          <span className={shell.muted}>Signed in as {adminSession.username}</span>
          <button className={cn(shell.button, shell.secondary)} type="button" onClick={() => void onLogout()} disabled={submitting}>
            Sign out of admin
          </button>
        </div>
      </div>
      <InternalStatsPanel stats={stats} />
    </>
  );
}
