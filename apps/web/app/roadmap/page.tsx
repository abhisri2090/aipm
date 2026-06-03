import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

const sections = [
  {
    title: "Available now",
    items: [
      "Public registry website with live package search and package detail pages.",
      "CLI install flow for project-ready AI skills and tool files.",
      "Self-service publisher account, org namespace, package reservation, and short-lived publish token surfaces.",
      "Publishing flow through the CLI with init, import, add, status, preview, validate, and push steps.",
      "Public security, privacy, terms, status, FAQ, best-practice, and discoverability pages.",
    ],
  },
  {
    title: "Near term reliability",
    items: [
      "Production verification that covers HTTPS, security headers, health, readiness, search, install, and unauthenticated publish rejection.",
      "Stronger package publish consistency, rollback, backup, and restore workflows.",
      "More complete CLI lifecycle commands such as update, remove, verify, clean, and pack.",
      "Better publisher dashboard feedback for failed publishes, package versions, and token expiry.",
    ],
  },
  {
    title: "Trust and registry depth",
    items: [
      "Package abuse reporting, takedown, appeal, and owner transfer workflows.",
      "Verified publisher labels and clearer package provenance.",
      "Server-side package scanning, risk levels, and stricter install modes.",
      "Private packages and organization-level access controls.",
      "More package types beyond skills, including rules, MCP bundles, and environment bundles.",
    ],
  },
  {
    title: "Platform expansion",
    items: [
      "More adapters for AI tools and editors beyond Cursor, Claude, and Codex-oriented workflows.",
      "Dependency resolution, lockfiles, conflict detection, and offline reinstall from local cache.",
      "AIPM MCP server so agents can discover and install missing skills during work.",
      "Desktop app and enterprise registry options once the CLI and hosted registry are stable.",
    ],
  },
];

export const metadata = pageMetadata({
  title: "AIPM Product Roadmap",
  description:
    "A practical roadmap for AIPM: what is available now, what reliability work comes next, and how the AI skill registry will expand.",
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
              "A practical roadmap for AIPM: what is available now, what reliability work comes next, and how the AI skill registry will expand.",
            url: "https://aipm-registry.com/roadmap",
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Roadmap</p>
        <h1>Build the registry in public, one useful layer at a time.</h1>
        <p className={shell.lede}>
          AIPM is moving from a working registry into dependable product infrastructure. This
          roadmap names what users can rely on today, what needs hardening next, and which bigger
          platform bets should wait until the core workflow is stable.
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
            Items are intentionally ordered by product dependency, not excitement. AIPM should make
            installation, publishing, recovery, and trust boring before it expands into larger
            platform surfaces.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
