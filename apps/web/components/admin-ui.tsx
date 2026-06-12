"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DEV_LOGIN_URL, GITHUB_LOGIN_URL, isLocalDevSite } from "../lib/registry";
import { cn, dash, shell } from "../lib/page-styles";
import { InternalStatsPanel } from "./internal-stats-ui";
import { AdminImportSkillPanel } from "./admin-import-ui";
import type { InternalStats } from "./internal-stats-types";

type Me = {
  username: string;
  githubLogin: string | null;
  authProvider?: "github" | "email";
  email?: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type AdminSession = Me;

type AuthConfig = {
  devAuth: boolean;
  githubAuth: boolean;
  emailAuth: boolean;
};

function publicApiError(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "AIPM API timed out. Start the local registry API with `pnpm local:api`.";
  }
  if (error instanceof TypeError) {
    return "AIPM API is unreachable. Start the local registry API with `pnpm local:api`.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "AIPM API is unavailable.";
}

async function fetchWithTimeout(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  try {
    return await fetch(path, {
      ...init,
      credentials: "include",
      signal: init?.signal ?? controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AdminPanel() {
  const [me, setMe] = useState<Me | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [stats, setStats] = useState<InternalStats | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetchWithTimeout(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  const loadStats = useCallback(async () => {
    const data = await api<InternalStats>("/v1/admin/stats");
    setStats(data);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnavailable(null);
    try {
      const configResponse = await fetchWithTimeout("/v1/auth/config");
      if (configResponse.ok) {
        setAuthConfig((await configResponse.json()) as AuthConfig);
      } else {
        setAuthConfig({ devAuth: false, githubAuth: false, emailAuth: false });
      }

      const meResponse = await fetchWithTimeout("/v1/me");
      if (meResponse.status === 503) {
        setUnavailable(
          "Account services require Docker Postgres. Run `pnpm local:setup`, then restart `pnpm local:api`.",
        );
        setMe(null);
        setAdminSession(null);
        setStats(null);
        return;
      }
      const user = meResponse.ok ? ((await meResponse.json()) as Me) : null;
      setMe(user);
      if (!user) {
        setAdminSession(null);
        setStats(null);
        return;
      }

      const sessionResponse = await fetchWithTimeout("/v1/admin/session");
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
      const message = publicApiError(requestError);
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
          <h1>Admin access is not available.</h1>
          <p className={shell.lede}>{unavailable}</p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/login">
              Open login
            </Link>
            <Link className={cn(shell.button, shell.secondary)} href="/">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (error && !me) {
    return (
      <main className={cn(dash.dashboardPage, dash.dashboardPageFull)}>
        <section className={dash.dashboardEmptyState}>
          <p className={shell.eyebrow}>Admin</p>
          <h1>Admin dashboard is unavailable.</h1>
          <p className={shell.lede}>{error}</p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/login">
              Open login
            </Link>
            <Link className={cn(shell.button, shell.secondary)} href="/">
              Back to home
            </Link>
          </div>
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
            Admin access uses your publisher account plus the local admin password. Sign in first,
            then return to this page.
          </p>
          <div className={shell.actions}>
            {authConfig?.devAuth || isLocalDevSite() ? (
              <a className={shell.button} href={DEV_LOGIN_URL}>
                Continue as local contributor
              </a>
            ) : null}
            {authConfig?.githubAuth ? (
              <a className={shell.button} href={GITHUB_LOGIN_URL}>
                Continue with GitHub
              </a>
            ) : null}
            {!authConfig?.devAuth && !authConfig?.githubAuth && !isLocalDevSite() ? (
              <Link className={shell.button} href="/login">
                Open login
              </Link>
            ) : null}
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
            Signed in as <strong>{me.username}</strong>
            {me.authProvider === "email"
              ? me.email
                ? ` (email ${me.email})`
                : " (email sign-in)"
              : me.githubLogin
                ? ` (GitHub @${me.githubLogin})`
                : ""}
            . Only allowlisted AIPM usernames
            (including email-derived usernames) can unlock admin after the password check. Local password:{" "}
            <code>local-admin</code>.
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
    <main className={cn(dash.dashboardPage, dash.dashboardPageFull)}>
      <section className={dash.dashboardWorkspace}>
        <div className={dash.adminTopBar}>
          <span className={shell.muted}>Signed in as {adminSession.username}</span>
          <button className={cn(shell.button, shell.secondary)} type="button" onClick={() => void onLogout()} disabled={submitting}>
            Sign out of admin
          </button>
        </div>
        <AdminImportSkillPanel onImported={loadStats} />
        <InternalStatsPanel stats={stats} />
      </section>
    </main>
  );
}
