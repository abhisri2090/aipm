import Link from "next/link";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Publish and Distribute AI Skills, MCP, and Tool Packages",
  description:
    "Use AIPM to package, publish, and distribute AI skills, MCP setup, prompts, and tool files across teams, repos, and AI assistants.",
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
      title: "Distribute once, install anywhere",
      body: "Publish a reusable AI package and let users install it into the repos, editors, and assistants that need it.",
    },
    {
      title: "Made for teams and orgs",
      body: "Organizations can reserve package names, publish approved workflows, and avoid sending prompts or MCP setup through chat threads.",
    },
    {
      title: "Versioned AI operations",
      body: "Every skill, tool file, prompt bundle, or MCP package can move through explicit versions so changes stay reviewable.",
    },
  ];

  const useCases = [
    "Internal AI skills for code review, triage, release notes, and support workflows.",
    "MCP server setup, tool instructions, and assistant-specific config distributed as packages.",
    "Cross-repo standards for Cursor, Claude, Codex, and future AI tool adapters.",
    "Public packages that help other developers discover and install useful AI workflows.",
  ];

  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Publish with AIPM</p>
        <h1>Easy distribution for AI skills, MCP, prompts, and tool packages.</h1>
        <p className="lede">
          AIPM helps users and organizations package AI setup once, publish it through a registry,
          and install it into any repo that needs the same skills, MCP setup, prompts, or tool files.
        </p>
        <div className="actions">
          <Link className="button" href="/login">
            Sign in to publish
          </Link>
          <Link className="button secondary" href="/publish/guide">
            Read the guide
          </Link>
          <Link className="button secondary" href="/dashboard">
            Publisher dashboard
          </Link>
        </div>
      </section>

      <section className="panel-section" aria-labelledby="publish-benefits-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Benefits</p>
            <h2 id="publish-benefits-title">Why publish through AIPM?</h2>
          </div>
        </div>
        <div className="guide-grid">
          {benefits.map((benefit) => (
            <article className="guide-card" key={benefit.title}>
              <h2>{benefit.title}</h2>
              <p>{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-section" aria-labelledby="publish-usecases-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Use cases</p>
            <h2 id="publish-usecases-title">What teams can distribute</h2>
          </div>
        </div>
        <article className="doc">
          <ul className="check-list">
            {useCases.map((useCase) => (
              <li key={useCase}>{useCase}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel-section" aria-labelledby="publish-flow-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2 id="publish-flow-title">From local AI setup to installable package</h2>
          </div>
          <Link className="text-link" href="/publish/guide">
            Full publishing guide
          </Link>
        </div>
        <div className="steps">
          <article className="step-card">
            <span className="step-number">1</span>
            <h3>Package</h3>
            <p>Wrap skills, prompts, MCP setup, or tool files with an AIPM manifest.</p>
          </article>
          <article className="step-card">
            <span className="step-number">2</span>
            <h3>Publish</h3>
            <p>Reserve a package name, validate contents, and push a version to the registry.</p>
          </article>
          <article className="step-card">
            <span className="step-number">3</span>
            <h3>Install</h3>
            <p>Users add the package to a repo and bind it to Cursor, Claude, Codex, or future targets.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
