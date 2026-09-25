import { PromptDirectory } from "../../components/prompt-directory";
import { DirectoryListTile } from "../../components/directory-list-tile";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listPromptsPage } from "../../lib/prompts";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata, paginatedPageMetadata } from "../../lib/seo";
import { cn, shell } from "../../lib/page-styles";
import styles from "./prompts.module.css";

const directoryMetadata = {
  title: "AI Prompt Directory: Gemini, Claude & ChatGPT Prompts",
  description:
    "A free AI prompt library of tested Gemini, Claude, and ChatGPT prompts for work, code, research, and photos. See variables and example outputs before you copy.",
  keywords: [
    "AI prompt directory",
    "prompt library",
    "Gemini prompts",
    "Claude prompts",
    "Nano Banana prompts",
    "ChatGPT prompts",
    "best AI prompts",
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
  const currentPage = pageNumber(params.page);
  const filtered = Boolean(params.tag || params.q || params.category || params.output);
  if (filtered) {
    return {
      ...pageMetadata({ ...directoryMetadata, path: "/prompts" }),
      robots: { index: false, follow: true },
    };
  }
  return paginatedPageMetadata({
    ...directoryMetadata,
    path: directoryPath(currentPage),
    page: currentPage,
  });
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
  });
  // A registry error (429/5xx, timeout) must not turn this page into a 500: render the static
  // directory copy with a notice instead. Only a successful empty read beyond page 1 is a 404.
  const unavailable = page.failed;
  if (currentPage > 1 && !unavailable && page.prompts.length === 0) notFound();
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
          <h1>Gemini, Claude, and ChatGPT prompts that already work.</h1>
          <p className={shell.lede}>
            A prompt library for work, code, research, photos, and more. Every prompt shows
            what you need to provide, what it produces, and which AI models it was tested with.
          </p>
          <p>
            Need reusable instructions with versions and install commands? Browse{" "}
            <Link href="/skills/claude">Claude Code skills</Link>,{" "}
            <Link href="/skills/cursor">Cursor skills</Link>, or the full{" "}
            <Link href="/skills">agent skills registry</Link>—and see how an{" "}
            <Link href="/guides/ai-package-manager">AI package manager</Link> differs from copy-paste.
          </p>
          <p>
            Browse by model: <Link href="/prompts/topics/gemini-prompts">Gemini prompts</Link>,{" "}
            <Link href="/prompts/topics/claude-prompts">Claude prompts</Link>, and{" "}
            <Link href="/prompts/topics/nano-banana-prompts">Nano Banana photo prompts</Link>. Or
            start with a use case:{" "}
            <Link href="/prompts/topics/linkedin-headshots">LinkedIn headshot prompts</Link> or{" "}
            <Link href="/prompts/topics/product-photography">product photography prompts</Link>.
          </p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/prompts/new">
              List a prompt
            </Link>
            <Link className={cn(shell.button, shell.secondary)} href="/prompts/topics/gemini-prompts">
              Gemini prompts
            </Link>
            <Link className={cn(shell.button, shell.secondary)} href="/prompts/topics/claude-prompts">
              Claude prompts
            </Link>
            <Link className={cn(shell.button, shell.secondary)} href="/prompts/topics/nano-banana-prompts">
              Nano Banana
            </Link>
          </div>
        </div>
        <dl className={styles.heroStats} aria-label="Prompt directory overview">
          <div>
            <dt>Prompts</dt>
            <dd>{unavailable ? "—" : page.total}</dd>
          </div>
          <div>
            <dt>Categories</dt>
            <dd>{unavailable ? "—" : categoryCount}</dd>
          </div>
          <div>
            <dt>Output types</dt>
            <dd>{unavailable ? "—" : outputCount}</dd>
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
        {unavailable ? (
          <p className={shell.muted} role="status">
            Prompt listings are temporarily unavailable. Try again in a minute, or start with the{" "}
            <Link href="/prompts/topics/gemini-prompts">Gemini</Link>,{" "}
            <Link href="/prompts/topics/claude-prompts">Claude</Link>, or{" "}
            <Link href="/prompts/topics/nano-banana-prompts">Nano Banana</Link> prompt hubs.
          </p>
        ) : null}
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
