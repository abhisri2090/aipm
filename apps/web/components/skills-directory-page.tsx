import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryPageLinks } from "./directory-page-links";
import { directoryPageNumber, directoryPagePath } from "../lib/directory-pagination";
import {
  CLI_INSTALL_COMMAND,
  listPackagesPage,
  packagePath,
  SITE_URL,
} from "../lib/registry";
import { getFeaturedSkills, SKILLS_HUB_FEATURED } from "../lib/featured-skills";
import { cards, cn, shell } from "../lib/page-styles";
import { CodeBlock } from "./code-block";
import { DirectoryListTile } from "./directory-list-tile";
import { FeaturedSkillCards } from "./featured-skill-cards";
import { RegistrySearch } from "./registry-search";
import styles from "./skills-intro.module.css";

/** Beginner guides linked from the bottom of /skills, with plain one-line descriptions. */
const SKILL_GUIDES = [
  {
    href: "/guides/how-to-install-claude-code-skills",
    title: "How to install Claude skills",
    body: "Step by step for the Claude app, Claude Code, GitHub and the AIPM command-line tool.",
  },
  {
    href: "/guides/where-are-claude-skills-stored",
    title: "Where are Claude skills stored?",
    body: "The folders Claude Code, Cursor and Codex read skills from, on Mac, Linux and Windows.",
  },
  {
    href: "/guides/what-are-claude-skills",
    title: "What are Claude skills?",
    body: "How skills work in the Claude app and Claude Code, with simple examples.",
  },
  {
    href: "/guides/cursor-rules-vs-agent-skills",
    title: "Cursor rules vs skills",
    body: "Rules stay on while you work. Skills load only for one kind of task. Here is when to use each.",
  },
  {
    href: "/guides/agents-md-vs-skill-md",
    title: "AGENTS.md vs SKILL.md",
    body: "One file describes your project. The other teaches one task. See which one you need.",
  },
  {
    href: "/guides/share-claude-skills-with-team",
    title: "Share skills with your team",
    body: "Ways to give everyone on your team the same skills, and keep them up to date.",
  },
] as const;

export async function SkillsDirectoryPage({
  searchParams,
  canonicalPath,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    target?: string;
    sort?: string;
  }>;
  canonicalPath: "/registry" | "/skills";
}) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const query = params.q ?? "";
  const sort =
    params.sort === "popular" || params.sort === "title" || params.sort === "stars"
      ? params.sort
      : "newest";
  const filtered = Boolean(query || params.category || params.target || params.sort);
  const listingOptions = {
    query,
    limit: 20,
    category: params.category,
    target: params.target,
    sort,
  };
  const page = await listPackagesPage({
    ...listingOptions,
    offset: currentPage > 1 ? (currentPage - 1) * 20 : undefined,
  });
  const initialPackages = page.packages;
  const initialNextCursor = page.nextCursor;
  const initialNextOffset = page.nextOffset;
  // A registry error (429/5xx, timeout) renders the directory with a notice instead of a 500.
  const unavailable = page.failed;
  if (currentPage > 1 && !unavailable && initialPackages.length === 0) notFound();
  // The beginner intro and hand-picked skills show on the first, unfiltered page only,
  // so search results and later pages go straight to the listing.
  const showIntro = !filtered && currentPage === 1;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Claude Skills & Agent Skills Marketplace",
            description:
              "Browse Claude skills and agent skills for Claude Code, Cursor and Codex. Search by name, tool, or description.",
            url: `${SITE_URL}${filtered ? canonicalPath : directoryPagePath(canonicalPath, currentPage)}`,
            about: [
              "AI skills",
              "prompt packages",
              "Cursor skills",
              "Claude skills",
              "AI tool files",
            ],
            mainEntity: {
              "@type": "ItemList",
              itemListElement: initialPackages.map((pkg, index) => ({
                "@type": "ListItem",
                position: (currentPage - 1) * 20 + index + 1,
                name: `${pkg.name}@${pkg.version}`,
                url: `${SITE_URL}${packagePath(pkg.name, pkg.version)}`,
              })),
            },
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/registry?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <section className={cn(shell.pageHeader, shell.compactPageHeader)}>
        <p className={shell.eyebrow}>Claude skills &amp; agent skills</p>
        <h1>Claude skills and agent skills marketplace</h1>
        <p className={shell.lede}>
          Find ready-made skills that teach your AI assistant a new job. See what each one
          does, look at its files, then install it with one command.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/skills/claude">
            Claude skills
          </Link>
          <Link className={shell.button} href="/skills/cursor">
            Cursor skills
          </Link>
          <Link className={shell.button} href="/guides/how-to-install-claude-code-skills">
            How to install a skill
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/prompts">
            Browse prompts
          </Link>
        </div>
      </section>

      {showIntro ? (
        <>
          <section className={shell.panelSection} aria-labelledby="skills-intro-title">
            <h2 id="skills-intro-title">What is an agent skill?</h2>
            <div className={styles.introText}>
              <p>
                A skill is a set of written instructions that teaches an AI assistant how
                to do one job, like reviewing code or checking a website for SEO problems.
                Your assistant only opens it when the job comes up.
              </p>
              <p>
                Each skill is a folder with a file called <code>SKILL.md</code>. That is a
                plain text file the AI reads. Skills work in Claude, Claude Code, Cursor,
                Codex and other tools that follow the open Agent Skills standard. Learn
                more in{" "}
                <Link href="/guides/what-are-claude-skills">what are Claude skills?</Link>{" "}
                and{" "}
                <Link href="/guides/where-are-claude-skills-stored">
                  where Claude skills are stored
                </Link>
                .
              </p>
            </div>
          </section>
          <section className={shell.panelSection} aria-labelledby="skills-steps-title">
            <h2 id="skills-steps-title">Install a skill in 3 steps</h2>
            <div className={cn(cards.guideGrid, styles.stepGrid)}>
              <article className={cards.stepCard}>
                <div className={cards.stepHeading}>
                  <span className={cards.stepNumber}>1</span>
                  <h3>Pick a skill</h3>
                </div>
                <p>
                  Open a skill below. Read what it does and look through its files before
                  you add it.
                </p>
              </article>
              <article className={cards.stepCard}>
                <div className={cards.stepHeading}>
                  <span className={cards.stepNumber}>2</span>
                  <h3>Get the AIPM tool</h3>
                </div>
                <p>
                  AIPM&apos;s CLI is a small program you run by typing commands in a
                  terminal. Install it once (
                  <Link href="/install">other ways to install</Link>):
                </p>
                <CodeBlock
                  code={CLI_INSTALL_COMMAND}
                  trackingEvent="CLI Install Command Copied"
                  trackingProperties={{ method: "skills-intro" }}
                />
              </article>
              <article className={cards.stepCard}>
                <div className={cards.stepHeading}>
                  <span className={cards.stepNumber}>3</span>
                  <h3>Add the skill</h3>
                </div>
                <p>
                  Copy the install command from the skill&apos;s page and run it in your
                  project. AIPM saves the skill in the folder your AI tool reads. Need
                  more help? Read{" "}
                  <Link href="/guides/how-to-install-claude-code-skills">
                    how to install Claude skills
                  </Link>
                  .
                </p>
              </article>
            </div>
          </section>
          <FeaturedSkillCards
            id="featured-skills-title"
            title="Popular skills to start with"
            intro="A few well-liked skills, picked by installs and interest. Open one to see what it does and how to install it."
            skills={getFeaturedSkills(SKILLS_HUB_FEATURED)}
          />
        </>
      ) : null}

      <section className={shell.panelSection} aria-labelledby="registry-search-title">
        <div className={shell.sectionHeading}>
          <h2 id="registry-search-title">Browse all skills</h2>
        </div>
        <DirectoryListTile kind="skill" />
        {unavailable ? (
          <p className={shell.muted} role="status">
            Skill listings are temporarily unavailable. Try again in a minute, or see the{" "}
            <Link href="/best-claude-skills">best Claude skills</Link>.
          </p>
        ) : null}
        <RegistrySearch
          key={`${currentPage}:${query}:${params.category ?? ""}:${params.target ?? ""}:${sort}`}
          initialPackages={initialPackages}
          initialNextCursor={initialNextCursor}
          initialNextOffset={initialNextOffset}
          initialQuery={query}
          initialCategory={params.category}
          initialTarget={params.target}
          initialSort={sort}
        />
        {!filtered ? (
          <DirectoryPageLinks
            basePath={canonicalPath}
            currentPage={currentPage}
            hasNext={Boolean(initialNextCursor || initialNextOffset !== null)}
          />
        ) : null}
      </section>

      {showIntro ? (
        <section className={shell.panelSection} aria-labelledby="skill-guides-title">
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>Guides</p>
              <h2 id="skill-guides-title">New to skills? Start here</h2>
            </div>
            <Link className={shell.textLink} href="/guides">
              All guides
            </Link>
          </div>
          <div className={cn(cards.guideGrid, styles.flushGrid)}>
            {SKILL_GUIDES.map((guide) => (
              <Link className={cards.guideCard} href={guide.href} key={guide.href}>
                <h3>{guide.title}</h3>
                <p>{guide.body}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
