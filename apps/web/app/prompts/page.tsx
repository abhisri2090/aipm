import { PromptDirectory } from "../../components/prompt-directory";
import { DirectoryListTile } from "../../components/directory-list-tile";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listPromptsPage } from "../../lib/prompts";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";
import { cn, shell } from "../../lib/page-styles";
import styles from "./prompts.module.css";

const directoryMetadata = {
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
};

const PAGE_SIZE = 40;

type PromptSearchParams = {
  page?: string;
  tag?: string;
  q?: string;
  category?: string;
  output?: string;
};

function pageNumber(value: string | undefined): number {
  if (value === undefined) return 1;
  if (!/^[1-9]\d*$/.test(value)) notFound();
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > Math.floor(Number.MAX_SAFE_INTEGER / PAGE_SIZE)) notFound();
  return number;
}

function directoryPath(page: number): string {
  return page === 1 ? "/prompts" : `/prompts?page=${page}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<PromptSearchParams>;
}) {
  const params = await searchParams;
  const number = pageNumber(params.page);
  const filtered = Boolean(params.tag || params.q || params.category || params.output);
  return {
    ...pageMetadata({ ...directoryMetadata, path: filtered ? "/prompts" : directoryPath(number) }),
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<PromptSearchParams>;
}) {
  const params = await searchParams;
  const currentPage = pageNumber(params.page);
  const initialQuery = params.tag ?? params.q ?? "";
  const filtered = Boolean(initialQuery || params.category || params.output);
  const page = await listPromptsPage({
    query: initialQuery,
    limit: PAGE_SIZE,
    offset: currentPage > 1 ? (currentPage - 1) * PAGE_SIZE : undefined,
    category: params.category,
    output: params.output,
    sort: "newest",
    throwOnError: true,
  });
  if (currentPage > 1 && page.prompts.length === 0) notFound();
  const pageCount = Math.ceil(page.total / PAGE_SIZE);
  const outputCount = new Set(page.prompts.flatMap((prompt) => prompt.outputTypes)).size;
  const categoryCount = new Set(page.prompts.map((prompt) => prompt.category)).size;

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
            url: `${SITE_URL}${filtered ? "/prompts" : directoryPath(currentPage)}`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: page.prompts.map((prompt, index) => ({
                "@type": "ListItem",
                position: (currentPage - 1) * PAGE_SIZE + index + 1,
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
          <p>
            Need reusable instructions with versions and install commands? Learn how an{" "}
            <Link href="/guides/ai-package-manager">AI package manager</Link> works.
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
            <dd>{page.total}</dd>
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
          key={`${currentPage}:${initialQuery}:${params.category ?? ""}:${params.output ?? ""}`}
          initialPrompts={page.prompts}
          initialNextCursor={page.nextCursor}
          initialNextOffset={page.nextOffset}
          initialTotal={page.total}
          initialQuery={initialQuery}
          initialCategory={params.category}
          initialOutput={params.output}
        />
        {!filtered && pageCount > 1 ? (
          <nav className={styles.pagination} aria-label="Prompt pages">
            {currentPage > 1 ? (
              <Link href={directoryPath(currentPage - 1)}>Previous page</Link>
            ) : null}
            <span>Page {currentPage} of {pageCount}</span>
            {currentPage < pageCount ? (
              <Link href={directoryPath(currentPage + 1)}>Next page</Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
