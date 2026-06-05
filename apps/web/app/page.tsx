import { shell, cards, home, cn } from "../lib/page-styles";
import Link from "next/link";
import { CodeBlock } from "../components/code-block";
import { RegistrySearch } from "../components/registry-search";
import { CLI_INSTALL_COMMAND } from "../lib/registry";
import { pageMetadata } from "../lib/seo";

export const metadata = pageMetadata({
  title: "AIPM Registry",
  description: "Install AI skills, prompts, and tool files into Cursor, Claude, and other assistants.",
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
      <section className={home.hero} aria-labelledby="hero-title">
        <p className={shell.eyebrow}>AIPM — AI Package Manager</p>
        <h1 id="hero-title">Install AI skills like packages.</h1>
        <p className={shell.lede}>
          AIPM gives you a registry and CLI for AI skills. Install prompts, rules, MCP setup, and
          tool files into a repo for Cursor, Claude, Codex, and more. No manual copy and paste.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="#get-started">
            Get started
          </Link>
          <Link className={shell.button} href="/registry">
            Browse registry
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/publish">
            Publish a skill
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} id="get-started" aria-labelledby="get-started-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Get started</p>
            <h2 id="get-started-title">Install AIPM and add a skill</h2>
          </div>
          <Link className={shell.textLink} href="/use">
            Full guide
          </Link>
        </div>

        <div className={cards.steps}>
          <article className={cards.stepCard}>
            <span className={cards.stepNumber}>1</span>
            <h3>Install the CLI</h3>
            <CodeBlock code={CLI_INSTALL_COMMAND} />
          </article>
          <article className={cards.stepCard}>
            <span className={cards.stepNumber}>2</span>
            <h3>Initialize your project</h3>
            <CodeBlock code="aipm init" />
          </article>
          <article className={cards.stepCard}>
            <span className={cards.stepNumber}>3</span>
            <h3>Add a skill</h3>
            <CodeBlock code="aipm add @scope/name@1.0.0 --target cursor --ci" />
          </article>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="home-search-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Live registry</p>
            <h2 id="home-search-title">Find a skill</h2>
          </div>
          <Link className={shell.textLink} href="/registry">
            Open full registry
          </Link>
        </div>
        <RegistrySearch compact initialPackages={[]} />
      </section>

      <section className={cards.guideGrid} aria-label="AIPM basics">
        <Link className={cards.guideCard} href="/use">
          <h2>Use skills</h2>
          <p>Create project config, install a skill, and see which files AIPM writes.</p>
        </Link>
        <Link className={cards.guideCard} href="/publish">
          <h2>Publish skills</h2>
          <p>Create a manifest, choose supported AI tools, and publish new versions.</p>
        </Link>
        <Link className={cards.guideCard} href="/resources">
          <h2>Learn the basics</h2>
          <p>Read practical guides for creating safe, useful AI skills.</p>
        </Link>
        <Link className={cards.guideCard} href="/discoverability">
          <h2>Get discovered</h2>
          <p>Write names, descriptions, and examples that help users find the right AI skill.</p>
        </Link>
        <Link className={cards.guideCard} href="/faq">
          <h2>Troubleshoot</h2>
          <p>Fix registry, package, target, version, and install problems quickly.</p>
        </Link>
      </section>
    </main>
  );
}
