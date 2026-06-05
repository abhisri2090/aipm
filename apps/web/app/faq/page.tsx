import { shell, cards } from "../../lib/page-styles";
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
    "Check the status page or run curl <registry-url>/health and curl <registry-url>/ready. Health checks the API. Ready checks the database and package storage.",
  ],
  [
    "Package not found.",
    "Check the exact scoped name and version. AIPM package names use @scope/name.",
  ],
  [
    "Version already published.",
    "Published versions cannot be changed. Increase the manifest version and publish again.",
  ],
  [
    "The skill installed but does not appear in my tool.",
    "Check that you used the right --target. Then restart or reload the AI tool if it caches project files.",
  ],
  [
    "Can I publish a public skill?",
    "Yes. Sign in with GitHub, create an org, reserve a package name, generate a 5-minute token, then publish from the CLI.",
  ],
  [
    "Can I publish private skills?",
    "Not yet. Packages are public today. Keep private prompts, credentials, customer data, and internal files out of published skills.",
  ],
  [
    "How do I avoid leaking files while publishing?",
    "Run aipm publish preview, review the file list, and use .aipmignore for secrets, private notes, logs, caches, screenshots, exports, and customer data.",
  ],
  [
    "What account data does AIPM use?",
    "AIPM uses your account identity for publishing, profile details for ownership, org and package records for registry ownership, and short-lived tokens for CLI publishing.",
  ],
  [
    "What content is not allowed in public packages?",
    "Do not publish secrets, private prompts, customer data, confidential documents, malware, misleading content, or names that impersonate another person, company, project, or tool.",
  ],
  [
    "My publish token expired.",
    "Generate a new token from the package dashboard. Tokens are short-lived and are not stored by the CLI.",
  ],
  [
    "Publisher identity is unavailable on a package.",
    "That package does not have a linked publisher account. Review it carefully before installing.",
  ],
  [
    "How do I install the CLI?",
    "Run npm install -g @aipm-registry/cli, then aipm --version and aipm doctor. If the command is not on PATH, doctor shows the shell fix.",
  ],
  [
    "Where are package files stored?",
    "Package metadata is stored by the registry. Package tarballs are stored in blob storage.",
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
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>FAQ</p>
        <h1>Common questions and fixes.</h1>
        <p className={shell.lede}>Short answers for the problems users hit while publishing and installing skills.</p>
      </section>

      <section className={cards.faqList}>
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
