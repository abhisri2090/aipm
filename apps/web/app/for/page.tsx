import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";
import { shell, cards, docs, cn } from "../../lib/page-styles";
import { FOR_INDEX, FOR_TOOLS } from "../../lib/for-tool-landings";
import { ForToolCompareTable } from "./compare-table";

export const metadata = pageMetadata({
  title: FOR_INDEX.title,
  description: FOR_INDEX.description,
  path: "/for",
  keywords: [
    "skills for Claude Code",
    "skills for Cursor",
    "skills for Codex",
    "install agent skills",
    "AIPM targets",
  ],
});

export default function ForIndexPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: FOR_INDEX.title,
            description: FOR_INDEX.description,
            url: `${SITE_URL}/for`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: FOR_TOOLS.map((tool, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: tool.h1,
                url: `${SITE_URL}/for/${tool.slug}`,
              })),
            },
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Skills by tool</p>
        <h1>{FOR_INDEX.h1}</h1>
        <p className={shell.lede}>{FOR_INDEX.lede}</p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/skills">
            Browse skills
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/install">
            Install the CLI
          </Link>
        </div>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Claude Code vs Cursor vs Codex</h2>
          <p>
            Each tool loads skills from its own folder. AIPM writes that folder for you. Pick a column, then open the
            matching page for the install command.
          </p>
          <ForToolCompareTable />
        </section>
      </article>

      <section className={cards.targetGrid} aria-label="Skills for each tool">
        {FOR_TOOLS.map((tool) => (
          <article className={cards.targetCard} key={tool.slug}>
            <p className={shell.eyebrow}>{tool.target}</p>
            <h2>
              <Link href={`/for/${tool.slug}`}>{tool.h1}</Link>
            </h2>
            <p>{tool.definition}</p>
            <p>{tool.tldr}</p>
            <p>
              <Link href={`/for/${tool.slug}`}>Open {tool.name}</Link>
            </p>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
