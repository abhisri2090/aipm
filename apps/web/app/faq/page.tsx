import Link from "next/link";
import type { ReactNode } from "react";
import { shell, cards } from "../../lib/page-styles";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AIPM FAQ",
  description: "Troubleshooting and frequently asked questions for AIPM users and publishers.",
  path: "/faq",
});

const faqs: { question: string; answer: ReactNode }[] = [
  {
    question: "The registry is not reachable.",
    answer:
      "Check the status page or run curl <registry-url>/health and curl <registry-url>/ready. Health checks the API. Ready checks the database and package storage.",
  },
  {
    question: "Package not found.",
    answer:
      "Check the exact scoped name and version. If the package is private, run aipm login and retry, or pass an explicit install token in CI.",
  },
  {
    question: "Version already published.",
    answer: "Published versions cannot be changed. Increase the manifest version and publish again.",
  },
  {
    question: "The skill installed but does not appear in my tool.",
    answer:
      "Check that you used the right --target. Then restart or reload the AI tool if it caches project files.",
  },
  {
    question: "Can I publish a public skill?",
    answer:
      "Yes. Sign in with GitHub, create an org, reserve a package name, generate a 5-minute token, then publish from the CLI. See the publishing guide for the full flow.",
  },
  {
    question: "Can I publish private skills?",
    answer:
      "Yes. Reserve the package under an org and set package visibility to private. Members install private packages after aipm login; CI can use an org install token.",
  },
  {
    question: "How do I avoid leaking files while publishing?",
    answer: (
      <>
        See the <Link href="/security">security guide</Link> for preview checks, <code>.aipmignore</code>,
        and incident steps.
      </>
    ),
  },
  {
    question: "What account data does AIPM use?",
    answer:
      "AIPM uses your account identity for publishing, profile details for ownership, org and package records for registry ownership, and short-lived tokens for CLI publishing.",
  },
  {
    question: "What content is not allowed in public packages?",
    answer:
      "Do not publish secrets, private prompts, customer data, confidential documents, malware, misleading content, or names that impersonate another person, company, project, or tool.",
  },
  {
    question: "My publish token expired.",
    answer:
      "Generate a new token from the package dashboard. Tokens are short-lived and are not stored by the CLI.",
  },
  {
    question: "Publisher identity is unavailable on a package.",
    answer: "That package does not have a linked publisher account. Review it carefully before installing.",
  },
  {
    question: "How do I install the CLI?",
    answer: (
      <>
        See the <Link href="/install">install guide</Link> for npm, Homebrew, standalone, Windows, and Scoop
        options. Then run <code>aipm --version</code> and <code>aipm doctor</code>.
      </>
    ),
  },
  {
    question: "Where are package files stored?",
    answer: "Package metadata is stored by the registry. Package tarballs are stored in blob storage.",
  },
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
            mainEntity: faqs.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: {
                "@type": "Answer",
                text: typeof answer === "string" ? answer : question,
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
        {faqs.map(({ question, answer }) => (
          <article key={question}>
            <h2>{question}</h2>
            <p>{answer}</p>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
