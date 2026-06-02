import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AIPM FAQ",
  description: "Troubleshooting and frequently asked questions for AIPM users and publishers.",
  path: "/faq",
});

const faqs = [
  [
    "The registry is not reachable.",
    "Check the registry URL and run curl <registry-url>/health. If it fails, the server or network route is down.",
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
    "Can I publish private skills?",
    "Not yet. Public publishing is approval-only while account, organization, and short-lived publish-token flows are designed.",
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
    <main>
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
    </main>
  );
}
