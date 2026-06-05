import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";

const checklist = [
  "Run aipm publish preview before publishing and check every included file.",
  "Keep API keys, tokens, private keys, customer data, and internal documents out of packages.",
  "Use .aipmignore to skip logs, screenshots, caches, exports, and private notes.",
  "Publish only files needed to explain or install the skill.",
  "Rotate any secret immediately if it was staged, even if publishing failed.",
  "Use a new 5-minute publish token each time you publish.",
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
  "Do not share exploit details in public package text.",
  "Write down the package name, version, file path, and why it is sensitive.",
  "Contact the package owner if you know them, then contact AIPM maintainers.",
  "If a secret is exposed, rotate it first. Removing the package does not make the secret safe.",
];

export const metadata = pageMetadata({
  title: "AIPM Security and Privacy Guide",
  description:
    "How to publish public AIPM packages without leaking secrets or private files.",
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
              "How to publish public AIPM packages without leaking secrets or private files.",
            author: { "@type": "Organization", name: "AIPM" },
            publisher: { "@type": "Organization", name: "AIPM" },
            mainEntityOfPage: "https://aipm-registry.com/security",
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Security</p>
        <h1>Publish AI skills without leaking private files.</h1>
        <p className={shell.lede}>
          AIPM packages are public by default. Treat every package like open-source code. Review the
          files, remove sensitive details, and publish only what users should install.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/publish">
            Publishing guide
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/faq">
            FAQ
          </Link>
        </div>
      </section>

      <section className={cards.practiceGrid} aria-label="Security principles">
        <article className={cards.practiceCard}>
          <h2>Public means anyone can read it</h2>
          <p>
            Assume package metadata, manifests, instructions, prompts, and bundled files can be read
            by anyone. Do not publish internal-only context.
          </p>
        </article>
        <article className={cards.practiceCard}>
          <h2>Short-lived tokens</h2>
          <p>
            Publish tokens are temporary on purpose. Generate one when you are ready to publish, then
            let it expire. Do not store it in project files.
          </p>
        </article>
        <article className={cards.practiceCard}>
          <h2>Preview before push</h2>
          <p>
            Preview shows exactly what will be included. Review the file list and package size before
            publishing a new version.
          </p>
        </article>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Publisher safety checklist</h2>
          <ul className={docs.checkList}>
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Recommended .aipmignore starter</h2>
          <p>
            Use this as a starting point. Add any private folders from your project before running
            <code>aipm publish add .</code>.
          </p>
          <CodeBlock code={ignoreExample} />
        </section>

        <section>
          <h2>If private data is published</h2>
          <ol className={docs.flowList}>
            {reportSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2>What AIPM should add next</h2>
          <p>
            AIPM should add package takedowns, owner transfer, verified publisher badges, stronger
            scanning, private packages, and a security contact channel.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
