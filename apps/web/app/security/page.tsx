import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";

const checklist = [
  "Run aipm publish preview before pushing and inspect every included file.",
  "Keep API keys, tokens, private keys, customer data, and internal documents out of public packages.",
  "Use .aipmignore to exclude logs, screenshots, local caches, exports, and private project notes.",
  "Publish only files that explain or install the skill. Do not package unrelated project source.",
  "Rotate any secret immediately if it was accidentally staged, even if the publish failed.",
  "Use a fresh 5-minute publish token for each publishing session.",
];

const ignoreExample = `# Secrets and credentials
.env
.env.*
*.pem
*key*

# Private or noisy project files
node_modules/
.git/
dist/
coverage/
*.log
screenshots/
exports/

# Internal-only context
private-notes/
customer-data/
`;

const reportSteps = [
  "Do not share exploit details in public registry comments or package descriptions.",
  "Capture the affected package name, version, file path, and why it is sensitive.",
  "Contact the package owner if you know them, then contact AIPM maintainers for registry-level help.",
  "If a secret is exposed, rotate it first. Registry removal does not make a leaked secret safe again.",
];

export const metadata = pageMetadata({
  title: "AIPM Security and Privacy Guide",
  description:
    "Security and privacy guidance for publishing public AI skill packages, using .aipmignore, reviewing package previews, and handling accidental leaks.",
  path: "/security",
  keywords: [
    "AI skill security",
    "prompt package privacy",
    "AIPM security",
    "AI package manager safety",
    "public package secrets",
    "aipmignore",
  ],
});

export default function SecurityPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "AIPM Security and Privacy Guide",
            description:
              "Security and privacy guidance for publishing public AI skill packages, using .aipmignore, reviewing package previews, and handling accidental leaks.",
            author: { "@type": "Organization", name: "AIPM" },
            publisher: { "@type": "Organization", name: "AIPM" },
            mainEntityOfPage: "https://aipm-registry.com/security",
          }),
        }}
      />

      <section className="page-header">
        <p className="eyebrow">Security</p>
        <h1>Publish AI skills without leaking private project context.</h1>
        <p className="lede">
          AIPM packages are public by default. Treat every published skill like open-source code:
          review the files, remove sensitive context, and publish only the instructions and tool
          files that a user should actually install.
        </p>
        <div className="actions">
          <Link className="button" href="/publish">
            Publishing guide
          </Link>
          <Link className="button secondary" href="/faq">
            FAQ
          </Link>
        </div>
      </section>

      <section className="practice-grid" aria-label="Security principles">
        <article className="practice-card">
          <h2>Public means inspectable</h2>
          <p>
            Assume package metadata, manifests, skill instructions, prompts, and bundled files can
            be read by anyone. Do not publish internal-only context.
          </p>
        </article>
        <article className="practice-card">
          <h2>Short-lived tokens</h2>
          <p>
            Publish tokens are intentionally temporary. Generate one when you are ready to push, then
            let it expire instead of storing it in shell profiles or project files.
          </p>
        </article>
        <article className="practice-card">
          <h2>Preview before push</h2>
          <p>
            The CLI preview step exists to slow down leaks. Review the file list and package size
            before publishing a new version.
          </p>
        </article>
      </section>

      <article className="doc wide-doc">
        <section>
          <h2>Publisher safety checklist</h2>
          <ul className="check-list">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Recommended .aipmignore starter</h2>
          <p>
            Use this as a starting point, then add any project-specific private folders before
            running <code>aipm publish add .</code>.
          </p>
          <CodeBlock code={ignoreExample} />
        </section>

        <section>
          <h2>If something sensitive is published</h2>
          <ol className="flow-list">
            {reportSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2>What AIPM should protect next</h2>
          <p>
            The next product milestones should include package takedown workflow, owner transfer,
            verified publisher badges, stronger package scanning, private package support, and a
            formal vulnerability disclosure channel.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
