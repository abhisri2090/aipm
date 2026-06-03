import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

const sources = [
  {
    name: "OpenAI prompting guide",
    href: "https://platform.openai.com/docs/guides/prompting",
    note: "Clear instructions, context, examples, and iterative evaluation.",
  },
  {
    name: "Anthropic prompt engineering",
    href: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
    note: "Structure prompts, provide context, and test changes against real tasks.",
  },
  {
    name: "Google People + AI Guidebook",
    href: "https://pair.withgoogle.com/guidebook-v2/",
    note: "Human-centered AI product design, feedback, and user trust.",
  },
  {
    name: "NIST AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Govern, map, measure, and manage AI risks before broad rollout.",
  },
  {
    name: "Microsoft Responsible AI",
    href: "https://www.microsoft.com/en-us/ai/principles-and-approach",
    note: "Fairness, reliability, privacy, inclusiveness, transparency, and accountability.",
  },
  {
    name: "Stanford AI Index",
    href: "https://hai.stanford.edu/ai-index/",
    note: "Annual context on AI progress, adoption, evaluation, and governance.",
  },
];

const practices = [
  {
    title: "Treat AI files as project assets",
    body: "Keep prompts, rules, memory files, instructions, and tool-specific skill files versioned with the project. A skill should explain what it changes and why the project needs it.",
  },
  {
    title: "Make every skill narrow and installable",
    body: "A good skill solves one recurring job: review code, summarize issues, write release notes, generate tests, or explain product context. Smaller skills are easier to evaluate and safer to update.",
  },
  {
    title: "Write for the assistant and the human",
    body: "Include intent, context, constraints, examples, expected output, and known failure modes. The next teammate should understand the skill before running it.",
  },
  {
    title: "Bind the skill to real tools",
    body: "Declare whether the package supports Cursor, Claude, Codex, or another assistant. Tool-specific files should live in predictable folders so installs are repeatable.",
  },
  {
    title: "Evaluate with real tasks",
    body: "Before publishing, test the skill on work that looks like production. Keep a short checklist of expected behavior, rejected behavior, and edge cases.",
  },
  {
    title: "Protect secrets and private context",
    body: "Never package API keys, customer data, private prompts, credentials, or internal-only documents. Use ignore files and review the package preview before pushing.",
  },
  {
    title: "Prefer examples over vague rules",
    body: "Concrete input and output examples help assistants follow the intended pattern. Keep examples short enough to scan and specific enough to guide behavior.",
  },
  {
    title: "Version behavior changes",
    body: "Changing a skill can change how teammates work. Use semantic versions, write a changelog note, and avoid silently replacing behavior under the same version.",
  },
  {
    title: "Keep humans in control",
    body: "For high-impact work, design skills to draft, inspect, and explain instead of silently taking irreversible action. Make review points visible.",
  },
  {
    title: "Document recovery paths",
    body: "Explain what to do when install fails, a target tool is unsupported, a generated file is wrong, or a user needs to roll back to a previous version.",
  },
];

export const metadata = pageMetadata({
  title: "AI Best Practices for Reusable Skills",
  description:
    "A practical guide to reusable AI skills, prompt packages, project-ready assistant files, evaluation, safety, and publishing with AIPM.",
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
              "A practical guide to reusable AI skills, prompt packages, project-ready assistant files, evaluation, safety, and publishing with AIPM.",
            author: { "@type": "Organization", name: "AIPM" },
            publisher: { "@type": "Organization", name: "AIPM" },
            mainEntityOfPage: "https://aipm-registry.com/ai-practices",
          }),
        }}
      />

      <section className="page-header">
        <p className="eyebrow">AI Best Practices</p>
        <h1>Build AI skills that teams can trust, reuse, and improve.</h1>
        <p className="lede">
          The best AI workflow is not a clever prompt lost in chat history. It is a small,
          documented, versioned skill that can be installed into a real project, tested against real
          work, and updated without surprising the team.
        </p>
        <div className="actions">
          <Link className="button" href="/publish">
            Publish a skill
          </Link>
          <Link className="button secondary" href="/registry">
            Browse registry
          </Link>
        </div>
      </section>

      <section className="practice-grid" aria-label="AI best practices">
        {practices.map((practice) => (
          <article className="practice-card" key={practice.title}>
            <h2>{practice.title}</h2>
            <p>{practice.body}</p>
          </article>
        ))}
      </section>

      <section className="doc wide-doc" aria-labelledby="skill-checklist">
        <section>
          <h2 id="skill-checklist">AIPM skill quality checklist</h2>
          <ul className="check-list">
            <li>The skill has a clear name, description, supported targets, and entry file.</li>
            <li>The package includes only files that should be public and installable.</li>
            <li>The instructions include context, constraints, examples, and expected output.</li>
            <li>The skill was tested against at least one realistic task before publishing.</li>
            <li>The version number reflects whether the update is patch, minor, or breaking.</li>
          </ul>
        </section>

        <section>
          <h2>Source-backed guidance</h2>
          <p>
            This page translates public AI guidance into AIPM publishing practice. These references
            are useful starting points for teams building reusable AI workflows.
          </p>
          <div className="source-list">
            {sources.map((source) => (
              <a className="source-card" href={source.href} key={source.href}>
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
