"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CodeBlock } from "./code-block";
import { GITHUB_LOGIN_URL, packagePath } from "../lib/registry";
import { cn } from "../lib/class-names";
import shell from "../app/page-shell.module.css";
import docs from "../app/docs-content.module.css";
import dash from "./dashboard-ui.module.css";

type Me = {
  id: string;
  githubLogin: string;
  name: string | null;
  avatarUrl: string | null;
};

type Org = {
  slug: string;
  name: string;
  createdAt: string;
};

type ReservedPackage = {
  name: string;
  createdAt: string;
};

type PublishedPackageVersion = {
  name: string;
  version: string;
  description: string;
  targets: string[];
  createdAt: string;
};

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
  return (
    <main className={dash.dashboardPage}>
      <section className={dash.loginScreen}>
        <div>
          <p className={shell.eyebrow}>Dashboard</p>
          <h1>Sign in to manage AIPM publishing.</h1>
          <p className={shell.lede}>{message}</p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/login">
              Sign in with GitHub
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
  active: "overview" | "orgs" | "packages" | "profile";
  children: (context: { me: Me; orgs: Org[] }) => ReactNode;
  intro?: string;
  title: string;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Me>("/v1/me"), api<{ orgs: Org[] }>("/v1/orgs")])
      .then(([user, orgData]) => {
        setMe(user);
        setOrgs(orgData.orgs);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <LoginRequired message={error} />;
  if (!me) return <LoadingShell />;

  const navItems = [
    { href: "/dashboard", id: "overview", label: "Overview" },
    { href: "/dashboard/orgs/new", id: "orgs", label: "Create org" },
    { href: "/dashboard/profile", id: "profile", label: "Profile" },
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
            <strong>{me.name ?? me.githubLogin}</strong>
            <span>@{me.githubLogin}</span>
          </div>
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
            <Link className={shell.button} href="/dashboard/orgs/new">
              New org
            </Link>
          </div>
        </header>
        {children({ me, orgs })}
      </section>
    </main>
  );
}

export function LoginPanel() {
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
            <a className={shell.button} href={GITHUB_LOGIN_URL}>
              Continue with GitHub
            </a>
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

export function DashboardHome() {
  return (
    <DashboardShell
      active="overview"
      intro="Manage publisher profile, organization namespaces, package reservations, and token-based releases."
      title="Your publishing workspace"
    >
      {({ me, orgs }) => {
        const packageCount = orgs.length;
        return (
          <>
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
                    <strong>Complete profile</strong>
                    <span>Add name and avatar for publisher trust.</span>
                  </li>
                  <li>
                    <strong>Create org</strong>
                    <span>Reserve your npm-style package scope.</span>
                  </li>
                  <li>
                    <strong>Reserve skill</strong>
                    <span>Lock a package name before publishing.</span>
                  </li>
                  <li>
                    <strong>Push from CLI</strong>
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
                  <Link className={shell.textLink} href="/dashboard/orgs/new">
                    Create org
                  </Link>
                </div>
                {orgs.length > 0 ? (
                  <div className={dash.resourceList}>
                    {orgs.map((org) => (
                      <Link className={dash.resourceRow} href={`/dashboard/orgs/${org.slug}`} key={org.slug}>
                        <span>
                          <strong>@{org.slug}</strong>
                          <small>{org.name}</small>
                        </span>
                        <small>{shortDate(org.createdAt)}</small>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className={shell.empty}>No orgs yet. Create one to reserve your first skill name.</div>
                )}
              </article>
            </section>
          </>
        );
      }}
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
            placeholder="bazzigames"
            value={slug}
          />
          <p className={dash.fieldHelp}>Use lowercase letters, numbers, and hyphens. This becomes your package scope.</p>
          <label htmlFor="org-name">Display name</label>
          <input id="org-name" onChange={(event) => setName(event.target.value)} placeholder="Bazzi Games" value={name} />
          {error ? <p className={shell.notice}>{error}</p> : null}
          <button type="submit">Create organization</button>
        </form>
      )}
    </DashboardShell>
  );
}

export function OrgDashboard({ orgSlug }: { orgSlug: string }) {
  const [packages, setPackages] = useState<ReservedPackage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ packages: ReservedPackage[] }>(`/v1/orgs/${orgSlug}/packages`)
      .then((data) => setPackages(data.packages))
      .catch((err: Error) => setError(err.message));
  }, [orgSlug]);

  return (
    <DashboardShell
      active="packages"
      intro="Reserve names, generate tokens, and publish versions from the CLI."
      title={`@${orgSlug}`}
    >
      {() => (
        <section className={dash.dashboardPanel}>
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>Packages</p>
              <h2>Reserved skill names</h2>
            </div>
            <Link className={shell.button} href={`/dashboard/orgs/${orgSlug}/packages/new`}>
              Reserve package
            </Link>
          </div>
          {error ? <p className={shell.notice}>{error}</p> : null}
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
            <div className={shell.empty}>No packages reserved yet. Reserve a skill name before generating a token.</div>
          )}
        </section>
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

  useEffect(() => {
    const params = new URLSearchParams({ q: packageName, limit: "20" });
    api<{ packages: PublishedPackageVersion[] }>(`/v1/packages?${params}`)
      .then((data) => {
        setVersions(data.packages.filter((pkg) => pkg.name === packageName));
        setVersionsError("");
      })
      .catch((err: Error) => setVersionsError(err.message));
  }, [packageName]);

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
              Tokens are shown once, scoped to this package, and expire after 5 minutes.
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
              <div className={shell.empty}>No public versions yet. Generate a token, publish from the CLI, then refresh.</div>
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
            <h2>{name || me.name || me.githubLogin}</h2>
            <p>@{me.githubLogin}</p>
            <span>Connected through GitHub</span>
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
