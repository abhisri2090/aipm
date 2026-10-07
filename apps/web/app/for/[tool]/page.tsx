import Link from "next/link";
import { notFound } from "next/navigation";
import { DocLayout } from "../../../components/doc-layout";
import { CodeBlock } from "../../../components/code-block";
import { SITE_URL } from "../../../lib/registry";
import { pageMetadata } from "../../../lib/seo";
import { shell, cards, docs, cn } from "../../../lib/page-styles";
import {
  AIPM_DIFFERENCES,
  FOR_TOOLS,
  forToolPageLinks,
  getForToolLanding,
  isForToolSlug,
} from "../../../lib/for-tool-landings";
import { ForToolCompareTable } from "../compare-table";

type ForToolRouteProps = {
  params: Promise<{ tool: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return FOR_TOOLS.map((tool) => ({ tool: tool.slug }));
}

export async function generateMetadata({ params }: ForToolRouteProps) {
  const { tool: slug } = await params;
  const tool = getForToolLanding(slug);
  if (!tool) {
    return pageMetadata({
      title: "Skills by tool",
      description: "Skills for Claude Code, Cursor, and Codex.",
      path: "/for",
    });
  }
  return pageMetadata({
    title: tool.title,
    description: tool.description,
    path: `/for/${tool.slug}`,
    keywords: tool.keywords,
  });
}

export default async function ForToolPage({ params }: ForToolRouteProps) {
  const { tool: slug } = await params;
  if (!isForToolSlug(slug)) notFound();
  const tool = getForToolLanding(slug);
  if (!tool) notFound();

  const links = forToolPageLinks(tool);
  const pageUrl = `${SITE_URL}/for/${tool.slug}`;

  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            name: tool.title,
            description: tool.description,
            url: pageUrl,
            mainEntity: tool.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Skills by tool</p>
        <h1>{tool.h1}</h1>
        <p className={shell.lede}>{tool.definition}</p>
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
          <h2>Short answer</h2>
          <p>{tool.tldr}</p>
        </section>

        <section>
          <h2>Claude Code vs Cursor vs Codex</h2>
          <p>
            This page is the {tool.name} column. The other columns are here so you can see the path and the install
            flag before you pick a tool.
          </p>
          <ForToolCompareTable />
        </section>

        <section>
          <h2>Install into {tool.name}</h2>
          <p>
            AIPM writes <code>{tool.skillPath}</code>. Run this from the project folder, then read the files it adds.
          </p>
          <CodeBlock code={tool.installCommand} />
        </section>

        <section>
          <h2>What AIPM does differently</h2>
          <ul>
            {AIPM_DIFFERENCES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Keep going</h2>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <section className={cards.faqList} aria-labelledby="for-faq-title">
        <h2 id="for-faq-title">FAQ</h2>
        {tool.faqs.map((faq) => (
          <article key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
