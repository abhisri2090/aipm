import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

const publisherRules = [
  "Only publish packages you have the right to share.",
  "Do not publish secrets, private prompts, customer data, confidential documents, malware, or deceptive package content.",
  "Use scoped package names honestly. Do not impersonate another person, company, project, or tool.",
  "Keep package descriptions accurate about supported targets, installed files, and expected behavior.",
  "Publish updates as new versions instead of silently changing an existing public release.",
  "Respond quickly if maintainers contact you about security, abuse, trademark, or privacy concerns.",
];

const userExpectations = [
  "Review package metadata and publisher identity before installing.",
  "Install public packages only into projects where you understand the resulting files.",
  "Treat AI skill output as assistant guidance, not as guaranteed professional advice.",
  "Report packages that appear unsafe, deceptive, infringing, or privacy-invasive.",
];

const futureWork = [
  "formal takedown and appeal workflow",
  "verified publisher labels",
  "package abuse reporting inside the dashboard",
  "private package terms",
  "publisher organization transfer policy",
  "dedicated legal and abuse contact channels",
];

export const metadata = pageMetadata({
  title: "AIPM Terms and Acceptable Use",
  description:
    "Practical terms and acceptable-use expectations for AIPM public package publishers, package users, org namespaces, and registry content.",
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
              "Practical terms and acceptable-use expectations for AIPM public package publishers, package users, org namespaces, and registry content.",
            url: "https://aipm-registry.com/terms",
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className="page-header">
        <p className="eyebrow">Terms</p>
        <h1>Use AIPM to share helpful AI skills, not private or deceptive content.</h1>
        <p className="lede">
          These practical terms set expectations for a public AI skill registry. They are not a
          replacement for formal legal review, but they make the product boundaries clear while AIPM
          grows.
        </p>
        <div className="actions">
          <Link className="button" href="/security">
            Security guide
          </Link>
          <Link className="button secondary" href="/privacy">
            Privacy notice
          </Link>
        </div>
      </section>

      <article className="doc wide-doc">
        <section>
          <h2>Publisher acceptable use</h2>
          <ul className="check-list">
            {publisherRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>User expectations</h2>
          <ul className="check-list">
            {userExpectations.map((expectation) => (
              <li key={expectation}>{expectation}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Org and package names</h2>
          <p>
            Namespaces and package names should help users identify real ownership and purpose.
            AIPM may reserve, rename, restrict, or remove names that are confusing, abusive,
            impersonating, or needed to protect users and the registry.
          </p>
        </section>

        <section>
          <h2>Registry moderation</h2>
          <p>
            AIPM may hide, remove, or restrict packages that appear to leak sensitive data, include
            malicious files, misrepresent behavior, violate rights, or create risk for users. If a
            secret was exposed, rotate it immediately; removal alone is not enough.
          </p>
        </section>

        <section>
          <h2>Planned policy work</h2>
          <p>As the product matures, AIPM should add:</p>
          <ul className="check-list">
            {futureWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </article>
    </DocLayout>
  );
}
