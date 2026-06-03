import { pageMetadata } from "../../lib/seo";
import { DocLayout } from "../../components/doc-layout";

export const metadata = pageMetadata({
  title: "AIPM FAQ",
  description: "Troubleshooting and frequently asked questions for AIPM users and publishers.",
  path: "/faq",
});

const faqs = [
  [
    "The registry is not reachable.",
    "Check the status page or run curl <registry-url>/health and curl <registry-url>/ready. Health checks the API process; ready checks registry dependencies.",
  ],
  [
    "Package not found.",
    "Confirm the exact scoped name and version. AIPM package names use the format @scope/name.",
  ],
  [
    "Version already published.",
    "Published versions are immutable. Increase the manifest version and publish again.",
  ],
  [
    "The skill installed but does not appear in my tool.",
    "Check that you installed with the right --target, then restart or reload the AI tool if it caches project files.",
  ],
  [
    "Can I publish a public skill?",
    "Yes. Sign in with GitHub, create an org, reserve a package name, generate a 5-minute publish token, then push from the CLI.",
  ],
  [
    "Can I publish private skills?",
    "Not yet. Current packages are public registry packages. Keep private prompts, credentials, customer data, and internal-only files out of published skills.",
  ],
  [
    "How do I avoid leaking files while publishing?",
    "Run aipm publish preview, review the included file list, and use .aipmignore for secrets, private notes, logs, caches, screenshots, exports, and customer data.",
  ],
  [
    "What account data does AIPM use?",
    "AIPM uses account identity for publishing, profile details for publisher accountability, organization and package records for registry ownership, and short-lived tokens for CLI pushes.",
  ],
  [
    "What content is not allowed in public packages?",
    "Do not publish secrets, private prompts, customer data, confidential documents, malware, deceptive package content, or names that impersonate another person, company, project, or tool.",
  ],
  [
    "My publish token expired.",
    "Generate a fresh token from the package dashboard. Tokens are intentionally short-lived and are not stored by the CLI.",
  ],
  [
    "Publisher identity is unavailable on a package.",
    "That package was published before account-backed reservations were attached, or through an admin-only path. Review it carefully before installing.",
  ],
  [
    "How do I install the CLI?",
    "Run npm install -g @aipm-registry/cli, then aipm --version and aipm doctor. If the command is not on PATH, doctor prints the shell profile fix.",
  ],
  [
    "Where are package files stored?",
    "Metadata is stored by the registry backend. Package tarballs are stored in the configured blob storage backend.",
  ],
];

export default function FaqPage() {
  return (
    <DocLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(([question, answer]) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: {
                "@type": "Answer",
                text: answer,
              },
            })),
          }),
        }}
      />
      <section className="page-header">
        <p className="eyebrow">FAQ</p>
        <h1>Common questions and fixes.</h1>
        <p className="lede">Short answers for the problems users hit while publishing and installing skills.</p>
      </section>

      <section className="faq-list">
        {faqs.map(([question, answer]) => (
          <article key={question}>
            <h2>{question}</h2>
            <p>{answer}</p>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
