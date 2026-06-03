import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

const dataItems = [
  {
    title: "Account identity",
    body: "When you sign in, AIPM uses your GitHub identity to connect publisher actions to an account.",
  },
  {
    title: "Publisher profile",
    body: "Your display name and profile image URL help users understand who owns an organization or package.",
  },
  {
    title: "Organization and package records",
    body: "Org namespaces, package reservations, package metadata, versions, and public package files are registry data.",
  },
  {
    title: "Short-lived publish tokens",
    body: "Publish tokens are generated for CLI pushes, expire quickly, and should not be committed or stored in project files.",
  },
  {
    title: "Operational logs",
    body: "The registry may process request metadata needed to run the service, troubleshoot abuse, and protect availability.",
  },
  {
    title: "Local preferences",
    body: "The website can store a local theme preference in your browser. It is not needed for publishing.",
  },
];

const packageRules = [
  "Published packages are public by default.",
  "Do not publish credentials, private prompts, customer data, internal documents, or private project notes.",
  "Use aipm publish preview and .aipmignore before pushing a package version.",
  "Rotate any exposed secret immediately. Removing registry content does not make a leaked secret safe again.",
];

export const metadata = pageMetadata({
  title: "AIPM Privacy Notice",
  description:
    "A practical privacy notice for AIPM accounts, publisher profiles, public packages, short-lived publish tokens, and local website preferences.",
  path: "/privacy",
  keywords: [
    "AIPM privacy",
    "AI package manager privacy",
    "AI skill registry privacy",
    "publisher profile privacy",
    "public AI packages",
  ],
});

export default function PrivacyPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "AIPM Privacy Notice",
            description:
              "A practical privacy notice for AIPM accounts, publisher profiles, public packages, short-lived publish tokens, and local website preferences.",
            url: "https://aipm-registry.com/privacy",
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className="page-header">
        <p className="eyebrow">Privacy</p>
        <h1>Know what is public, what is account data, and what should never be packaged.</h1>
        <p className="lede">
          AIPM is built for public, reusable AI skill packages. This notice explains the practical
          data boundaries for accounts, publisher profiles, package metadata, short-lived tokens,
          and project files.
        </p>
        <div className="actions">
          <Link className="button" href="/security">
            Security guide
          </Link>
          <Link className="button secondary" href="/publish">
            Publishing guide
          </Link>
        </div>
      </section>

      <section className="practice-grid" aria-label="Privacy data categories">
        {dataItems.map((item) => (
          <article className="practice-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <article className="doc wide-doc">
        <section>
          <h2>Public package boundary</h2>
          <p>
            Package names, descriptions, targets, versions, manifests, and included skill files are
            intended to be public registry content. AIPM should make this boundary obvious before
            users publish.
          </p>
          <ul className="check-list">
            {packageRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>What AIPM does not need</h2>
          <p>
            AIPM does not need your private source code, secrets, customer records, internal
            strategy documents, or unrelated project files to publish a reusable skill. A good
            package contains only the manifest, entry file, examples, and tool files that the skill
            needs.
          </p>
        </section>

        <section>
          <h2>Product privacy work still planned</h2>
          <p>
            Future production hardening should include self-service account deletion, package owner
            transfer, stronger audit logs for publisher actions, verified publisher labels, private
            package support, and a dedicated privacy contact channel.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
