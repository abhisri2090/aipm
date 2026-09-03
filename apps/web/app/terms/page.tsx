import { shell, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";
import { SITE_URL } from "../../lib/registry";

const publisherRules = [
  "Only publish packages you are allowed to share.",
  "Do not publish secrets, private prompts, customer data, confidential documents, malware, or misleading content.",
  "Use package names honestly. Do not pretend to be another person, company, project, or tool.",
  "Describe supported tools, installed files, and expected behavior accurately.",
  "Publish updates as new versions. Do not silently change an existing public release.",
  "Respond quickly if maintainers contact you about security, abuse, trademark, or privacy concerns.",
];

const userExpectations = [
  "Review package details and publisher identity before installing.",
  "Install public packages only when you understand the files they add.",
  "Treat AI output as assistant help, not guaranteed professional advice.",
  "Report packages that look unsafe, misleading, infringing, or privacy-invasive.",
];

const futureWork = [
  "formal takedown and appeal process",
  "verified publisher labels",
  "package abuse reporting inside the dashboard",
  "private package terms",
  "publisher organization transfer policy",
  "dedicated legal and abuse contact channels",
];

export const metadata = pageMetadata({
  title: "AIPM Acceptable Use Policy for AI Skill Packages",
  description:
    "Read AIPM rules for publishing public AI skill packages, avoiding unsafe content, and using package names honestly.",
  path: "/terms",
  keywords: [
    "AIPM terms",
    "AI package acceptable use",
    "AI skill registry terms",
    "public package policy",
    "publisher rules",
  ],
});

export default function TermsPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "AIPM Terms and Acceptable Use",
            description:
              "Read AIPM rules for publishing public AI skill packages, avoiding unsafe content, and using package names honestly.",
            url: `${SITE_URL}/terms`,
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Terms</p>
        <h1>Use AIPM to share helpful AI skills.</h1>
        <p className={shell.lede}>
          These rules explain what is okay in the public registry. They are not a replacement for
          legal review, but they make the product boundaries clear.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/security">
            Security guide
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/privacy">
            Privacy notice
          </Link>
        </div>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Rules for publishers</h2>
          <ul className={docs.checkList}>
            {publisherRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>User expectations</h2>
          <ul className={docs.checkList}>
            {userExpectations.map((expectation) => (
              <li key={expectation}>{expectation}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Org and package names</h2>
          <p>
            Namespaces and package names should show real ownership and purpose. AIPM may reserve,
            rename, restrict, or remove names that confuse users, abuse the registry, or impersonate
            someone else.
          </p>
        </section>

        <section>
          <h2>Registry moderation</h2>
          <p>
            AIPM may hide, remove, or restrict packages that leak sensitive data, include malicious
            files, misrepresent behavior, violate rights, or put users at risk. If a secret was
            exposed, rotate it immediately; removal alone is not enough.
          </p>
        </section>

        <section>
          <h2>Planned policy work</h2>
          <p>As the product matures, AIPM should add:</p>
          <ul className={docs.checkList}>
            {futureWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </article>
    </DocLayout>
  );
}
