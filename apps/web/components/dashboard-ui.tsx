"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function LoginPanel() {
  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Publisher login</p>
        <h1>Sign in to publish AIPM skills.</h1>
        <p className="lede">
          Use GitHub to create an AIPM publisher account, reserve package names, and generate
          short-lived publish tokens.
        </p>
        <div className="actions">
          <a className="button" href="/v1/auth/github/start">
            Sign in with GitHub
          </a>
        </div>
      </section>
    </main>
  );
}

export function DashboardHome() {
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

  if (error) {
    return (
      <main>
        <section className="page-header">
          <p className="eyebrow">Dashboard</p>
          <h1>Login required.</h1>
          <p className="lede">{error}</p>
          <div className="actions">
            <Link className="button" href="/login">
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Dashboard</p>
        <h1>{me ? `Welcome, ${me.name ?? me.githubLogin}.` : "Loading publisher dashboard."}</h1>
        <p className="lede">Create an org, reserve a package name, and generate a 5-minute token.</p>
        <div className="actions">
          <Link className="button" href="/dashboard/orgs/new">
            Create org
          </Link>
        </div>
      </section>

      <section className="panel-section">
        <div className="section-heading">
          <h2>Your orgs</h2>
        </div>
        <div className="results">
          {orgs.length > 0 ? (
            orgs.map((org) => (
              <article className="result-card" key={org.slug}>
                <div>
                  <h3>
                    <Link href={`/dashboard/orgs/${org.slug}`}>@{org.slug}</Link>
                  </h3>
                  <p>{org.name}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="empty">No orgs yet. Create one to reserve your first skill name.</div>
          )}
        </div>
      </section>
    </main>
  );
}

export function NewOrgForm() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">New org</p>
        <h1>Create a publisher namespace.</h1>
        <p className="lede">Your org slug becomes the package scope, such as @acme/pr-reviewer.</p>
      </section>
      <form
        className="doc"
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
        <input id="org-slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="acme" />
        <label htmlFor="org-name">Display name</label>
        <input id="org-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Acme" />
        {error ? <p className="notice">{error}</p> : null}
        <button type="submit">Create org</button>
      </form>
    </main>
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
    <main>
      <section className="page-header">
        <p className="eyebrow">Org</p>
        <h1>@{orgSlug}</h1>
        <p className="lede">Reserve package names and generate publish tokens for this namespace.</p>
        <div className="actions">
          <Link className="button" href={`/dashboard/orgs/${orgSlug}/packages/new`}>
            Reserve package
          </Link>
        </div>
      </section>
      <section className="panel-section">
        <h2>Reserved packages</h2>
        {error ? <p className="notice">{error}</p> : null}
        <div className="results">
          {packages.map((pkg) => (
            <article className="result-card" key={pkg.name}>
              <div>
                <h3>
                  <Link href={`/dashboard/packages/${pkg.name.replace(/^@/, "")}`}>{pkg.name}</Link>
                </h3>
                <p>Ready for token-based publishing.</p>
              </div>
            </article>
          ))}
          {packages.length === 0 ? <div className="empty">No packages reserved yet.</div> : null}
        </div>
      </section>
    </main>
  );
}

export function NewPackageForm({ orgSlug }: { orgSlug: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Reserve package</p>
        <h1>Reserve a skill name in @{orgSlug}.</h1>
        <p className="lede">Use a short name like pr-reviewer, or the full package name.</p>
      </section>
      <form
        className="doc"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            const pkg = await api<ReservedPackage>(`/v1/orgs/${orgSlug}/packages`, {
              method: "POST",
              body: JSON.stringify({ name }),
            });
            window.location.href = `/dashboard/packages/${pkg.name.replace(/^@/, "")}`;
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label htmlFor="package-name">Package name</label>
        <input id="package-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="pr-reviewer" />
        {error ? <p className="notice">{error}</p> : null}
        <button type="submit">Reserve package</button>
      </form>
    </main>
  );
}

export function PackageDashboard({ scope, name }: { scope: string; name: string }) {
  const packageName = `@${scope}/${name}`;
  const [token, setToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");

  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Package</p>
        <h1>{packageName}</h1>
        <p className="lede">Generate a short-lived publish token, then push staged files from the CLI.</p>
      </section>
      <article className="doc">
        <h2>Publish from CLI</h2>
        <pre>
          <code>{`npm install -g @aipm-registry/cli
aipm --version
aipm doctor
aipm publish init --name ${packageName}
aipm publish explain
aipm publish add .
aipm publish status
aipm publish preview
aipm publish validate
aipm publish token --package ${packageName}
AIPM_TOKEN=<token> aipm publish push --yes`}</code>
        </pre>
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
          Generate 5-minute token
        </button>
        {error ? <p className="notice">{error}</p> : null}
        {token ? (
          <section>
            <h2>Token</h2>
            <p>This token is shown once and expires at {new Date(token.expiresAt).toLocaleString()}.</p>
            <pre>
              <code>{token.token}</code>
            </pre>
          </section>
        ) : null}
      </article>
    </main>
  );
}
