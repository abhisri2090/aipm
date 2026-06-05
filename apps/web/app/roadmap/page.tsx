import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

const sections = [
  {
    title: "Available now",
    items: [
      "Public registry website with package search and package detail pages.",
      "CLI install flow for AI skills and tool files.",
      "Publisher accounts, org namespaces, package reservations, and short-lived publish tokens.",
      "CLI publishing with init, import, add, status, preview, validate, and push steps.",
      "Public docs for security, privacy, terms, status, FAQ, best practices, and discoverability.",
    ],
  },
  {
    title: "Near term reliability",
    items: [
      "Production checks for HTTPS, security headers, health, readiness, search, install, and blocked unauthenticated publishing.",
      "Better consistency, rollback, backup, and restore for publishing.",
      "More CLI commands such as update, remove, verify, clean, and pack.",
      "Clearer dashboard messages for failed publishes, package versions, and token expiry.",
    ],
  },
  {
    title: "Trust and registry depth",
    items: [
      "Package abuse reports, takedowns, appeals, and owner transfer.",
      "Verified publisher labels and clearer package origin.",
      "Server-side package scanning, risk levels, and stricter install options.",
      "Private packages and organization-level access controls.",
      "More package types beyond skills, including rules, MCP bundles, and environment bundles.",
    ],
  },
  {
    title: "Platform expansion",
    items: [
      "More adapters for AI tools and editors beyond Cursor, Claude, and Codex workflows.",
      "Dependency resolution, lockfiles, conflict detection, and offline reinstall from local cache.",
      "AIPM MCP server so agents can find and install missing skills during work.",
      "Desktop app and enterprise registry options after the CLI and hosted registry are stable.",
    ],
  },
];

export const metadata = pageMetadata({
  title: "AIPM Product Roadmap",
  description:
    "See what AIPM has now, what comes next, and what may come later.",
  path: "/roadmap",
  keywords: [
    "AIPM roadmap",
    "AI package manager roadmap",
    "AI skill registry roadmap",
    "AI tools publishing",
    "prompt package roadmap",
  ],
});

export default function RoadmapPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "AIPM Product Roadmap",
            description:
              "See what AIPM has now, what comes next, and what may come later.",
            url: "https://aipm-registry.com/roadmap",
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Roadmap</p>
        <h1>See what AIPM is building next.</h1>
        <p className={shell.lede}>
          AIPM is moving from a working registry to a dependable product. This roadmap shows what
          works now, what needs more polish, and what should wait until the core workflow is stable.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/use">
            Start using AIPM
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/publish">
            Publish a skill
          </Link>
        </div>
      </section>

      <section className={cards.roadmapList} aria-label="AIPM roadmap">
        {sections.map((section) => (
          <article className={cards.roadmapCard} key={section.title}>
            <h2>{section.title}</h2>
            <ul className={docs.checkList}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>How to read this roadmap</h2>
          <p>
            Items are ordered by what the product needs first. AIPM should make install, publish,
            recovery, and trust reliable before adding larger platform features.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
