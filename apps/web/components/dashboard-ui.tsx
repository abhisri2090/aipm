"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CodeBlock } from "./code-block";
import { DEV_LOGIN_URL, GITHUB_LOGIN_URL, isLocalDevSite, packagePath } from "../lib/registry";
import { cn } from "../lib/class-names";
import shell from "../app/page-shell.module.css";
import docs from "../app/docs-content.module.css";
import dash from "./dashboard-ui.module.css";

type Me = {
  id: string;
  username: string;
  githubLogin: string;
  name: string | null;
  avatarUrl: string | null;
};

type Org = {
  slug: string;
  name: string;
  ownerUserId?: string;
  createdAt: string;
  role?: OrgRole;
};

type ReservedPackage = {
  name: string;
  createdAt: string;
};

type OrgRole = "owner" | "admin" | "member" | "viewer";

type OrgMember = {
  userId: string;
  role: OrgRole;
  joinedAt: string;
  updatedAt: string;
  githubLogin: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  contactEmail: string | null;
};

type OrgInvite = {
  id: string;
  email: string | null;
  githubLogin: string | null;
  role: Exclude<OrgRole, "owner">;
  status: "pending" | "accepted" | "revoked";
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
};

type OrgAuditEvent = {
  id: string;
  type: string;
  actor: string | null;
  target: string | null;
  targetUserId: string | null;
  packageName: string | null;
  inviteId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type PackageMember = {
  userId: string;
  role: "maintainer";
  addedAt: string;
  updatedAt: string;
  githubLogin: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

type PublishedPackageVersion = {
  name: string;
  version: string;
  description: string;
  targets: string[];
  createdAt: string;
};

function publicApiError(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "AIPM API timed out. The registry host may be offline or starting.";
  }
  if (error instanceof TypeError) {
    return "AIPM API is unreachable. The website can still load, but account and publishing actions need the API online.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "AIPM API is unavailable.";
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
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
    if (response.status === 401) throw new Error("Login required");
    throw new Error(error.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function roleLabel(role?: string | null): string {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function canManageOrg(role?: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

function activeOrgStorageKey(userId: string): string {
  return `aipm-active-org:${userId}`;
}

function packageHref(name: string): string {
  return `/dashboard/packages/${name.replace(/^@/, "")}`;
}

function packageFolderName(name: string): string {
  return name.split("/").pop() ?? "skill";
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function Avatar({ user, size = "normal" }: { user: Me | null; size?: "normal" | "large" }) {
  const label = user?.name ?? user?.githubLogin ?? "AIPM user";
  const initial = label.trim().charAt(0).toUpperCase() || "A";
  return user?.avatarUrl ? (
    <img alt="" className={cn(dash.avatar, size === "large" && dash.avatarLarge)} src={user.avatarUrl} />
  ) : (
    <span className={cn(dash.avatar, size === "large" && dash.avatarLarge)}>{initial}</span>
  );
}

function LoadingShell() {
  return (
    <main className={dash.dashboardPage}>
      <section className={dash.dashboardEmptyState}>
        <p className={shell.eyebrow}>Dashboard</p>
        <h1>Loading your workspace.</h1>
        <p className={shell.lede}>Fetching account, organization, and package details.</p>
      </section>
    </main>
  );
}

function LoginRequired({ message }: { message: string }) {
  const apiOffline = message.includes("API") || message.includes("abort") || message.includes("unreachable");
  return (
    <main className={dash.dashboardPage}>
      <section className={dash.loginScreen}>
        <div>
          <p className={shell.eyebrow}>Dashboard</p>
          <h1>{apiOffline ? "Publisher services are not reachable." : "Sign in to manage AIPM publishing."}</h1>
          <p className={shell.lede}>{message}</p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/login">
              Sign in
            </Link>
            <Link className={cn(shell.button, shell.secondary)} href="/publish">
              Publishing guide
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardShell({
  active,
  children,
  intro,
  title,
}: {
  active: "overview" | "orgs" | "members" | "packages" | "tokens" | "activity" | "profile" | "guide";
  children: (context: { me: Me; orgs: Org[]; activeOrg: Org | null; setActiveOrgSlug: (slug: string) => void }) => ReactNode;
  intro?: string;
  title: string;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgSlug, setActiveOrgSlugState] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Me>("/v1/me"), api<{ orgs: Org[] }>("/v1/orgs")])
      .then(([user, orgData]) => {
        setMe(user);
        setOrgs(orgData.orgs);
        const requestedOrg = new URLSearchParams(window.location.search).get("org");
        const saved = window.localStorage.getItem(activeOrgStorageKey(user.id));
        const nextActive =
          orgData.orgs.find((org) => org.slug === requestedOrg)?.slug ??
          orgData.orgs.find((org) => org.slug === saved)?.slug ??
          orgData.orgs[0]?.slug ??
          "";
        setActiveOrgSlugState(nextActive);
        if (nextActive) window.localStorage.setItem(activeOrgStorageKey(user.id), nextActive);
      })
      .catch((err: unknown) => setError(publicApiError(err)));
  }, []);

  if (error) return <LoginRequired message={error} />;
  if (!me) return <LoadingShell />;

  const activeOrg = orgs.find((org) => org.slug === activeOrgSlug) ?? orgs[0] ?? null;
  const setActiveOrgSlug = (slug: string) => {
    setActiveOrgSlugState(slug);
    window.localStorage.setItem(activeOrgStorageKey(me.id), slug);
  };

  const navItems = [
    { href: "/dashboard", id: "overview", label: "Overview" },
    { href: "/dashboard/orgs", id: "orgs", label: "Organizations" },
    { href: "/dashboard/members", id: "members", label: "Members" },
    { href: "/dashboard/packages", id: "packages", label: "Packages" },
    { href: "/dashboard/tokens", id: "tokens", label: "Publish tokens" },
    { href: "/dashboard/activity", id: "activity", label: "Activity" },
    { href: "/dashboard/profile", id: "profile", label: "Profile" },
    { href: "/publish/guide", id: "guide", label: "Publishing guide" },
  ];

  return (
    <main className={dash.dashboardPage}>
      <aside className={dash.dashboardSidebar}>
        <Link className={dash.dashboardLogo} href="/dashboard">
          <img alt="" src="/aipm-logo.svg" />
          <span>AIPM</span>
        </Link>
        <div className={cn(dash.accountCard, dash.accountCardCompact)}>
          <Avatar user={me} />
          <div>
            <strong>{me.name ?? me.username}</strong>
            <span>{me.username}</span>
          </div>
        </div>
        <div className={dash.orgSwitcher}>
          <label htmlFor="dashboard-org-switcher">Workspace</label>
          {orgs.length > 0 ? (
            <select
              id="dashboard-org-switcher"
              value={activeOrg?.slug ?? ""}
              onChange={(event) => setActiveOrgSlug(event.target.value)}
            >
              {orgs.map((org) => (
                <option key={org.slug} value={org.slug}>
                  @{org.slug}
                </option>
              ))}
            </select>
          ) : (
            <Link href="/dashboard/orgs">Create first org</Link>
          )}
        </div>
        <nav className={dash.dashboardNav} aria-label="Dashboard">
          {navItems.map((item) => (
            <Link aria-current={active === item.id ? "page" : undefined} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={dash.sidebarNote}>
          <strong>{orgs.length}</strong>
          <span>{orgs.length === 1 ? "org" : "orgs"} connected</span>
        </div>
        <div className={dash.sidebarHelp}>
          <strong>{activeOrg ? `@${activeOrg.slug}` : "No workspace yet"}</strong>
          <span>{activeOrg ? `${roleLabel(activeOrg.role)} access` : "Create an org to start publishing."}</span>
        </div>
      </aside>

      <section className={dash.dashboardWorkspace}>
        <header className={dash.dashboardHero}>
          <div>
            <p className={shell.eyebrow}>Publisher console</p>
            <h1>{title}</h1>
            {intro ? <p className={shell.lede}>{intro}</p> : null}
          </div>
          <div className={dash.dashboardHeroActions}>
            <Link className={cn(shell.button, shell.secondary)} href="/publish">
              Docs
            </Link>
            <Link className={shell.button} href="/dashboard/orgs">
              New org
            </Link>
          </div>
        </header>
        {children({ me, orgs, activeOrg, setActiveOrgSlug })}
      </section>
    </main>
  );
}

export function LoginPanel() {
  const localDev = isLocalDevSite();
  const [authConfig, setAuthConfig] = useState<{ devAuth: boolean; githubAuth: boolean } | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api<{ devAuth: boolean; githubAuth: boolean }>("/v1/auth/config")
      .then((config) => {
        if (!cancelled) {
          setAuthConfig(config);
          setConfigError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAuthConfig({ devAuth: false, githubAuth: false });
          setConfigError(publicApiError(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showDevLogin = localDev || authConfig?.devAuth === true;
  const showGithubLogin = authConfig?.githubAuth === true;

  return (
    <main>
      <section className={dash.loginScreen}>
        <div className={dash.loginCard}>
          <img alt="" className={dash.loginLogo} src="/aipm-logo.svg" />
          <p className={shell.eyebrow}>Publisher access</p>
          <h1>Build and ship reusable AI skills.</h1>
          <p className={shell.lede}>
            Sign in to reserve namespaces, manage packages, generate short-lived publish tokens,
            and keep your AI tooling ready for real projects.
          </p>
          <div className={shell.actions}>
            {authConfig === null && !localDev ? (
              <span className={shell.muted}>Checking sign-in options…</span>
            ) : null}
            {showDevLogin ? (
              <a className={shell.button} href={DEV_LOGIN_URL}>
                Continue as local contributor
              </a>
            ) : null}
            {showGithubLogin ? (
              <a className={shell.button} href={GITHUB_LOGIN_URL}>
                Continue with GitHub
              </a>
            ) : null}
            {!showDevLogin && !showGithubLogin && authConfig !== null ? (
              <p className={shell.muted}>Publisher sign-in is not configured on this API.</p>
            ) : null}
            {configError && localDev ? (
              <p className={shell.muted}>
                {configError} Start the registry API with <code>pnpm local:api</code>, then retry.
              </p>
            ) : null}
            <Link className={cn(shell.button, shell.secondary)} href="/publish">
              Read publishing guide
            </Link>
          </div>
        </div>
        <aside className={dash.loginSidePanel}>
          <h2>What you get</h2>
          <ul className={docs.checkList}>
            <li>Organization namespaces for package ownership.</li>
            <li>Reserved skill names before publishing.</li>
            <li>Five-minute publish tokens for safer CLI pushes.</li>
            <li>A profile that makes packages feel accountable.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}

function InviteAcceptBanner() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (!invite) return;

    setMessage("Accepting organization invite...");
    api<{ ok: boolean }>(`/v1/org-invites/${encodeURIComponent(invite)}/accept`, {
      method: "POST",
      body: "{}",
    })
      .then(() => {
        setMessage("Invite accepted. Your organization access is ready.");
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete("invite");
        window.history.replaceState({}, "", nextUrl.toString());
      })
      .catch((err: unknown) => setMessage(publicApiError(err)));
  }, []);

  if (!message) return null;
  return <p className={shell.notice}>{message}</p>;
}

export function DashboardHome() {
  return (
    <DashboardShell
      active="overview"
      intro="Manage publisher profile, organization namespaces, package reservations, and token-based releases."
      title="Your publishing workspace"
    >
      {({ me, orgs }) => {
        const packageCount = orgs.length;
        const nextAction = !me.name
          ? { href: "/dashboard/profile", label: "Complete profile" }
          : orgs.length === 0
            ? { href: "/dashboard/orgs", label: "Create org" }
            : { href: "/dashboard/packages", label: "Manage packages" };
        return (
          <>
            <InviteAcceptBanner />
            <section className={dash.metricGrid}>
              <article className={dash.metricCard}>
                <span>Profile</span>
                <strong>{me.name ? "Complete" : "Needs name"}</strong>
                <p>{me.name ?? "Add a display name so published packages feel trustworthy."}</p>
              </article>
              <article className={dash.metricCard}>
                <span>Organizations</span>
                <strong>{orgs.length}</strong>
                <p>Create scopes for teams, products, or projects.</p>
              </article>
              <article className={dash.metricCard}>
                <span>Next release</span>
                <strong>{packageCount > 0 ? "Ready" : "Setup"}</strong>
                <p>{packageCount > 0 ? "Open a package to generate a publish token." : "Create an org first."}</p>
              </article>
            </section>

            <section className={dash.nextActionPanel}>
              <div>
                <p className={shell.eyebrow}>Next best action</p>
                <h2>Move one step closer to publishing.</h2>
                <p>
                  AIPM keeps publishing gated by identity, namespace ownership, package reservation,
                  and short-lived CLI tokens.
                </p>
              </div>
              <Link className={shell.button} href={nextAction.href}>
                {nextAction.label}
              </Link>
            </section>

            <section className={dash.dashboardGrid}>
              <article className={dash.dashboardPanel}>
                <div className={shell.sectionHeading}>
                  <div>
                    <p className={shell.eyebrow}>Start here</p>
                    <h2>Publishing checklist</h2>
                  </div>
                </div>
                <ol className={dash.workflowList}>
                  <li>
                    <strong>1. Complete profile</strong>
                    <span>Add name and avatar for publisher trust.</span>
                  </li>
                  <li>
                    <strong>2. Create org</strong>
                    <span>Reserve your npm-style package scope.</span>
                  </li>
                  <li>
                    <strong>3. Reserve skill</strong>
                    <span>Lock a package name before publishing.</span>
                  </li>
                  <li>
                    <strong>4. Push from CLI</strong>
                    <span>Generate token, then publish the staged skill.</span>
                  </li>
                </ol>
              </article>

              <article className={dash.dashboardPanel}>
                <div className={shell.sectionHeading}>
                  <div>
                    <p className={shell.eyebrow}>Namespaces</p>
                    <h2>Your orgs</h2>
                  </div>
                  <Link className={shell.textLink} href="/dashboard/orgs">
                    Create org
                  </Link>
                </div>
                {orgs.length > 0 ? (
                  <div className={dash.resourceList}>
                    {orgs.map((org) => (
                      <button
                        className={dash.resourceButton}
                        type="button"
                        onClick={() => {
                          window.localStorage.setItem(activeOrgStorageKey(me.id), org.slug);
                          window.location.href = "/dashboard/orgs";
                        }}
                        key={org.slug}
                      >
                        <span>
                          <strong>@{org.slug}</strong>
                          <small>
                            {org.name}
                            {org.role ? ` · ${roleLabel(org.role)}` : ""}
                          </small>
                        </span>
                        <small>{shortDate(org.createdAt)}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={shell.empty}>
                    No orgs yet. Create one to reserve your first skill name and unlock package tokens.
                  </div>
                )}
              </article>
            </section>
          </>
        );
      }}
    </DashboardShell>
  );
}

function NoActiveOrg({ action = "Create organization" }: { action?: string }) {
  return (
    <section className={dash.dashboardPanel}>
      <p className={shell.eyebrow}>Workspace required</p>
      <h2>Create an organization first.</h2>
      <p className={shell.muted}>
        Organizations own package scopes, members, invites, publishing tokens, and activity.
      </p>
      <Link className={shell.button} href="/dashboard/orgs">
        {action}
      </Link>
    </section>
  );
}

export function OrgsDashboard() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <DashboardShell
      active="orgs"
      intro="Create and switch publisher workspaces without drilling through nested pages."
      title="Organizations"
    >
      {({ orgs, me, setActiveOrgSlug }) => (
        <section className={dash.dashboardGrid}>
          <article className={dash.dashboardPanel}>
            <div className={shell.sectionHeading}>
              <div>
                <p className={shell.eyebrow}>Workspaces</p>
                <h2>Your organizations</h2>
              </div>
            </div>
            {orgs.length > 0 ? (
              <div className={dash.resourceList}>
                {orgs.map((org) => (
                  <button
                    className={dash.resourceButton}
                    key={org.slug}
                    type="button"
                    onClick={() => setActiveOrgSlug(org.slug)}
                  >
                    <span>
                      <strong>@{org.slug}</strong>
                      <small>{org.name} · {roleLabel(org.role)}</small>
                    </span>
                    <small>{shortDate(org.createdAt)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className={shell.empty}>No organizations yet. Create one to reserve your first package scope.</div>
            )}
          </article>

          <form
            className={cn(dash.dashboardPanel, dash.formPanel)}
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              try {
                const org = await api<Org>("/v1/orgs", {
                  method: "POST",
                  body: JSON.stringify({ slug, name: name || slug }),
                });
                window.localStorage.setItem(activeOrgStorageKey(me.id), org.slug);
                window.location.href = "/dashboard/orgs";
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <p className={shell.eyebrow}>Create org</p>
            <h2>Reserve a scope</h2>
            <label htmlFor="org-slug">Org slug</label>
            <input
              id="org-slug"
              onChange={(event) => setSlug(event.target.value)}
              placeholder="bazzigames"
              value={slug}
            />
            <p className={dash.fieldHelp}>Use lowercase letters, numbers, and hyphens. This becomes your package scope.</p>
            <label htmlFor="org-name">Display name</label>
            <input id="org-name" onChange={(event) => setName(event.target.value)} placeholder="Bazzi Games" value={name} />
            {error ? <p className={shell.notice}>{error}</p> : null}
            <button type="submit">Create organization</button>
          </form>
        </section>
      )}
    </DashboardShell>
  );
}

function PackagesContent({ org }: { org: Org }) {
  const [packages, setPackages] = useState<ReservedPackage[]>([]);
  const [packageName, setPackageName] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api<{ packages: ReservedPackage[] }>(`/v1/orgs/${org.slug}/packages`)
      .then((data) => {
        setPackages(data.packages);
        setError("");
      })
      .catch((err: unknown) => setError(publicApiError(err)));
  }, [org.slug]);

  const canReserve = canManageOrg(org.role);

  return (
    <section className={dash.dashboardGrid}>
      <article className={dash.dashboardPanel}>
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>@{org.slug}</p>
            <h2>Reserved packages</h2>
          </div>
        </div>
        {error ? <p className={shell.notice}>{error}</p> : null}
        {packages.length > 0 ? (
          <div className={dash.resourceList}>
            {packages.map((pkg) => (
              <Link className={dash.resourceRow} href={packageHref(pkg.name)} key={pkg.name}>
                <span>
                  <strong>{pkg.name}</strong>
                  <small>Open package detail, maintainers, versions, and CLI commands</small>
                </span>
                <small>{shortDate(pkg.createdAt)}</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className={shell.empty}>No packages reserved in @{org.slug} yet.</div>
        )}
      </article>
      <form
        className={cn(dash.dashboardPanel, dash.formPanel)}
        onSubmit={async (event) => {
          event.preventDefault();
          setStatus("");
          try {
            const pkg = await api<ReservedPackage>(`/v1/orgs/${org.slug}/packages`, {
              method: "POST",
              body: JSON.stringify({ name: packageName }),
            });
            setPackageName("");
            setPackages((current) => [pkg, ...current.filter((item) => item.name !== pkg.name)]);
            setStatus(`Reserved ${pkg.name}.`);
          } catch (err) {
            setStatus((err as Error).message);
          }
        }}
      >
        <p className={shell.eyebrow}>Reserve package</p>
        <h2>Claim a skill name</h2>
        <label htmlFor="package-name">Package name</label>
        <input
          disabled={!canReserve}
          id="package-name"
          onChange={(event) => setPackageName(event.target.value)}
          placeholder="review-helper"
          value={packageName}
        />
        <p className={dash.fieldHelp}>Use a short name, or paste @{org.slug}/review-helper.</p>
        {status ? <p className={shell.notice}>{status}</p> : null}
        <button disabled={!canReserve} type="submit">Reserve package</button>
        {!canReserve ? <p className={dash.fieldHelp}>Only owners and admins can reserve package names.</p> : null}
      </form>
    </section>
  );
}

export function PackagesDashboard() {
  return (
    <DashboardShell
      active="packages"
      intro="Reserve and manage skill package names for the selected workspace."
      title="Packages"
    >
      {({ activeOrg }) => (activeOrg ? <PackagesContent org={activeOrg} /> : <NoActiveOrg />)}
    </DashboardShell>
  );
}

export function NewOrgForm() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <DashboardShell
      active="orgs"
      intro="Create a namespace that will own package names such as @acme/review-helper."
      title="Create organization"
    >
      {() => (
        <form
          className={cn(dash.dashboardPanel, dash.formPanel)}
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              const org = await api<Org>("/v1/orgs", {
                method: "POST",
                body: JSON.stringify({ slug, name: name || slug }),
              });
              window.location.href = `/dashboard/orgs/${org.slug}`;
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <label htmlFor="org-slug">Org slug</label>
          <input
            id="org-slug"
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Company name"
            value={slug}
          />
          <p className={dash.fieldHelp}>Use lowercase letters, numbers, and hyphens. This becomes your package scope.</p>
          <label htmlFor="org-name">Display name</label>
          <input id="org-name" onChange={(event) => setName(event.target.value)} placeholder="Company display name" value={name} />
          {error ? <p className={shell.notice}>{error}</p> : null}
          <button type="submit">Create organization</button>
          <p className={dash.fieldHelp}>
            After this, reserve your first package name inside the org namespace.
          </p>
        </form>
      )}
    </DashboardShell>
  );
}

function MembersContent({ org }: { org: Org }) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteGithub, setInviteGithub] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<OrgRole, "owner">>("member");
  const [inviteLink, setInviteLink] = useState("");
  const [status, setStatus] = useState("");
  const manageOrg = canManageOrg(org.role);

  const reload = useCallback(() => {
    setStatus("");
    Promise.all([
      api<{ members: OrgMember[] }>(`/v1/orgs/${org.slug}/members`),
      manageOrg ? api<{ invites: OrgInvite[] }>(`/v1/orgs/${org.slug}/invites`) : Promise.resolve({ invites: [] }),
    ])
      .then(([memberData, inviteData]) => {
        setMembers(memberData.members);
        setInvites(inviteData.invites);
      })
      .catch((err: unknown) => setStatus(publicApiError(err)));
  }, [manageOrg, org.slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <>
      <section className={dash.metricGrid}>
        <article className={dash.metricCard}>
          <span>Workspace</span>
          <strong>@{org.slug}</strong>
          <p>{roleLabel(org.role)} access</p>
        </article>
        <article className={dash.metricCard}>
          <span>Members</span>
          <strong>{members.length}</strong>
          <p>People who can view or manage this organization.</p>
        </article>
        <article className={dash.metricCard}>
          <span>Pending invites</span>
          <strong>{invites.filter((invite) => invite.status === "pending").length}</strong>
          <p>Invite links expire after 7 days.</p>
        </article>
      </section>

      <section className={dash.dashboardGrid}>
        <article className={dash.dashboardPanel}>
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>Members</p>
              <h2>Access control</h2>
            </div>
          </div>
          <div className={dash.tableWrap}>
            <table className={dash.table}>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId}>
                    <td>
                      <strong>{member.name ?? member.username}</strong>
                      <small>@{member.githubLogin}</small>
                    </td>
                    <td>
                      {manageOrg && member.role !== "owner" ? (
                        <select
                          value={member.role}
                          onChange={async (event) => {
                            try {
                              await api<OrgMember>(`/v1/orgs/${org.slug}/members/${member.userId}`, {
                                method: "PATCH",
                                body: JSON.stringify({ role: event.target.value }),
                              });
                              reload();
                            } catch (err) {
                              setStatus((err as Error).message);
                            }
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={dash.rolePill}>{roleLabel(member.role)}</span>
                      )}
                    </td>
                    <td>{shortDate(member.joinedAt)}</td>
                    <td>
                      {manageOrg && member.role !== "owner" ? (
                        <button
                          className={dash.textButton}
                          type="button"
                          onClick={async () => {
                            try {
                              await api<void>(`/v1/orgs/${org.slug}/members/${member.userId}`, { method: "DELETE" });
                              reload();
                            } catch (err) {
                              setStatus((err as Error).message);
                            }
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={dash.dashboardPanel}>
          <p className={shell.eyebrow}>Invite teammates</p>
          <h2>Send access</h2>
          {manageOrg ? (
            <form
              className={dash.compactForm}
              onSubmit={async (event) => {
                event.preventDefault();
                setStatus("");
                setInviteLink("");
                try {
                  const invite = await api<OrgInvite & { inviteUrl: string }>(`/v1/orgs/${org.slug}/invites`, {
                    method: "POST",
                    body: JSON.stringify({
                      email: inviteEmail || null,
                      githubLogin: inviteGithub || null,
                      role: inviteRole,
                    }),
                  });
                  setInviteEmail("");
                  setInviteGithub("");
                  setInviteLink(invite.inviteUrl);
                  reload();
                } catch (err) {
                  setStatus((err as Error).message);
                }
              }}
            >
              <label htmlFor="invite-email">Email</label>
              <input id="invite-email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="person@example.com" />
              <label htmlFor="invite-github">GitHub username</label>
              <input id="invite-github" value={inviteGithub} onChange={(event) => setInviteGithub(event.target.value)} placeholder="github-user" />
              <label htmlFor="invite-role">Role</label>
              <select id="invite-role" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Exclude<OrgRole, "owner">)}>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit">Create invite</button>
            </form>
          ) : (
            <p className={shell.muted}>Only owners and admins can invite teammates.</p>
          )}
          {inviteLink ? (
            <section className={dash.tokenResult}>
              <p>Share this invite link. It is shown once.</p>
              <CodeBlock code={inviteLink} />
            </section>
          ) : null}
        </article>
      </section>

      {manageOrg ? (
        <section className={dash.dashboardPanelSpaced}>
          <article className={dash.dashboardPanel}>
            <div className={shell.sectionHeading}>
              <div>
                <p className={shell.eyebrow}>Pending invites</p>
                <h2>Invites</h2>
              </div>
            </div>
            {invites.length > 0 ? (
              <div className={dash.resourceList}>
                {invites.map((invite) => (
                  <div className={dash.resourceRow} key={invite.id}>
                    <span>
                      <strong>{invite.githubLogin ? `@${invite.githubLogin}` : invite.email}</strong>
                      <small>{roleLabel(invite.role)} · {invite.status} · expires {shortDate(invite.expiresAt)}</small>
                    </span>
                    {invite.status === "pending" ? (
                      <span className={dash.rowActions}>
                        <button
                          className={dash.textButton}
                          type="button"
                          onClick={async () => {
                            setInviteLink("");
                            try {
                              const result = await api<{ inviteUrl: string }>(
                                `/v1/orgs/${org.slug}/invites/${invite.id}/resend`,
                                { method: "POST", body: "{}" },
                              );
                              setInviteLink(result.inviteUrl);
                              reload();
                            } catch (err) {
                              setStatus((err as Error).message);
                            }
                          }}
                        >
                          New link
                        </button>
                        <button
                          className={dash.textButton}
                          type="button"
                          onClick={async () => {
                            try {
                              await api<void>(`/v1/orgs/${org.slug}/invites/${invite.id}`, { method: "DELETE" });
                              reload();
                            } catch (err) {
                              setStatus((err as Error).message);
                            }
                          }}
                        >
                          Revoke
                        </button>
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className={shell.empty}>No invites yet.</div>
            )}
          </article>
        </section>
      ) : null}
      {status ? <p className={shell.notice}>{status}</p> : null}
    </>
  );
}

export function MembersDashboard() {
  return (
    <DashboardShell
      active="members"
      intro="Invite teammates, change roles, and keep membership separate from package work."
      title="Members"
    >
      {({ activeOrg }) => (activeOrg ? <MembersContent org={activeOrg} /> : <NoActiveOrg />)}
    </DashboardShell>
  );
}

function TokensContent({ org }: { org: Org }) {
  const [packages, setPackages] = useState<ReservedPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [token, setToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api<{ packages: ReservedPackage[] }>(`/v1/orgs/${org.slug}/packages`)
      .then((data) => {
        setPackages(data.packages);
        setSelectedPackage((current) => current || data.packages[0]?.name || "");
      })
      .catch((err: unknown) => setStatus(publicApiError(err)));
  }, [org.slug]);

  const pushCommand = token ? `AIPM_TOKEN=${shellQuote(token.token)} aipm publish push --yes` : "";

  return (
    <section className={dash.dashboardGrid}>
      <article className={dash.dashboardPanel}>
        <p className={shell.eyebrow}>Token</p>
        <h2>Generate a publish token</h2>
        <p className={shell.muted}>Choose a package in @{org.slug}. Tokens expire after 5 minutes and are shown once.</p>
        <form
          className={dash.compactForm}
          onSubmit={async (event) => {
            event.preventDefault();
            setStatus("");
            setToken(null);
            try {
              setToken(
                await api<{ token: string; expiresAt: string }>(
                  `/v1/packages/${encodeURIComponent(selectedPackage)}/publish-tokens`,
                  { method: "POST", body: "{}" },
                ),
              );
            } catch (err) {
              setStatus((err as Error).message);
            }
          }}
        >
          <label htmlFor="token-package">Package</label>
          <select id="token-package" value={selectedPackage} onChange={(event) => setSelectedPackage(event.target.value)}>
            {packages.map((pkg) => (
              <option key={pkg.name} value={pkg.name}>
                {pkg.name}
              </option>
            ))}
          </select>
          <button disabled={!selectedPackage} type="submit">Generate token</button>
        </form>
        {status ? <p className={shell.notice}>{status}</p> : null}
        {token ? (
          <section className={dash.tokenResult}>
            <p>This token expires at {new Date(token.expiresAt).toLocaleString()}.</p>
            <CodeBlock code={token.token} />
            <h3>Push command</h3>
            <CodeBlock code={pushCommand} />
          </section>
        ) : null}
      </article>

      <article className={dash.dashboardPanel}>
        <p className={shell.eyebrow}>CLI flow</p>
        <h2>Publish from terminal</h2>
        <CodeBlock
          code={`aipm publish add .
aipm publish validate
aipm publish token --package ${selectedPackage || `@${org.slug}/your-package`} # optional
AIPM_TOKEN=<token> aipm publish push --yes`}
        />
      </article>
    </section>
  );
}

export function TokensDashboard() {
  return (
    <DashboardShell
      active="tokens"
      intro="Generate short-lived publish tokens without opening a package detail page."
      title="Publish tokens"
    >
      {({ activeOrg }) => (activeOrg ? <TokensContent org={activeOrg} /> : <NoActiveOrg />)}
    </DashboardShell>
  );
}

function ActivityContent({ org }: { org: Org }) {
  const [events, setEvents] = useState<OrgAuditEvent[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!canManageOrg(org.role)) return;
    api<{ events: OrgAuditEvent[] }>(`/v1/orgs/${org.slug}/audit-events`)
      .then((data) => setEvents(data.events))
      .catch((err: unknown) => setStatus(publicApiError(err)));
  }, [org]);

  if (!canManageOrg(org.role)) {
    return (
      <section className={dash.dashboardPanel}>
        <p className={shell.eyebrow}>Activity</p>
        <h2>Admin access required.</h2>
        <p className={shell.muted}>Only owners and admins can view the audit log.</p>
      </section>
    );
  }

  return (
    <section className={dash.dashboardPanel}>
      <div className={shell.sectionHeading}>
        <div>
          <p className={shell.eyebrow}>@{org.slug}</p>
          <h2>Recent activity</h2>
        </div>
      </div>
      {status ? <p className={shell.notice}>{status}</p> : null}
      {events.length > 0 ? (
        <div className={dash.auditList}>
          {events.map((event) => (
            <div key={event.id}>
              <strong>{event.type.replaceAll(".", " ")}</strong>
              <span>
                {event.actor ?? "System"}
                {event.target ? ` → ${event.target}` : ""}
                {event.packageName ? ` · ${event.packageName}` : ""}
              </span>
              <small>{new Date(event.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className={shell.empty}>No activity yet.</div>
      )}
    </section>
  );
}

export function ActivityDashboard() {
  return (
    <DashboardShell
      active="activity"
      intro="See invites, member changes, package reservations, and access changes in one place."
      title="Activity"
    >
      {({ activeOrg }) => (activeOrg ? <ActivityContent org={activeOrg} /> : <NoActiveOrg />)}
    </DashboardShell>
  );
}

export function OrgDashboard({ orgSlug }: { orgSlug: string }) {
  const [org, setOrg] = useState<Org | null>(null);
  const [packages, setPackages] = useState<ReservedPackage[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [auditEvents, setAuditEvents] = useState<OrgAuditEvent[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteGithub, setInviteGithub] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<OrgRole, "owner">>("member");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const reload = useCallback(() => {
    setError("");
    Promise.all([
      api<Org>(`/v1/orgs/${orgSlug}`),
      api<{ packages: ReservedPackage[] }>(`/v1/orgs/${orgSlug}/packages`),
      api<{ members: OrgMember[] }>(`/v1/orgs/${orgSlug}/members`),
    ])
      .then(([orgData, packageData, memberData]) => {
        setOrg(orgData);
        setPackages(packageData.packages);
        setMembers(memberData.members);
        if (canManageOrg(orgData.role)) {
          return Promise.all([
            api<{ invites: OrgInvite[] }>(`/v1/orgs/${orgSlug}/invites`),
            api<{ events: OrgAuditEvent[] }>(`/v1/orgs/${orgSlug}/audit-events`),
          ]).then(([inviteData, auditData]) => {
            setInvites(inviteData.invites);
            setAuditEvents(auditData.events);
          });
        }
        setInvites([]);
        setAuditEvents([]);
        return undefined;
      })
      .catch((err: unknown) => setError(publicApiError(err)));
  }, [orgSlug]);

  useEffect(() => {
    reload();
  }, [reload]);

  const manageOrg = canManageOrg(org?.role);

  return (
    <DashboardShell
      active="packages"
      intro="Control packages, teammates, invites, and access for this publisher namespace."
      title={`@${orgSlug}`}
    >
      {() => (
        <>
          {error ? <p className={shell.notice}>{error}</p> : null}
          <section className={dash.metricGrid}>
            <article className={dash.metricCard}>
              <span>Your role</span>
              <strong>{roleLabel(org?.role)}</strong>
              <p>{manageOrg ? "You can manage invites, members, and package access." : "Your access is limited by org role."}</p>
            </article>
            <article className={dash.metricCard}>
              <span>Members</span>
              <strong>{members.length}</strong>
              <p>Owner, admins, members, and viewers in this namespace.</p>
            </article>
            <article className={dash.metricCard}>
              <span>Packages</span>
              <strong>{packages.length}</strong>
              <p>Reserved package names under @{orgSlug}.</p>
            </article>
          </section>

          <section className={dash.dashboardGrid}>
            <article className={dash.dashboardPanel}>
              <div className={shell.sectionHeading}>
                <div>
                  <p className={shell.eyebrow}>Packages</p>
                  <h2>Reserved skill names</h2>
                </div>
                {manageOrg ? (
                  <Link className={shell.button} href={`/dashboard/orgs/${orgSlug}/packages/new`}>
                    Reserve package
                  </Link>
                ) : null}
              </div>
              {packages.length > 0 ? (
                <div className={dash.resourceList}>
                  {packages.map((pkg) => (
                    <Link className={dash.resourceRow} href={packageHref(pkg.name)} key={pkg.name}>
                      <span>
                        <strong>{pkg.name}</strong>
                        <small>Ready for token-based publishing</small>
                      </span>
                      <small>{shortDate(pkg.createdAt)}</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={shell.empty}>
                  No packages reserved yet. Reserve a skill name before generating a token or publishing from the CLI.
                </div>
              )}
            </article>

            <article className={dash.dashboardPanel}>
              <div className={shell.sectionHeading}>
                <div>
                  <p className={shell.eyebrow}>Org overview</p>
                  <h2>{org?.name ?? `@${orgSlug}`}</h2>
                </div>
              </div>
              <dl className={dash.detailList}>
                <div>
                  <dt>Slug</dt>
                  <dd>@{orgSlug}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{org?.createdAt ? shortDate(org.createdAt) : "Loading"}</dd>
                </div>
                <div>
                  <dt>Owner ID</dt>
                  <dd>{org?.ownerUserId ?? "Loading"}</dd>
                </div>
              </dl>
              {org?.role !== "owner" ? (
                <button
                  className={dash.secondaryButton}
                  type="button"
                  onClick={async () => {
                    setStatus("");
                    try {
                      await api<{ ok: boolean }>(`/v1/orgs/${orgSlug}/leave`, { method: "POST", body: "{}" });
                      window.location.href = "/dashboard";
                    } catch (err) {
                      setStatus((err as Error).message);
                    }
                  }}
                >
                  Leave org
                </button>
              ) : null}
            </article>
          </section>

          <section className={dash.dashboardGrid}>
            <article className={dash.dashboardPanel}>
              <div className={shell.sectionHeading}>
                <div>
                  <p className={shell.eyebrow}>Admin panel</p>
                  <h2>Members</h2>
                </div>
              </div>
              <div className={dash.tableWrap}>
                <table className={dash.table}>
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.userId}>
                        <td>
                          <strong>{member.name ?? member.username}</strong>
                          <small>@{member.githubLogin} · {member.userId}</small>
                        </td>
                        <td>
                          {manageOrg && member.role !== "owner" ? (
                            <select
                              value={member.role}
                              onChange={async (event) => {
                                setStatus("");
                                try {
                                  await api<OrgMember>(`/v1/orgs/${orgSlug}/members/${member.userId}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ role: event.target.value }),
                                  });
                                  reload();
                                } catch (err) {
                                  setStatus((err as Error).message);
                                }
                              }}
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className={dash.rolePill}>{roleLabel(member.role)}</span>
                          )}
                        </td>
                        <td>{shortDate(member.joinedAt)}</td>
                        <td>
                          {manageOrg && member.role !== "owner" ? (
                            <button
                              className={dash.textButton}
                              type="button"
                              onClick={async () => {
                                setStatus("");
                                try {
                                  await api<void>(`/v1/orgs/${orgSlug}/members/${member.userId}`, { method: "DELETE" });
                                  reload();
                                } catch (err) {
                                  setStatus((err as Error).message);
                                }
                              }}
                            >
                              Remove
                            </button>
                          ) : null}
                          {org?.role === "owner" && member.role !== "owner" ? (
                            <button
                              className={dash.textButton}
                              type="button"
                              onClick={async () => {
                                setStatus("");
                                try {
                                  await api<{ ok: boolean }>(`/v1/orgs/${orgSlug}/transfer-ownership`, {
                                    method: "POST",
                                    body: JSON.stringify({ userId: member.userId }),
                                  });
                                  reload();
                                } catch (err) {
                                  setStatus((err as Error).message);
                                }
                              }}
                            >
                              Transfer owner
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className={dash.dashboardPanel}>
              <p className={shell.eyebrow}>Invite teammates</p>
              <h2>Send access</h2>
              {manageOrg ? (
                <form
                  className={dash.compactForm}
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setStatus("");
                    setInviteLink("");
                    try {
                      const invite = await api<OrgInvite & { inviteUrl: string }>(`/v1/orgs/${orgSlug}/invites`, {
                        method: "POST",
                        body: JSON.stringify({
                          email: inviteEmail || null,
                          githubLogin: inviteGithub || null,
                          role: inviteRole,
                        }),
                      });
                      setInviteEmail("");
                      setInviteGithub("");
                      setInviteLink(invite.inviteUrl);
                      reload();
                    } catch (err) {
                      setStatus((err as Error).message);
                    }
                  }}
                >
                  <label htmlFor="invite-email">Email</label>
                  <input id="invite-email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="person@example.com" />
                  <label htmlFor="invite-github">GitHub username</label>
                  <input id="invite-github" value={inviteGithub} onChange={(event) => setInviteGithub(event.target.value)} placeholder="github-user" />
                  <label htmlFor="invite-role">Role</label>
                  <select id="invite-role" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Exclude<OrgRole, "owner">)}>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button type="submit">Create invite link</button>
                  <p className={dash.fieldHelp}>Invite links expire after 7 days. Use GitHub username when possible.</p>
                </form>
              ) : (
                <p className={shell.muted}>Only owners and admins can invite teammates.</p>
              )}
              {inviteLink ? (
                <section className={dash.tokenResult}>
                  <p>Share this invite link. It is shown once.</p>
                  <CodeBlock code={inviteLink} />
                </section>
              ) : null}
            </article>
          </section>

          {manageOrg ? (
            <section className={dash.dashboardGrid}>
              <article className={dash.dashboardPanel}>
                <div className={shell.sectionHeading}>
                  <div>
                    <p className={shell.eyebrow}>Pending invites</p>
                    <h2>Invites</h2>
                  </div>
                </div>
                {invites.length > 0 ? (
                  <div className={dash.resourceList}>
                    {invites.map((invite) => (
                      <div className={dash.resourceRow} key={invite.id}>
                        <span>
                          <strong>{invite.githubLogin ? `@${invite.githubLogin}` : invite.email}</strong>
                          <small>{roleLabel(invite.role)} · {invite.status} · expires {shortDate(invite.expiresAt)}</small>
                        </span>
                        {invite.status === "pending" ? (
                          <span className={dash.rowActions}>
                            <button
                              className={dash.textButton}
                              type="button"
                              onClick={async () => {
                                setStatus("");
                                setInviteLink("");
                                try {
                                  const result = await api<{ inviteUrl: string }>(
                                    `/v1/orgs/${orgSlug}/invites/${invite.id}/resend`,
                                    { method: "POST", body: "{}" },
                                  );
                                  setInviteLink(result.inviteUrl);
                                  reload();
                                } catch (err) {
                                  setStatus((err as Error).message);
                                }
                              }}
                            >
                              New link
                            </button>
                            <button
                              className={dash.textButton}
                              type="button"
                              onClick={async () => {
                                setStatus("");
                                try {
                                  await api<void>(`/v1/orgs/${orgSlug}/invites/${invite.id}`, { method: "DELETE" });
                                  reload();
                                } catch (err) {
                                  setStatus((err as Error).message);
                                }
                              }}
                            >
                              Revoke
                            </button>
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={shell.empty}>No invites yet.</div>
                )}
              </article>

              <article className={dash.dashboardPanel}>
                <div className={shell.sectionHeading}>
                  <div>
                    <p className={shell.eyebrow}>Audit log</p>
                    <h2>Recent activity</h2>
                  </div>
                </div>
                {auditEvents.length > 0 ? (
                  <div className={dash.auditList}>
                    {auditEvents.slice(0, 12).map((event) => (
                      <div key={event.id}>
                        <strong>{event.type.replaceAll(".", " ")}</strong>
                        <span>
                          {event.actor ?? "System"}
                          {event.target ? ` → ${event.target}` : ""}
                          {event.packageName ? ` · ${event.packageName}` : ""}
                        </span>
                        <small>{new Date(event.createdAt).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={shell.empty}>No audit events yet.</div>
                )}
              </article>
            </section>
          ) : null}
          {status ? <p className={shell.notice}>{status}</p> : null}
        </>
      )}
    </DashboardShell>
  );
}

export function NewPackageForm({ orgSlug }: { orgSlug: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <DashboardShell
      active="packages"
      intro="Reserve a stable package name before generating publish tokens."
      title={`Reserve package in @${orgSlug}`}
    >
      {() => (
        <form
          className={cn(dash.dashboardPanel, dash.formPanel)}
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              const pkg = await api<ReservedPackage>(`/v1/orgs/${orgSlug}/packages`, {
                method: "POST",
                body: JSON.stringify({ name }),
              });
              window.location.href = packageHref(pkg.name);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <label htmlFor="package-name">Package name</label>
          <input
            id="package-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="sentry-desktop-issue-summariser"
            value={name}
          />
          <p className={dash.fieldHelp}>Use a short name, or paste the full package name such as @{orgSlug}/review-helper.</p>
          {error ? <p className={shell.notice}>{error}</p> : null}
          <button type="submit">Reserve package</button>
          <p className={dash.fieldHelp}>After reserving, the package page will show CLI commands and token generation.</p>
        </form>
      )}
    </DashboardShell>
  );
}

export function PackageDashboard({ scope, name }: { scope: string; name: string }) {
  const packageName = `@${scope}/${name}`;
  const [token, setToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");
  const [versions, setVersions] = useState<PublishedPackageVersion[]>([]);
  const [versionsError, setVersionsError] = useState("");
  const [members, setMembers] = useState<PackageMember[]>([]);
  const [access, setAccess] = useState<{ orgRole: OrgRole | null; packageRole: "maintainer" | null } | null>(null);
  const [memberUserId, setMemberUserId] = useState("");
  const [memberStatus, setMemberStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ q: packageName, limit: "20" });
    api<{ packages: PublishedPackageVersion[] }>(`/v1/packages?${params}`)
      .then((data) => {
        setVersions(data.packages.filter((pkg) => pkg.name === packageName));
        setVersionsError("");
      })
      .catch((err: unknown) => setVersionsError(publicApiError(err)));
  }, [packageName]);

  const loadMembers = useCallback(() => {
    api<{ members: PackageMember[]; access: { orgRole: OrgRole | null; packageRole: "maintainer" | null } }>(
      `/v1/packages/${encodeURIComponent(packageName)}/members`,
    )
      .then((data) => {
        setMembers(data.members);
        setAccess(data.access);
        setMemberStatus("");
      })
      .catch((err: unknown) => setMemberStatus(publicApiError(err)));
  }, [packageName]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const canManageMembers = access?.orgRole === "owner" || access?.orgRole === "admin";

  const command = useMemo(
    () => `npm install -g @aipm-registry/cli
aipm --version
aipm doctor # (optional)
aipm publish init --name ${packageName} --template code-review
cd ${packageFolderName(packageName)}
aipm publish explain # (optional)
aipm publish add .
aipm publish status # (optional)
aipm publish preview # (optional)
aipm publish validate # (optional)
aipm publish token --package ${packageName} # (optional)
AIPM_TOKEN=<token> aipm publish push --yes`,
    [packageName],
  );
  const tokenPushCommand = token
    ? `AIPM_TOKEN=${shellQuote(token.token)} aipm publish push --yes`
    : "";

  return (
    <DashboardShell
      active="packages"
      intro="Generate a short-lived token, then push a staged skill from the CLI."
      title={packageName}
    >
      {() => (
        <section className={dash.dashboardGrid}>
          <article className={dash.dashboardPanel}>
            <div className={shell.sectionHeading}>
              <div>
                <p className={shell.eyebrow}>CLI release</p>
                <h2>Publish steps</h2>
              </div>
            </div>
            <CodeBlock code={command} />
          </article>
          <article className={cn(dash.dashboardPanel, dash.tokenPanel)}>
            <p className={shell.eyebrow}>Token</p>
            <h2>Generate publish token</h2>
            <p className={shell.muted}>
              Tokens are shown once, scoped to this package, and expire after 5 minutes. Members need package maintainer access.
            </p>
            <button
              type="button"
              onClick={async () => {
                setError("");
                try {
                  setToken(
                    await api<{ token: string; expiresAt: string }>(
                      `/v1/packages/${encodeURIComponent(packageName)}/publish-tokens`,
                      { method: "POST", body: "{}" },
                    ),
                  );
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              Generate token
            </button>
            {error ? <p className={shell.notice}>{error}</p> : null}
            {token ? (
              <section className={dash.tokenResult}>
                <p>This token expires at {new Date(token.expiresAt).toLocaleString()}.</p>
                <CodeBlock code={token.token} />
                <h3>Ready-to-run push command</h3>
                <CodeBlock code={tokenPushCommand} />
              </section>
            ) : null}
          </article>
          <article className={dash.dashboardPanel}>
            <div className={shell.sectionHeading}>
              <div>
                <p className={shell.eyebrow}>Access</p>
                <h2>Package maintainers</h2>
              </div>
            </div>
            {memberStatus ? <p className={shell.notice}>{memberStatus}</p> : null}
            {members.length > 0 ? (
              <div className={dash.resourceList}>
                {members.map((member) => (
                  <div className={dash.resourceRow} key={member.userId}>
                    <span>
                      <strong>{member.name ?? member.username}</strong>
                      <small>@{member.githubLogin} · {member.userId}</small>
                    </span>
                    {canManageMembers ? (
                      <button
                        className={dash.textButton}
                        type="button"
                        onClick={async () => {
                          setMemberStatus("");
                          try {
                            await api<void>(`/v1/packages/${encodeURIComponent(packageName)}/members/${member.userId}`, {
                              method: "DELETE",
                            });
                            loadMembers();
                          } catch (err) {
                            setMemberStatus((err as Error).message);
                          }
                        }}
                      >
                        Remove
                      </button>
                    ) : (
                      <small>{roleLabel(member.role)}</small>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={shell.empty}>No package maintainers yet.</div>
            )}
            {canManageMembers ? (
              <form
                className={dash.inlineForm}
                onSubmit={async (event) => {
                  event.preventDefault();
                  setMemberStatus("");
                  try {
                    await api<{ ok: boolean }>(
                      `/v1/packages/${encodeURIComponent(packageName)}/members/${memberUserId.trim()}`,
                      { method: "PUT", body: "{}" },
                    );
                    setMemberUserId("");
                    loadMembers();
                  } catch (err) {
                    setMemberStatus((err as Error).message);
                  }
                }}
              >
                <label htmlFor="package-member-user-id">Add org member by user ID</label>
                <input
                  id="package-member-user-id"
                  value={memberUserId}
                  onChange={(event) => setMemberUserId(event.target.value)}
                  placeholder="User ID from org members table"
                />
                <button type="submit">Add maintainer</button>
              </form>
            ) : null}
          </article>
          <article className={cn(dash.dashboardPanel, dash.versionsPanel)}>
            <div className={shell.sectionHeading}>
              <div>
                <p className={shell.eyebrow}>Public registry</p>
                <h2>Published versions</h2>
              </div>
              <Link className={shell.textLink} href="/registry">
                Open registry
              </Link>
            </div>
            {versionsError ? <p className={shell.notice}>{versionsError}</p> : null}
            {versions.length > 0 ? (
              <div className={dash.resourceList}>
                {versions.map((version) => (
                  <Link
                    className={dash.resourceRow}
                    href={packagePath(version.name, version.version)}
                    key={version.version}
                  >
                    <span>
                      <strong>{version.name}@{version.version}</strong>
                      <small>{version.description}</small>
                      <small>Targets: {version.targets.join(", ")}</small>
                    </span>
                    <small>{shortDate(version.createdAt)}</small>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={shell.empty}>
                No public versions yet. Generate a token, publish from the CLI, then refresh this page.
              </div>
            )}
          </article>
        </section>
      )}
    </DashboardShell>
  );
}

export function ProfileSettings() {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState("");

  return (
    <DashboardShell
      active="profile"
      intro="Control how your publisher identity appears across the dashboard and future package pages."
      title="Profile settings"
    >
      {({ me }) => (
        <section className={dash.dashboardGrid}>
          <article className={cn(dash.dashboardPanel, dash.profileCardLarge)}>
            <Avatar user={{ ...me, name: name || me.name, avatarUrl: avatarUrl || me.avatarUrl }} size="large" />
            <h2>{name || me.name || me.username}</h2>
            <p>{me.username}</p>
            <span>GitHub @{me.githubLogin}</span>
            <p>Public packages should feel accountable. Use a recognizable name and image for your publisher profile.</p>
          </article>
          <form
            className={cn(dash.dashboardPanel, dash.formPanel)}
            onSubmit={async (event) => {
              event.preventDefault();
              setStatus("");
              try {
                const updated = await api<Me>("/v1/me", {
                  method: "PATCH",
                  body: JSON.stringify({
                    name: name || me.name,
                    avatarUrl: avatarUrl || me.avatarUrl,
                  }),
                });
                setName(updated.name ?? "");
                setAvatarUrl(updated.avatarUrl ?? "");
                setStatus("Profile updated.");
              } catch (err) {
                setStatus((err as Error).message);
              }
            }}
          >
            <label htmlFor="profile-name">Display name</label>
            <input
              id="profile-name"
              onChange={(event) => setName(event.target.value)}
              placeholder={me.name ?? me.githubLogin}
              value={name}
            />
            <label htmlFor="profile-avatar">Profile image URL</label>
            <input
              id="profile-avatar"
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder={me.avatarUrl ?? "https://..."}
              value={avatarUrl}
            />
            <p className={dash.fieldHelp}>Use an HTTPS image URL. File upload can be added once image storage is configured.</p>
            {status ? <p className={shell.notice}>{status}</p> : null}
            <button type="submit">Save profile</button>
          </form>
        </section>
      )}
    </DashboardShell>
  );
}
