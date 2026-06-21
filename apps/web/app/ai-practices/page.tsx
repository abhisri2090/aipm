import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

const sources = [
  {
    name: "OpenAI prompting guide",
    href: "https://platform.openai.com/docs/guides/prompting",
    note: "Use clear instructions, context, examples, and repeated testing.",
  },
  {
    name: "Anthropic prompt engineering",
    href: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
    note: "Structure prompts, add context, and test changes on real tasks.",
  },
  {
    name: "Google People + AI Guidebook",
    href: "https://pair.withgoogle.com/guidebook-v2/",
    note: "Design AI products around people, feedback, and trust.",
  },
  {
    name: "NIST AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Find and manage AI risks before broad rollout.",
  },
  {
    name: "Microsoft Responsible AI",
    href: "https://www.microsoft.com/en-us/ai/principles-and-approach",
    note: "Fairness, reliability, privacy, inclusion, transparency, and accountability.",
  },
  {
    name: "Stanford AI Index",
    href: "https://hai.stanford.edu/ai-index/",
    note: "Yearly data about AI progress, use, evaluation, and governance.",
  },
];

const practices = [
  {
    title: "Keep AI files with the project",
    body: "Store prompts, rules, memory files, instructions, and skill files in the repo. A skill should explain what it does and why the project needs it.",
  },
  {
    title: "Make each skill small",
    body: "A good skill does one repeated job: review code, summarize issues, write release notes, generate tests, or explain product context. Small skills are easier to test and update.",
  },
  {
    title: "Write for people and AI",
    body: "Include the goal, context, limits, examples, expected output, and known problems. A teammate should understand the skill before running it.",
  },
  {
    title: "Name the tools it supports",
    body: "Say whether the package supports Cursor, Claude, Codex, or another assistant. Tool files should go into predictable folders.",
  },
  {
    title: "Test with real work",
    body: "Before publishing, try the skill on work that looks like real use. Keep a short checklist for expected behavior, wrong behavior, and edge cases.",
  },
  {
    title: "Keep secrets out",
    body: "Do not package API keys, customer data, private prompts, credentials, or internal documents. Use ignore files and review the preview before publishing.",
  },
  {
    title: "Use examples",
    body: "Input and output examples help assistants follow the right pattern. Keep examples short, specific, and easy to scan.",
  },
  {
    title: "Version important changes",
    body: "Changing a skill can change how teammates work. Use a new version and explain what changed.",
  },
  {
    title: "Keep people in control",
    body: "For important work, make the skill draft, inspect, and explain. Do not make it take irreversible action silently.",
  },
  {
    title: "Explain how to recover",
    body: "Say what to do if install fails, a tool is unsupported, a generated file is wrong, or a user needs an older version.",
  },
];

export const metadata = pageMetadata({
  title: "AI Best Practices for Reusable Skills",
  description:
    "A simple guide to writing safe and reusable AI skills with AIPM.",
  path: "/ai-practices",
  keywords: [
    "AI best practices",
    "AI skill registry",
    "prompt engineering",
    "AI package manager",
    "Cursor skills",
    "Claude skills",
    "responsible AI",
  ],
});

export default function AiPracticesPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "AI Best Practices for Reusable Skills",
            description:
              "A simple guide to writing safe and reusable AI skills with AIPM.",
            author: { "@type": "Organization", name: "AIPM" },
            publisher: { "@type": "Organization", name: "AIPM" },
            mainEntityOfPage: "https://aipm-registry.com/ai-practices",
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>AI Best Practices</p>
        <h1>Build AI skills that are clear, safe, and reusable.</h1>
        <p className={shell.lede}>
          A good AI workflow should not be lost in chat history. Turn it into a small, documented
          skill that can be installed, tested, and updated. For naming, metadata, and SEO, see the{" "}
          <Link href="/discoverability">discoverability guide</Link>.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/publish">
            Publish a skill
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/registry">
            Browse skills
          </Link>
        </div>
      </section>

      <section className={cards.practiceGrid} aria-label="AI best practices">
        {practices.map((practice) => (
          <article className={cards.practiceCard} key={practice.title}>
            <h2>{practice.title}</h2>
            <p>{practice.body}</p>
          </article>
        ))}
      </section>

      <section className={cn(docs.doc, docs.wideDoc)} aria-labelledby="skill-checklist">
        <section>
          <h2 id="skill-checklist">AIPM skill quality checklist</h2>
          <ul className={docs.checkList}>
            <li>The skill has a clear name, description, supported targets, and entry file.</li>
            <li>The package includes only files that should be public.</li>
            <li>The instructions include context, constraints, examples, and expected output.</li>
            <li>The skill was tested against at least one realistic task before publishing.</li>
            <li>The version number matches the size of the change.</li>
          </ul>
        </section>

        <section>
          <h2>Source-backed guidance</h2>
          <p>
            This page turns public AI guidance into practical AIPM advice. These references are good
            starting points for teams building reusable AI workflows.
          </p>
          <div className={cards.sourceList}>
            {sources.map((source) => (
              <a className={cards.sourceCard} href={source.href} key={source.href}>
                <strong>{source.name}</strong>
                <span>{source.note}</span>
              </a>
            ))}
          </div>
        </section>
      </section>
    </DocLayout>
  );
}
