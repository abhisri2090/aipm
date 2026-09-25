import Link from "next/link";
import type { ReactNode } from "react";
import { shell, cards } from "../../lib/page-styles";
import { DocLayout } from "../../components/doc-layout";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AIPM FAQ — Install Claude Code & Cursor Skills",
  description:
    "Answers for installing Claude Code and Cursor skills with AIPM, publishing to the registry, and common troubleshooting.",
  path: "/faq",
  keywords: [
    "AIPM FAQ",
    "install Claude Code skills",
    "install Cursor skills",
    "AIPM troubleshooting",
    "AI agent skills help",
  ],
});

/** `text` is the plain-text answer used in FAQPage JSON-LD when `answer` contains markup. */
const faqs: { question: string; answer: ReactNode; text?: string }[] = [
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
    answer: (
      <>
        Check that you used the right --target: --target claude writes .claude/skills/&lt;skill&gt;/SKILL.md for
        Claude Code, and --target codex writes .agents/skills/&lt;skill&gt;/SKILL.md for Codex. For Cursor, use
        --target claude or --target codex, because Cursor loads skills from .claude/skills and .agents/skills but not
        from .cursor/aipm/skills, where --target cursor currently writes. Then restart or reload the AI tool if it
        caches project files. To see every folder each tool reads, go to{" "}
        <Link href="/guides/where-are-claude-skills-stored">where are Claude skills stored?</Link>
      </>
    ),
    text: "Check that you used the right --target: --target claude writes .claude/skills/<skill>/SKILL.md for Claude Code, and --target codex writes .agents/skills/<skill>/SKILL.md for Codex. For Cursor, use --target claude or --target codex, because Cursor loads skills from .claude/skills and .agents/skills but not from .cursor/aipm/skills, where --target cursor currently writes. Then restart or reload the AI tool if it caches project files. To see every folder each tool reads, go to where are Claude skills stored?",
  },
  {
    question: "How does my team keep the same skill versions?",
    answer:
      "Commit aipm.package.json and aipm-lock.json. Teammates run aipm install to get the same pinned versions, aipm update moves a skill to its latest version, and aipm remove uninstalls it. In CI, run aipm install --ci --target <tool> with an org install token. Pin exact versions (@scope/name@1.2.0); version ranges are not supported.",
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
    text: "See the security guide for preview checks, .aipmignore, and incident steps.",
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
      "Generate a new token from the skill dashboard. Tokens are short-lived and are not stored by the CLI.",
  },
  {
    question: "Publisher identity is unavailable on a package.",
    answer: "That package does not have a linked publisher account. Review it carefully before installing.",
  },
  {
    question: "How do I install the CLI?",
    answer: (
      <>
        Run <code>npm install -g @aipm-registry/cli</code> (Node.js 20 or later). Then run{" "}
        <code>aipm --version</code> and <code>aipm doctor</code>.
      </>
    ),
    text: "Run npm install -g @aipm-registry/cli (Node.js 20 or later). Then run aipm --version and aipm doctor.",
  },
  {
    question: "Where are package files stored?",
    answer: "Package metadata is stored by the registry. Package tarballs are stored in blob storage.",
  },
];

function faqAnswerToText(answer: ReactNode): string {
  if (typeof answer === "string") return answer;
  return String(answer);
}

export default function FaqPage() {
  return (
    <DocLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            name: "AIPM FAQ",
            description: "Troubleshooting and frequently asked questions for AIPM users and publishers.",
            url: `${SITE_URL}/faq`,
            mainEntity: faqs.map(({ question, answer, text }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: {
                "@type": "Answer",
                text: text ?? faqAnswerToText(answer),
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
