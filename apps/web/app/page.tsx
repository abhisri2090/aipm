import { shell, cards, home, cn } from "../lib/page-styles";
import Link from "next/link";
import { CodeBlock } from "../components/code-block";
import { RegistrySearch } from "../components/registry-search";
import { CLI_INSTALL_OPTIONS } from "../lib/registry";
import { pageMetadata } from "../lib/seo";

const PACKAGE_TAGS = [
  { label: "Skills", status: "done" },
  { label: "Rules", status: "pending" },
  { label: "Prompts", status: "pending" },
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
              src="/author.png"
              width={88}
            />
            <div className={home.heroAuthorMeta}>
              <p className={home.heroAuthorName}>Your Name</p>
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
        <div className={home.heroTagRow} aria-label="Package types AIPM manages">
          {PACKAGE_TAGS.map((tag) => (
            <span className={home.heroTag} key={tag.label}>
              <TagStatusIcon status={tag.status} />
              {tag.label}
            </span>
          ))}
        </div>
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
            <div className={cards.stepHeading}>
              <span className={cards.stepNumber}>1</span>
              <h3>Install the CLI</h3>
            </div>
            <CodeBlock code={CLI_INSTALL_OPTIONS[0].code} />
            <p className={cards.stepInstallMethods}>
              {"Other install methods ->"} {CLI_INSTALL_OPTIONS.map((option, index) => index == 0 ? null : (
                <span key={option.slug}>
                  {index > 1 ? " · " : null}
                  <Link className={shell.textLink} href={`/commands#${option.slug}`}>
                    {option.label.replace('via ', '')}
                  </Link>
                </span>
              ))}
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
