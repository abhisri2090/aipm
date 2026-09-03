import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";
import { SITE_URL } from "../../lib/registry";

const dataItems = [
  {
    title: "Account identity",
    body: "When you sign in, AIPM uses your GitHub identity to connect publishing actions to your account.",
  },
  {
    title: "Publisher profile",
    body: "Your display name and profile image help users see who owns an org or package.",
  },
  {
    title: "Organization and package records",
    body: "Org names, package names, metadata, versions, visibility settings, and package files are stored by the registry.",
  },
  {
    title: "Short-lived publish tokens",
    body: "Publish tokens are used by the CLI, expire quickly, and should not be saved in project files.",
  },
  {
    title: "CLI login sessions",
    body: "CLI login stores a local session on your machine so private package reads do not require pasting a token into every command.",
  },
  {
    title: "Operational logs",
    body: "The registry may process request metadata to run the service, fix abuse, and keep it available.",
  },
  {
    title: "Local preferences",
    body: "The website can save your theme choice in your browser. This is not needed for publishing.",
  },
];

const packageRules = [
  "Packages can be public or private. Public packages are visible to everyone; private packages are visible to org members with access.",
  "Do not publish credentials, private prompts, customer data, internal documents, or private project notes.",
  "Use aipm publish preview and .aipmignore before publishing.",
  "Rotate any exposed secret immediately. Removing a package does not make a leaked secret safe again.",
];

export const metadata = pageMetadata({
  title: "AIPM Privacy Notice",
  description:
    "What AIPM stores for accounts, packages, tokens, and local website preferences.",
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
              "What AIPM stores for accounts, packages, tokens, and local website preferences.",
            url: `${SITE_URL}/privacy`,
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Privacy</p>
        <h1>Know what is public and what should stay private.</h1>
        <p className={shell.lede}>
          AIPM supports public registry packages and private org packages. This page explains what
          data is used for accounts, publisher profiles, package metadata, tokens, and project files.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/security">
            Security guide
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/publish">
            Publishing guide
          </Link>
        </div>
      </section>

      <section className={cards.practiceGrid} aria-label="Privacy data categories">
        {dataItems.map((item) => (
          <article className={cards.practiceCard} key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>What becomes public</h2>
          <p>
            Public package names, descriptions, targets, versions, manifests, and included skill
            files are public registry content. Check them before you publish.
          </p>
          <ul className={docs.checkList}>
            {packageRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>What AIPM does not need</h2>
          <p>
            AIPM does not need private source code, secrets, customer records, internal documents, or
            unrelated project files. A good package includes only the manifest, main skill file,
            examples, and tool files the skill needs.
          </p>
        </section>

        <section>
          <h2>Privacy work still planned</h2>
          <p>
            AIPM should add account deletion, package owner transfer, stronger audit logs, verified
            publisher labels, package access exports, and a privacy contact channel.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
