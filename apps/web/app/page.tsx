import { shell, cards, home, cn } from "../lib/page-styles";
import Link from "next/link";
import { CodeBlock } from "../components/code-block";
import { RegistrySearch } from "../components/registry-search";
import { CLI_INSTALL_OPTIONS } from "../lib/registry";
import { pageMetadata } from "../lib/seo";

type PackageTag = {
  href?: string;
  label: string;
  status: "done" | "pending";
};

const PACKAGE_TAGS: readonly PackageTag[] = [
  { href: "/skills", label: "Skills", status: "done" },
  { label: "Rules", status: "pending" },
  { href: "/prompts", label: "Prompts", status: "done" },
  { label: "MCP servers", status: "pending" },
  { label: "Hooks", status: "pending" },
  { label: "Context packs", status: "pending" },
  { label: "Policies", status: "pending" },
  { label: "Workflows", status: "pending" },
  { label: "Memory config", status: "pending" },
  { label: "Tool configs", status: "pending" },
  { label: "Environment bundles", status: "pending" },
  { label: "Agent instructions", status: "pending" },
] as const;

function TagStatusIcon({ status }: { status: "done" | "pending" }) {
  if (status === "done") {
    return (
      <svg
        aria-hidden="true"
        className={home.heroTagIconDone}
        fill="none"
        height="14"
        viewBox="0 0 24 24"
        width="14"
      >
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={home.heroTagIconPending}
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export const metadata = pageMetadata({
  title: "AIPM - AI Package Manager for Skills and Tool Files",
  description:
    "AIPM is an AI package manager for installing reusable skills, prompts, MCP setup, rules, and tool files into Cursor, Claude, Codex, and other assistants.",
  keywords: [
    "AI package manager",
    "AI skill registry",
    "agent package manager",
    "Cursor skills",
    "Claude skills",
    "Codex skills",
    "prompt packages",
    "MCP packages",
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
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://www.aipm-registry.com/#website",
                name: "AIPM Registry",
                alternateName: "AIPM",
                url: "https://www.aipm-registry.com",
                description:
                  "A registry and CLI for installing reusable AI skills, prompts, rules, MCP setup, and tool files into supported assistants.",
                publisher: {
                  "@id": "https://www.aipm-registry.com/#organization",
                },
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://www.aipm-registry.com/registry?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": "https://www.aipm-registry.com/#organization",
                name: "AIPM",
                url: "https://www.aipm-registry.com",
                logo: "https://www.aipm-registry.com/aipm-logo.svg",
                founder: {
                  "@id": "https://www.aipm-registry.com/#abhishek-srivastava",
                },
                sameAs: ["https://github.com/abhisri2090/aipm"],
              },
              {
                "@type": "Person",
                "@id": "https://www.aipm-registry.com/#abhishek-srivastava",
                name: "Abhishek Srivastava",
                url: "https://www.linkedin.com/in/abhisri2090",
                sameAs: ["https://x.com/abhisri2090", "https://github.com/abhisri2090"],
              },
              {
                "@type": "SoftwareApplication",
                "@id": "https://www.aipm-registry.com/#cli",
                name: "AIPM CLI",
                applicationCategory: "DeveloperApplication",
                operatingSystem: "macOS, Linux, Windows",
                description:
                  "Command line tool for installing and publishing project-ready AI skills and tool files.",
                installUrl: "https://www.aipm-registry.com/use",
                softwareHelp: "https://www.aipm-registry.com/commands",
                codeRepository: "https://github.com/abhisri2090/aipm",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
              },
            ],
          }),
        }}
      />
      <section className={home.hero} aria-labelledby="hero-title">
        <p className={shell.eyebrow}>AIPM — AI Package Manager</p>
        <h1 id="hero-title">Install AI skills like packages.</h1>
        <div className={home.heroManifestoRow}>
          <ul className={home.heroManifesto} aria-label="Why AIPM exists">
            <li>Software got npm.</li>
            <li>Infrastructure got Terraform.</li>
            <li>Containers got Docker.</li>
            <li>AI has nothing.</li>
            <li>That&apos;s the problem AIPM solves.</li>
          </ul>
          <aside className={home.heroAuthor} aria-label="Author">
            <img
              alt="Author profile"
              className={home.heroAvatar}
              height={88}
              src="/author.webp"
              width={88}
            />
            <div className={home.heroAuthorMeta}>
              <p className={home.heroAuthorName}>Abhishek Srivastava</p>
              <p className={home.heroAuthorBio}>
                Building the package manager AI was missing.
                <br />
                Looking for contributors
              </p>
              <div className={home.heroSocials}>
                <a
                  className={home.heroSocialLink}
                  href="https://linkedin.com/in/abhisri2090"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  LinkedIn
                </a>
                <a
                  className={home.heroSocialLink}
                  href="https://x.com/abhisri2090"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  X
                </a>
                <a
                  className={home.heroSocialLink}
                  href="mailto:2abhisri@gmail.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Email: 2abhisri@gmail.com
                </a>
              </div>
            </div>
          </aside>
        </div>
        <p className={shell.lede}>
          AIPM gives you a registry and CLI for AI skills. Install prompts, rules, MCP setup, and
          tool files into a repo for Cursor, Claude, Codex, and more. Start with one command, then
          keep reusable AI setup with your project.
        </p>
        <dl className={home.answerGrid} aria-label="AIPM direct answers">
          <div>
            <dt>What is AIPM?</dt>
            <dd>
              AIPM is an AI package manager: a public registry plus CLI for reusable AI skills,
              prompts, rules, MCP setup, and tool files.
            </dd>
          </div>
          <div>
            <dt>Who is it for?</dt>
            <dd>
              Tech and non-tech people who use AI tools for day-to-day tasks and want to
              organize and scale AI use across their teams.
            </dd>
          </div>
          <div>
            <dt>How do you start?</dt>
            <dd>
              Install the CLI, run <code>aipm init</code>, then add a package with{" "}
              <code>aipm add @scope/name@version</code>.
            </dd>
          </div>
        </dl>
        <div className={home.heroTagRow} aria-label="Package types AIPM manages">
          {PACKAGE_TAGS.map((tag) => {
            const content = (
              <>
                <TagStatusIcon status={tag.status} />
                {tag.label}
              </>
            );

            return tag.href ? (
              <Link className={home.heroTag} href={tag.href} key={tag.label}>
                {content}
              </Link>
            ) : (
              <span className={home.heroTag} key={tag.label}>
                {content}
              </span>
            );
          })}
        </div>
        <div className={shell.actions}>
          <Link className={shell.button} href="#get-started">
            Get started
          </Link>
          <Link className={shell.button} href="/registry">
            Browse registry
          </Link>
          <Link className={shell.button} href="/prompts">
            Browse prompts
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
            <div className={cards.stepHeading}>
              <span className={cards.stepNumber}>1</span>
              <h3>Install the CLI</h3>
            </div>
            <CodeBlock code={CLI_INSTALL_OPTIONS[0].code} />
            <p className={cards.stepInstallMethods}>
              {"Other install methods ->"}{" "}
              <Link className={shell.textLink} href="/install">
                Full install guide
              </Link>
            </p>
          </article>
          <article className={cards.stepCard}>
            <div className={cards.stepHeading}>
              <span className={cards.stepNumber}>2</span>
              <h3>Initialize your project</h3>
            </div>
            <p>Create an AIPM config file in the current project.</p>
            <CodeBlock code="aipm init --target cursor" />
          </article>
          <article className={cards.stepCard}>
            <div className={cards.stepHeading}>
              <span className={cards.stepNumber}>3</span>
              <h3>Add a skill</h3>
            </div>
            <p>Install one package version into the selected AI tool target.</p>
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
          <p>Create an account, reserve a package name, generate a token, and publish new versions.</p>
        </Link>
        <Link className={cards.guideCard} href="/resources">
          <h2>Learn the basics</h2>
          <p>Read practical guides for creating safe, useful AI skills.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/ai-package-manager">
          <h2>What is an AI package manager?</h2>
          <p>Understand AIPM, AI skills, prompt packages, and reusable assistant setup.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/agent-package-manager">
          <h2>Agent package manager guide</h2>
          <p>Learn how packages help AI agents reuse project workflows safely.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/version-ai-prompts">
          <h2>Version AI prompts</h2>
          <p>Keep prompts, rules, and instructions in Git instead of losing them in chat.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/ai-agent-configuration-files">
          <h2>Agent config files</h2>
          <p>Understand AGENTS.md, CLAUDE.md, Cursor rules, MCP config, and skills.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/agents-md-vs-claude-md-vs-cursor-rules">
          <h2>AGENTS.md vs CLAUDE.md</h2>
          <p>Choose the right instruction file for Claude Code, Cursor, and other agents.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/mcp-json-guide-cursor-claude">
          <h2>mcp.json guide</h2>
          <p>Manage MCP server setup safely across Cursor, Claude Code, and team repos.</p>
        </Link>
        <Link className={cards.guideCard} href="/compatibility">
          <h2>Agent file compatibility</h2>
          <p>Compare AGENTS.md, CLAUDE.md, Cursor rules, skills, and MCP in one verified table.</p>
        </Link>
        <Link className={cards.guideCard} href="/stats">
          <h2>AIPM public statistics</h2>
          <p>See live package, install, AI tool, and category counts from the registry.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/cursor-rules-vs-agents-md">
          <h2>Cursor rules vs AGENTS.md</h2>
          <p>Choose the right shared or scoped instruction format for your coding agents.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/claude-code-skills-vs-slash-commands">
          <h2>Claude skills vs commands</h2>
          <p>See how Claude Code skills and custom slash commands now work together.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/mcp-server-config-best-practices">
          <h2>MCP config best practices</h2>
          <p>Keep MCP server access safe, clear, testable, and easy to reuse.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/share-ai-prompts-team">
          <h2>Share team prompts</h2>
          <p>Give teammates one clear prompt source instead of scattered chat copies.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/package-mcp-server-setup">
          <h2>Package MCP setup</h2>
          <p>Share MCP setup notes safely without publishing tokens or private values.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/aipm-vs-copying-prompts">
          <h2>AIPM vs copy-paste</h2>
          <p>See when a package manager is better than copying prompts by hand.</p>
        </Link>
        <Link className={cards.guideCard} href="/popular-skills">
          <h2>Popular skill ideas</h2>
          <p>Start with high-value skills for code review, tests, docs, security, MCP setup, and more.</p>
        </Link>
        <Link className={cards.guideCard} href="/discoverability">
          <h2>Get discovered</h2>
          <p>Write names, descriptions, and examples that help users find the right AI skill.</p>
        </Link>
        <Link className={cards.guideCard} href="/templates">
          <h2>Start from templates</h2>
          <p>Create package folders for review, issue summary, release notes, or blank skills.</p>
        </Link>
        <Link className={cards.guideCard} href="/faq">
          <h2>Troubleshoot</h2>
          <p>Fix registry, package, target, version, and install problems quickly.</p>
        </Link>
      </section>
    </main>
  );
}
