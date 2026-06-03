import Link from "next/link";
import { CodeBlock } from "../components/code-block";
import { RegistrySearch } from "../components/registry-search";
import { CLI_INSTALL_COMMAND } from "../lib/registry";
import { pageMetadata } from "../lib/seo";

export const metadata = pageMetadata({
  title: "AIPM Registry",
  description: "Install project-ready AI skills, prompts, and tool files into Cursor, Claude, and supported assistants.",
  keywords: [
    "AI package manager",
    "AI skill registry",
    "Cursor skills",
    "Claude skills",
    "prompt packages",
    "AI tools",
  ],
});

export default async function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "AIPM Registry",
            url: "https://aipm-registry.com",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://aipm-registry.com/registry?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">AIPM — AI Package Manager</p>
        <h1 id="hero-title">npm-style packages for AI skills, tools, and MCP</h1>
        <p className="lede">
          AIPM aims to solve AI package distribution problems. Registry + CLI to Install, Update,
          Deploy, Remove, and bind packages into your repo for Cursor, Claude, Codex, and more — no
          copying files by hand.
        </p>
        <div className="actions">
          <Link className="button" href="#get-started">
            Get started
          </Link>
          <Link className="button" href="/registry">
            Browse registry
          </Link>
          <Link className="button secondary" href="/publish">
            Publishing plan
          </Link>
        </div>
      </section>

      <section className="panel-section" id="get-started" aria-labelledby="get-started-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Get started</p>
            <h2 id="get-started-title">Install AIPM and bind skills to a project</h2>
          </div>
          <Link className="text-link" href="/use">
            Full guide
          </Link>
        </div>

        <div className="steps">
          <article className="step-card">
            <span className="step-number">1</span>
            <h3>Install the CLI</h3>
            <CodeBlock code={CLI_INSTALL_COMMAND} />
          </article>
          <article className="step-card">
            <span className="step-number">2</span>
            <h3>Initialize your project</h3>
            <CodeBlock code="aipm init" />
          </article>
          <article className="step-card">
            <span className="step-number">3</span>
            <h3>Add a skill</h3>
            <CodeBlock code="aipm add @scope/name@1.0.0 --target cursor --ci" />
          </article>
        </div>
      </section>

      <section className="panel-section" aria-labelledby="home-search-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live registry</p>
            <h2 id="home-search-title">Find a skill</h2>
          </div>
          <Link className="text-link" href="/registry">
            Open full registry
          </Link>
        </div>
        <RegistrySearch compact initialPackages={[]} />
      </section>

      <section className="guide-grid" aria-label="AIPM basics">
        <Link className="guide-card" href="/use">
          <h2>Use skills</h2>
          <p>Initialize a project, install a skill, and see what files AIPM writes.</p>
        </Link>
        <Link className="guide-card" href="/publish">
          <h2>Publish skills</h2>
          <p>Create a manifest, target one or more AI tools, and version updates cleanly.</p>
        </Link>
        <Link className="guide-card" href="/resources">
          <h2>Learn the practice</h2>
          <p>Read AI skill best practices, acknowledgements, and publishing resources.</p>
        </Link>
        <Link className="guide-card" href="/discoverability">
          <h2>Get discovered</h2>
          <p>Write names, descriptions, and examples that help users find the right AI skill.</p>
        </Link>
        <Link className="guide-card" href="/faq">
          <h2>Troubleshoot</h2>
          <p>Fix registry, package, target, version, and install problems quickly.</p>
        </Link>
      </section>
    </main>
  );
}
