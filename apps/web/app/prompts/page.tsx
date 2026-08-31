import { PromptDirectory } from "../../components/prompt-directory";
import { DirectoryListTile } from "../../components/directory-list-tile";
import Link from "next/link";
import { listPrompts } from "../../lib/prompts";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";
import { cn, shell } from "../../lib/page-styles";
import styles from "./prompts.module.css";

export const metadata = pageMetadata({
  title: "AI Prompt Directory",
  description:
    "Browse useful AI prompts by category, output type, input, and compatible model. See variables and example outputs before you copy.",
  path: "/prompts",
  keywords: [
    "AI prompt directory",
    "best AI prompts",
    "image prompts",
    "work prompts",
    "productivity prompts",
  ],
});

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; category?: string; output?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params.tag ?? params.q ?? "";
  const prompts = await listPrompts(initialQuery);
  const outputCount = new Set(prompts.flatMap((prompt) => prompt.outputTypes)).size;
  const categoryCount = new Set(prompts.map((prompt) => prompt.category)).size;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AIPM AI Prompt Directory",
            description:
              "Curated AI prompts with clear inputs, output types, examples, and compatibility.",
            url: `${SITE_URL}/prompts`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: prompts.map((prompt, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: prompt.title,
                url: `${SITE_URL}${prompt.path}`,
              })),
            },
          }),
        }}
      />
      <section className={cn(shell.pageHeader, styles.hero)}>
        <div>
          <p className={shell.eyebrow}>Prompt directory</p>
          <h1>Start with a prompt that already works.</h1>
          <p className={shell.lede}>
            Find practical prompts for work, creativity, photos, travel, and more. Every
            prompt shows what you need to provide, what it produces, and which AI tools it
            works with.
          </p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/prompts/new">
              List a prompt
            </Link>
          </div>
        </div>
        <dl className={styles.heroStats} aria-label="Prompt directory overview">
          <div>
            <dt>Prompts</dt>
            <dd>{prompts.length}</dd>
          </div>
          <div>
            <dt>Categories</dt>
            <dd>{categoryCount}</dd>
          </div>
          <div>
            <dt>Output types</dt>
            <dd>{outputCount}</dd>
          </div>
        </dl>
      </section>

      <section className={shell.panelSection} aria-labelledby="browse-prompts-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Explore</p>
            <h2 id="browse-prompts-title">Browse all prompts</h2>
          </div>
        </div>
        <DirectoryListTile kind="prompt" />
        <PromptDirectory
          initialPrompts={prompts}
          initialQuery={initialQuery}
          initialCategory={params.category}
          initialOutput={params.output}
        />
      </section>
    </main>
  );
}
