import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";
import { SITE_URL } from "../../lib/registry";

const entries = [
  {
    date: "June 14, 2026",
    title: "CLI 0.2.12 distribution",
    items: [
      "Published @aipm-registry/cli@0.2.12 to npm.",
      "Added public standalone binaries for macOS, Linux, and Windows.",
      "Added downloadable Homebrew formula, Scoop manifest, Winget manifest, checksums, and shell/PowerShell installers.",
    ],
  },
  {
    date: "June 3, 2026",
    title: "Public trust and status pages",
    items: [
      "Added security, privacy, terms, status, and roadmap pages.",
      "Added footer links so users can find product, resource, and trust pages from every route.",
      "Expanded web checks for public pages, private noindex pages, sitemaps, llms.txt, footer links, README alignment, and SECURITY.md.",
    ],
  },
  {
    date: "June 2026",
    title: "Publisher account and dashboard",
    items: [
      "Added GitHub sign-in, publisher profiles, org creation, package reservation, package dashboard, and short-lived publish tokens.",
      "Updated publishing docs to show CLI staging, preview, validation, dashboard token creation, and token-based publish.",
      "Marked dashboard and login pages as noindex so search engines focus on public registry and docs pages.",
    ],
  },
  {
    date: "June 2026",
    title: "CLI publishing polish",
    items: [
      "Improved publish init and import flows for existing AI-tool skill folders.",
      "Added starter templates for code review, issue summary, and release notes skills.",
      "Improved CLI messages so publishing steps explain what happened and what to do next.",
    ],
  },
  {
    date: "May 2026",
    title: "Public registry foundation",
    items: [
      "Launched public search, package detail pages, install commands, and package metadata display.",
      "Added API health and readiness endpoints plus production deployment checks.",
      "Published the npm CLI package under @aipm-registry/cli.",
    ],
  },
];

export const metadata = pageMetadata({
  title: "AIPM Changelog and AI Package Manager Release Notes",
  description:
    "Track AIPM CLI, registry, dashboard, SEO, publishing, and AI skill package updates.",
  path: "/changelog",
  keywords: ["AIPM changelog", "AIPM release notes", "AI package manager updates", "AI skill registry updates"],
});

export default function ChangelogPage() {
  return (
    <DocLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "AIPM Changelog",
            description:
              "Track AIPM CLI, registry, dashboard, SEO, publishing, and AI skill package updates.",
            url: `${SITE_URL}/changelog`,
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Changelog</p>
        <h1>See what changed in AIPM.</h1>
        <p className={shell.lede}>
          AIPM is still early, so changes should be easy to follow. This page lists updates to the
          CLI, registry API, website, dashboard, and trust pages.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/roadmap">
            Roadmap
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/status">
            Status
          </Link>
        </div>
      </section>

      <section className={cards.changelogList} aria-label="AIPM release notes">
        {entries.map((entry) => (
          <article className={cards.changelogCard} key={`${entry.date}-${entry.title}`}>
            <p className={shell.eyebrow}>{entry.date}</p>
            <h2>{entry.title}</h2>
            <ul className={docs.checkList}>
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
