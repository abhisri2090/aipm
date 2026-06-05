import Link from "next/link";
import { shell, dash, cn } from "../lib/page-styles";
import type { InternalStats } from "./internal-stats-types";

function formatWhen(value: string): string {
  return new Date(value).toLocaleString();
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className={dash.metricCard}>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      <p>{detail}</p>
    </article>
  );
}

export function InternalStatsPanel({ stats }: { stats: InternalStats }) {
  return (
    <main className={cn(dash.dashboardPage, dash.dashboardPageFull)}>
      <section className={dash.dashboardWorkspace}>
        <header className={dash.dashboardHero}>
          <div>
            <p className={shell.eyebrow}>Admin</p>
            <h1>Registry usage</h1>
            <p className={shell.lede}>
              Signed-in users, organizations, reserved package names, and published skill versions.
            </p>
          </div>
          <div className={dash.dashboardHeroActions}>
            <Link className={shell.button} href="/status">
              Service status
            </Link>
            <Link className={cn(shell.button, shell.secondary)} href="/registry">
              Public registry
            </Link>
          </div>
        </header>

        <section className={dash.metricGrid} aria-label="Registry totals">
          <StatCard label="Signed-in users" value={stats.users} detail="GitHub accounts that have logged in at least once." />
          <StatCard label="Organizations" value={stats.orgs} detail="Org namespaces created in the dashboard." />
          <StatCard label="Reserved skills" value={stats.reservedPackages} detail="Package names reserved before publishing." />
          <StatCard label="Published skills" value={stats.publishedPackages} detail="Distinct package names with at least one published version." />
          <StatCard
            label="Published versions"
            value={stats.publishedVersions}
            detail="Total immutable versions stored in the registry."
          />
        </section>

        <section className={dash.dashboardGrid}>
          <article className={dash.dashboardPanel}>
            <h2>Recent sign-ins</h2>
            {stats.recentUsers.length > 0 ? (
              <ul className={dash.resourceList}>
                {stats.recentUsers.map((user) => (
                  <li className={dash.resourceRow} key={`${user.username}-${user.createdAt}`}>
                    <div>
                      <strong>{user.name ?? user.username}</strong>
                      <span>{user.username} · GitHub @{user.githubLogin}</span>
                    </div>
                    <span>{formatWhen(user.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={shell.muted}>No users yet.</p>
            )}
          </article>

          <article className={dash.dashboardPanel}>
            <h2>Recent organizations</h2>
            {stats.recentOrgs.length > 0 ? (
              <ul className={dash.resourceList}>
                {stats.recentOrgs.map((org) => (
                  <li className={dash.resourceRow} key={`${org.slug}-${org.createdAt}`}>
                    <div>
                      <strong>{org.name}</strong>
                      <span>@{org.slug}</span>
                    </div>
                    <span>{formatWhen(org.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={shell.muted}>No organizations yet.</p>
            )}
          </article>
        </section>

        <section className={dash.dashboardPanel}>
          <h2>Recent published skills</h2>
          {stats.recentPublished.length > 0 ? (
            <ul className={dash.resourceList}>
              {stats.recentPublished.map((pkg) => (
                <li className={dash.resourceRow} key={`${pkg.name}@${pkg.version}`}>
                  <div>
                    <strong>{pkg.name}</strong>
                    <span>v{pkg.version}</span>
                  </div>
                  <span>{formatWhen(pkg.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={shell.muted}>No published skills yet.</p>
          )}
        </section>
      </section>
    </main>
  );
}

export function AdminStatsUnavailable({ message }: { message: string }) {
  return (
    <main className={cn(dash.dashboardPage, dash.dashboardPageFull)}>
      <section className={dash.dashboardEmptyState}>
        <p className={shell.eyebrow}>Admin</p>
        <h1>Admin dashboard is not available.</h1>
        <p className={shell.lede}>{message}</p>
      </section>
    </main>
  );
}
