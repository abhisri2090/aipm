import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrompt, promptPath, type PromptSummary } from "../../../../lib/prompts";
import { PROMPT_TOPIC_HUBS, getPromptTopicHub } from "../../../../lib/prompt-topics";
import { SITE_URL } from "../../../../lib/registry";
import { pageMetadata } from "../../../../lib/seo";
import { cn, shell, cards } from "../../../../lib/page-styles";

type PromptTopicRouteProps = {
  params: Promise<{ topic: string }>;
};

// ISR (matches getPrompt's fetch revalidate): hubs are prerendered and a
// failed revalidation keeps the last good page.
export const revalidate = 60;

export function generateStaticParams() {
  return PROMPT_TOPIC_HUBS.map((hub) => ({ topic: hub.slug }));
}

export async function generateMetadata({ params }: PromptTopicRouteProps) {
  const { topic } = await params;
  const hub = getPromptTopicHub(topic);
  if (!hub) {
    return pageMetadata({ title: "Prompt topic not found", description: "This prompt topic hub was not found." });
  }
  return pageMetadata({
    title: hub.title,
    description: hub.description,
    path: `/prompts/topics/${hub.slug}`,
    keywords: [...hub.keywords],
  });
}

async function loadHubPrompts(hub: NonNullable<ReturnType<typeof getPromptTopicHub>>): Promise<PromptSummary[]> {
  const failures: unknown[] = [];
  const results = await Promise.all(
    hub.promptSlugs.map((slug) =>
      getPrompt(hub.publisher, slug).catch((error: unknown) => {
        console.error(`[prompt-hub] ${hub.publisher}/${slug}:`, error);
        failures.push(error);
        return null;
      }),
    ),
  );
  // At runtime the hub was already prerendered, so throwing makes ISR keep the
  // last good page instead of caching a hub with missing cards. During the
  // build there is no previous page, so degrade (drop failed cards; the page
  // renders a fallback when none load) rather than failing the deploy.
  if (failures.length > 0 && process.env.NEXT_PHASE !== "phase-production-build") {
    throw failures[0];
  }
  return results.filter((prompt): prompt is NonNullable<typeof prompt> => Boolean(prompt));
}

export default async function PromptTopicHubPage({ params }: PromptTopicRouteProps) {
  const { topic } = await params;
  const hub = getPromptTopicHub(topic);
  if (!hub) notFound();

  const prompts = await loadHubPrompts(hub);
  const canonicalUrl = `${SITE_URL}/prompts/topics/${hub.slug}`;
  const otherHubs = PROMPT_TOPIC_HUBS.filter((item) => item.slug !== hub.slug);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                name: hub.title,
                description: hub.description,
                url: canonicalUrl,
                about: hub.keywords,
                isPartOf: {
                  "@type": "WebSite",
                  name: "AIPM Registry",
                  url: SITE_URL,
                },
                mainEntity: {
                  "@type": "ItemList",
                  itemListElement: prompts.map((prompt, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: prompt.title,
                    url: `${SITE_URL}${promptPath(prompt)}`,
                  })),
                },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Prompts",
                    item: `${SITE_URL}/prompts`,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: hub.title,
                    item: canonicalUrl,
                  },
                ],
              },
            ],
          }),
        }}
      />

      <section className={cn(shell.pageHeader, shell.compactPageHeader)}>
        <p className={shell.eyebrow}>Prompt topic</p>
        <h1>{hub.h1}</h1>
        <p className={shell.lede}>{hub.description}</p>
        <p>{hub.intro}</p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/prompts">
            Browse all prompts
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/prompts/new">
            List a prompt
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="topic-prompts-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Curated prompts</p>
            <h2 id="topic-prompts-title">Top prompts in this topic</h2>
          </div>
        </div>
        {prompts.length > 0 ? (
          <div className={cards.results}>
            {prompts.map((prompt) => (
              <article className={cn(shell.panel, cards.stepCard)} key={prompt.id}>
                <h3>
                  <Link href={promptPath(prompt)}>{prompt.title}</Link>
                </h3>
                <p>{prompt.summary}</p>
                <p className={shell.muted}>
                  <Link href={promptPath(prompt)}>/prompts/{prompt.publisher.scope}/{prompt.slug}</Link>
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className={shell.muted}>
            Prompt listings for this topic are temporarily unavailable. Browse the{" "}
            <Link href="/prompts">full prompt directory</Link> instead.
          </p>
        )}
      </section>

      {otherHubs.length > 0 ? (
        <section className={shell.panelSection} aria-labelledby="other-topics-title">
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>More topics</p>
              <h2 id="other-topics-title">Other prompt topic hubs</h2>
            </div>
          </div>
          <div className={cards.templateGrid}>
            {otherHubs.map((item) => (
              <Link className={cards.templateCard} href={`/prompts/topics/${item.slug}`} key={item.slug}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
