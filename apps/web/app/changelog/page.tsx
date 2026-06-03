import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

const entries = [
  {
    date: "June 3, 2026",
    title: "Public trust and product-readiness pages",
    items: [
      "Added security, privacy, terms, status, and roadmap pages.",
      "Added footer navigation so users can find product, resource, and trust pages from every route.",
      "Expanded web verification to cover public SEO pages, private noindex pages, sitemap, package sitemap, llms.txt, footer links, README alignment, and SECURITY.md.",
    ],
  },
  {
    date: "June 2026",
    title: "Publisher account and dashboard workflow",
    items: [
      "Added GitHub sign-in surfaces, publisher profile, org creation, package reservation, package dashboard, and short-lived publish token flow.",
      "Updated publishing docs to show CLI staging, preview, validation, dashboard token generation, and token-based push.",
      "Marked dashboard and login pages as noindex so search engines focus on public registry and docs pages.",
    ],
  },
  {
    date: "June 2026",
    title: "CLI publishing polish",
    items: [
      "Improved publish init/import flows for existing AI-tool skill folders.",
      "Added starter templates for code review, issue summary, and release notes skills.",
      "Improved CLI guidance so publish steps explain what happened and what to do next.",
    ],
  },
  {
    date: "May 2026",
    title: "Public registry foundation",
    items: [
      "Launched public search, package detail pages, install commands, and package metadata rendering.",
      "Added API health/readiness endpoints and production deployment verification paths.",
      "Published the npm CLI package under @aipm-registry/cli.",
    ],
  },
];

export const metadata = pageMetadata({
  title: "AIPM Changelog",
  description: "Recent AIPM product updates across the CLI, registry API, website, publisher dashboard, trust pages, and SEO.",
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
              "Recent AIPM product updates across the CLI, registry API, website, publisher dashboard, trust pages, and SEO.",
            url: "https://aipm-registry.com/changelog",
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className="page-header">
        <p className="eyebrow">Changelog</p>
        <h1>Track what changed across AIPM.</h1>
        <p className="lede">
          AIPM is still early, so visible release notes matter. This page highlights product-level
          changes across the CLI, registry API, website, publisher dashboard, and trust surfaces.
        </p>
        <div className="actions">
          <Link className="button" href="/roadmap">
            Roadmap
          </Link>
          <Link className="button secondary" href="/status">
            Status
          </Link>
        </div>
      </section>

      <section className="changelog-list" aria-label="AIPM release notes">
        {entries.map((entry) => (
          <article className="changelog-card" key={`${entry.date}-${entry.title}`}>
            <p className="eyebrow">{entry.date}</p>
            <h2>{entry.title}</h2>
            <ul className="check-list">
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
