import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Publish and Distribute AI Skills, MCP, and Tool Packages",
  description:
    "Use AIPM to publish AI skills, MCP setup, prompts, and tool files.",
  path: "/publish",
  keywords: [
    "publish AI skills",
    "AI package distribution",
    "MCP package manager",
    "AI tool distribution",
    "team AI skills",
    "Cursor skills publishing",
    "Claude skills publishing",
  ],
});

export default function PublishPage() {
  const benefits = [
    {
      title: "Publish once, install where needed",
      body: "Turn an AI setup into a package so users can install it into the right repo and AI tool.",
    },
    {
      title: "Keep team setup in one place",
      body: "Teams can reserve package names and share approved prompts, skills, and MCP setup without sending files through chat.",
    },
    {
      title: "Review every change",
      body: "Each package has versions, so users can see when a skill or prompt changed.",
    },
  ];

  const useCases = [
    "Internal skills for code review, triage, release notes, and support work.",
    "MCP server setup, tool instructions, and assistant config shared as packages.",
    "Shared rules for Cursor, Claude, Codex, and future AI tools.",
    "Public packages that help other developers install useful AI workflows.",
  ];

  const publishingSteps = [
    "Create an account with GitHub.",
    "Create an org namespace, such as @team.",
    "Reserve a skill package name, such as @team/review-helper.",
    "Create or import a local skill folder.",
    "Stage, preview, and validate the files that will become public.",
    "Generate a 5-minute publish token in the dashboard.",
    "Push the staged files from the CLI.",
    "Open the public package page and verify the install command.",
  ];

  return (
    <main>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Publish with AIPM</p>
        <h1>Publish AI skills so others can install them.</h1>
        <p className={shell.lede}>
          AIPM helps you package prompts, rules, MCP setup, and tool files once. Then other projects
          can install the same setup from the registry. Publishing uses account ownership,
          reserved package names, and short-lived CLI tokens.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/login">
            Sign in to publish
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/publish/guide">
            Read publishing guide
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/dashboard">
            Publisher dashboard
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="publish-benefits-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Benefits</p>
            <h2 id="publish-benefits-title">Why publish with AIPM?</h2>
          </div>
        </div>
        <div className={cards.guideGrid}>
          {benefits.map((benefit) => (
            <article className={cards.guideCard} key={benefit.title}>
              <h2>{benefit.title}</h2>
              <p>{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="publish-usecases-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Use cases</p>
            <h2 id="publish-usecases-title">What teams can share</h2>
          </div>
        </div>
        <article className={docs.doc}>
          <ul className={docs.checkList}>
            {useCases.map((useCase) => (
              <li key={useCase}>{useCase}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className={shell.panelSection} aria-labelledby="publish-flow-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Workflow</p>
            <h2 id="publish-flow-title">From local files to an installable package</h2>
          </div>
          <Link className={shell.textLink} href="/publish/guide">
            Full publishing guide
          </Link>
        </div>
        <div className={cards.steps}>
          <article className={cards.stepCard}>
            <span className={cards.stepNumber}>1</span>
            <h3>Reserve</h3>
            <p>Sign in, create an org, and reserve a package name before publishing.</p>
          </article>
          <article className={cards.stepCard}>
            <span className={cards.stepNumber}>2</span>
            <h3>Prepare</h3>
            <p>Create or import a skill folder, then stage and validate the public files.</p>
          </article>
          <article className={cards.stepCard}>
            <span className={cards.stepNumber}>3</span>
            <h3>Push</h3>
            <p>Generate a 5-minute token and push the version from the CLI.</p>
          </article>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="publish-real-flow-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Real user path</p>
            <h2 id="publish-real-flow-title">Everything needed to publish safely</h2>
          </div>
          <Link className={shell.textLink} href="/examples">
            See examples
          </Link>
        </div>
        <article className={docs.doc}>
          <ol className={docs.flowList}>
            {publishingSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}
