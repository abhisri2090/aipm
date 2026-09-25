import { shell, cards, home, cn } from "../lib/page-styles";
import Link from "next/link";
import { CodeBlock } from "../components/code-block";
import { RegistrySearch } from "../components/registry-search";
import { CLI_INSTALL_OPTIONS, listPackagesPage, SITE_URL } from "../lib/registry";
import { pageMetadata } from "../lib/seo";

type PackageTag = {
  href?: string;
  label: string;
  status: "done" | "pending";
};

const PACKAGE_TAGS: readonly PackageTag[] = [
  { href: "/skills/claude", label: "Claude Code", status: "done" },
  { href: "/skills/cursor", label: "Cursor", status: "done" },
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
  title: "Claude & Agent Skills Marketplace — Install with AIPM",
  description:
    "A marketplace of Claude skills and agent skills for Claude Code, Cursor and Codex, plus AI prompts. Review the source, then install a pinned version with AIPM.",
  keywords: [
    "Claude skills marketplace",
    "Claude skills",
    "agent skills marketplace",
    "Claude Code skills",
    "Cursor skills",
    "AI agent skills",
    "install Claude skills",
    "Anthropic skills",
    "AIPM",
  ],
});

export default async function HomePage() {
  const { packages: homeSearchPackages } = await listPackagesPage({ query: "", limit: 3 });

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
                "@id": `${SITE_URL}/#website`,
                name: "AIPM Registry",
                alternateName: "AIPM",
                url: SITE_URL,
                description:
                  "Claude and agent skills marketplace with versioned skills, prompts, and a CLI to install them like packages.",
                publisher: {
                  "@id": `${SITE_URL}/#organization`,
                },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${SITE_URL}/skills?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: "AIPM",
                url: SITE_URL,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/aipm-logo.svg`,
                  width: 512,
                  height: 512,
                },
                founder: {
                  "@id": `${SITE_URL}/#abhishek-srivastava`,
                },
                sameAs: ["https://github.com/abhisri2090/aipm"],
              },
              {
                "@type": "Person",
                "@id": `${SITE_URL}/#abhishek-srivastava`,
                name: "Abhishek Srivastava",
                url: "https://www.linkedin.com/in/abhisri2090",
                sameAs: ["https://x.com/abhisri2090", "https://github.com/abhisri2090"],
              },
              {
                "@type": "SoftwareApplication",
                "@id": `${SITE_URL}/#cli`,
                name: "AIPM CLI",
                applicationCategory: "DeveloperApplication",
                operatingSystem: "macOS, Linux, Windows",
                description:
                  "Command line tool for installing and publishing project-ready AI skills and tool files.",
                url: `${SITE_URL}/install`,
                installUrl: `${SITE_URL}/install`,
                softwareHelp: `${SITE_URL}/commands`,
                codeRepository: "https://github.com/abhisri2090/aipm",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
                author: {
                  "@id": `${SITE_URL}/#organization`,
                },
              },
            ],
          }),
        }}
      />
      <section className={home.hero} aria-labelledby="hero-title">
        <p className={shell.eyebrow}>Claude · Claude Code · Cursor · Codex skills marketplace</p>
        <h1 id="hero-title">Claude and agent skills you can install like packages.</h1>
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
              alt="Abhishek Srivastava, AIPM creator"
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
          Browse a marketplace of Claude skills, agent skills for Claude Code, Cursor, and Codex, and
          AI prompts, then install a pinned version with the AIPM CLI. Review source and files first;
          keep package-manager versioning as the way you share skills across repos and teammates.
        </p>
        <dl className={home.answerGrid} aria-label="AIPM direct answers">
          <div>
            <dt>What is AIPM?</dt>
            <dd>
              AIPM is a Claude and agent skills marketplace plus CLI: browse versioned agent
              skills and prompts, then install them into Claude Code, Cursor, and other tools like
              packages.
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
          <Link className={shell.button} href="/skills/claude">
            Claude skills
          </Link>
          <Link className={shell.button} href="/skills/cursor">
            Cursor skills
          </Link>
          <Link className={shell.button} href="/skills">
            All agent skills
          </Link>
          <Link className={shell.button} href="/prompts">
            Browse prompts
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/install">
            Install AIPM
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
            <CodeBlock
              code={CLI_INSTALL_OPTIONS[0].code}
              trackingEvent="CLI Install Command Copied"
              trackingProperties={{ method: "homepage-npm" }}
            />
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
            <CodeBlock code="aipm init --target cursor" trackingEvent="CLI Init Command Copied" />
          </article>
          <article className={cards.stepCard}>
            <div className={cards.stepHeading}>
              <span className={cards.stepNumber}>3</span>
              <h3>Add a skill</h3>
            </div>
            <p>Install one package version into the selected AI tool target.</p>
            <CodeBlock
              code="aipm add @scope/name@1.0.0 --target cursor --ci"
              trackingEvent="Example Package Install Command Copied"
            />
          </article>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="home-search-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Live registry</p>
            <h2 id="home-search-title">Find a skill</h2>
          </div>
          <Link className={shell.textLink} href="/skills">
            Open skills registry
          </Link>
        </div>
        <RegistrySearch compact initialPackages={homeSearchPackages} />
      </section>

      <section className={cards.guideGrid} aria-label="AIPM basics">
        <Link className={cards.guideCard} href="/best-claude-skills">
          <h2>Best Claude skills</h2>
          <p>Claude skills ranked by real AIPM installs and source-repo GitHub stars.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/what-are-claude-skills">
          <h2>What are Claude skills?</h2>
          <p>How SKILL.md skills work in the Claude app and Claude Code, with examples.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/claude-code-plugins-vs-skills">
          <h2>Claude Code plugins vs skills</h2>
          <p>When a single skill is enough and when to package skills, hooks, and MCP as a plugin.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/claude-skills-marketplaces">
          <h2>Claude skills marketplaces</h2>
          <p>Compare the official Anthropic marketplace, GitHub, skills.sh, SkillsMP, and AIPM.</p>
        </Link>
        <Link className={cards.guideCard} href="/skills/claude">
          <h2>Claude skills marketplace</h2>
          <p>Browse versioned Claude and Claude Code skills, review source, and install with AIPM.</p>
        </Link>
        <Link className={cards.guideCard} href="/skills/cursor">
          <h2>Cursor skills registry</h2>
          <p>Find Cursor agent skills with clear versions, files, and install commands.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/aipm-vs-skills-sh">
          <h2>AIPM vs skills.sh</h2>
          <p>Honest comparison for anyone searching a skills.sh alternative or directory.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/how-to-install-claude-code-skills">
          <h2>Install Claude Code skills</h2>
          <p>Step-by-step install for Claude Code using the AIPM CLI and targets.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/how-to-install-cursor-skills">
          <h2>Install Cursor skills</h2>
          <p>Initialize a Cursor target and add a pinned skill version to your repo.</p>
        </Link>
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
          <h2>AI agent file support</h2>
          <p>Compare AGENTS.md, CLAUDE.md, Cursor rules, skills, and MCP in one verified table.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/components-of-an-ai-agent">
          <h2>Components of an AI agent</h2>
          <p>Understand the model, instructions, memory, tools, actions, and safety controls.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/cursor-rules-vs-agents-md">
          <h2>Cursor rules vs AGENTS.md</h2>
          <p>Choose the right shared or scoped instruction format for your coding agents.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/cursor-rules-vs-agent-skills">
          <h2>Cursor rules vs Agent Skills</h2>
          <p>Choose between instructions that always apply and a reusable task workflow.</p>
        </Link>
        <Link className={cards.guideCard} href="/guides/agents-md-vs-skill-md">
          <h2>AGENTS.md vs SKILL.md</h2>
          <p>Compare shared project instructions with a reusable Agent Skill.</p>
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
        <Link className={cards.guideCard} href="/research/state-of-agent-skills-2026">
          <h2>State of AI Agent Skills 2026</h2>
          <p>Explore current registry data, tool support, trust signals, and the open dataset.</p>
        </Link>
        <Link className={cards.guideCard} href="/faq">
          <h2>Troubleshoot</h2>
          <p>Fix registry, package, target, version, and install problems quickly.</p>
        </Link>
      </section>
    </main>
  );
}
