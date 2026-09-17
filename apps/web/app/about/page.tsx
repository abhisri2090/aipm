import Link from "next/link";
import { shell, cards, docs, cn } from "../../lib/page-styles";
import { pageMetadata } from "../../lib/seo";
import { DocLayout } from "../../components/doc-layout";
import { SITE_URL } from "../../lib/registry";

export const metadata = pageMetadata({
  title: "About AIPM - AI Package Manager for Skills and Prompts",
  description: "AIPM helps teams install and publish AI skills, prompts, and tool files.",
  path: "/about",
  keywords: ["about AIPM", "AI package manager", "AI skill registry", "AIPM mission"],
});

export default function AboutPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About AIPM",
            description: "AIPM helps teams install and publish AI skills, prompts, and tool files.",
            url: `${SITE_URL}/about`,
            mainEntity: {
              "@type": "Organization",
              name: "AIPM",
              url: SITE_URL,
              description: "A registry and CLI for installing reusable AI skills, prompts, rules, MCP setup, and tool files into supported assistants.",
            },
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>About</p>
        <h1>AIPM manages AI skills for projects.</h1>
        <p className={shell.lede}>
          Many projects now depend on prompts, skill files, editor rules, and AI tool setup. AIPM
          makes those files searchable, versioned, and installable with a clear name and version number.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/install">
            Install AIPM
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/skills">
            Browse skills
          </Link>
        </div>
      </section>

      <section className={cards.guideGrid}>
        <article className={cards.guideCard}>
          <h2>Reusable setup</h2>
          <p>Install the same skill into any project that needs it. Stop copying prompts by hand across repos.</p>
        </article>
        <article className={cards.guideCard}>
          <h2>Clear changes</h2>
          <p>Publish updates as new versions so teams can review changes before adopting them.</p>
        </article>
        <article className={cards.guideCard}>
          <h2>Tool-specific install</h2>
          <p>Install into Cursor, Claude, and more tools as AIPM grows. Each target gets the right file format.</p>
        </article>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>The problem AIPM solves</h2>
          <p>
            Software teams have npm for code packages, Terraform for infrastructure, and Docker for containers.
            But AI setup has no standard. Teams copy prompts from chat, paste rules by hand, and forget which version is current.
            That works for one person, but it breaks when a team grows or when projects multiply.
          </p>
          <p>
            AIPM gives AI skills the same install workflow that code packages have. You find a skill in the registry,
            run an install command, and AIPM writes the right files into your project. The skill has a name, a version,
            a publisher, and a source link so you can review it before trusting it.
          </p>
        </section>

        <section>
          <h2>What AIPM is not</h2>
          <p>
            AIPM is not an AI model, chat app, or prompt marketplace. It does not run your AI tools or host your conversations.
            It manages the files and instructions your AI tools use inside a project. The skills are project files that live
            with your code and can be reviewed like any other configuration.
          </p>
        </section>

        <section>
          <h2>Who should use AIPM</h2>
          <p>
            Developers and teams who use AI tools in more than one project should use AIPM. It helps keep setup repeatable.
            Publishers who want to share workflows can create packages and distribute them through the registry.
            Organizations that want consistent AI behavior across projects can install the same skills everywhere.
          </p>
        </section>

        <section>
          <h2>How to get started</h2>
          <p>
            Read the <Link href="/install">install guide</Link> to set up the CLI. Then follow the{" "}
            <Link href="/use">use guide</Link> to install your first skill. If you want to share your own workflow,
            read the <Link href="/publish/guide">publishing guide</Link>.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
