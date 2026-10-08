import Link from "next/link";
import { notFound } from "next/navigation";
import { PROMPT_TOPIC_HUBS, getPromptTopicHub } from "../../../../lib/prompt-topics";
import {
  getGeneratedSeriesHub,
  getSeriesForTopicHub,
  getSnapshotPrompt,
  listSeriesWithHubs,
  listGeneratedSeriesHubs,
} from "../../../../lib/prompt-links";
import {
  midSentenceLabel,
  seriesHubDescription,
  seriesHubTitle,
  type PromptSeries,
} from "../../../../lib/prompt-series";
import { SITE_URL } from "../../../../lib/registry";
import { pageMetadata } from "../../../../lib/seo";
import { cn, shell, cards } from "../../../../lib/page-styles";

type PromptTopicRouteProps = {
  params: Promise<{ topic: string }>;
};

// Hub bodies come from the committed snapshot, so revalidate only matters if a
// future caller adds live data back to this route.
export const revalidate = 60;

// Curated topic hubs (lib/prompt-topics.ts) plus generated series hubs (lib/prompt-series.ts).
// Series hubs render from the committed prompt snapshot, so prerendering them makes no API calls.
export function generateStaticParams() {
  return [
    ...PROMPT_TOPIC_HUBS.map((hub) => ({ topic: hub.slug })),
    ...listGeneratedSeriesHubs().map((series) => ({ topic: series.slug })),
  ];
}

export async function generateMetadata({ params }: PromptTopicRouteProps) {
  const { topic } = await params;
  const hub = getPromptTopicHub(topic);
  if (!hub) {
    const series = getGeneratedSeriesHub(topic);
    if (series) {
      return pageMetadata({
        title: seriesHubTitle(series),
        description: seriesHubDescription(series),
        path: `/prompts/topics/${series.slug}`,
      });
    }
    return pageMetadata({ title: "Prompt topic not found", description: "This prompt topic hub was not found." });
  }
  return pageMetadata({
    title: hub.title,
    description: hub.description,
    path: `/prompts/topics/${hub.slug}`,
    keywords: [...hub.keywords],
  });
}

type HubPromptCard = {
  path: string;
  title: string;
  summary: string;
};

function loadHubPrompts(hub: NonNullable<ReturnType<typeof getPromptTopicHub>>): HubPromptCard[] {
  // Curated hubs use the committed snapshot, same as generated series hubs.
  // That keeps `/prompts/topics/*` renderable in CI when the registry API is
  // unreachable, and avoids dropping cards on a single failed fetch.
  return hub.promptSlugs.flatMap((slug) => {
    const record = getSnapshotPrompt(hub.publisher, slug);
    return record ? [{ path: record.path, title: record.title, summary: record.summary }] : [];
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Other series hubs in the same category (plain links, no prefetch fan-out). */
function SiblingSeries({ series, category }: { series: PromptSeries | null; category: string }) {
  const siblings = listSeriesWithHubs().filter(
    (item) => item.category === category && item.id !== series?.id,
  );
  if (!siblings.length) return null;
  return (
    <section className={shell.panelSection} aria-labelledby="sibling-series-title">
      <div className={shell.sectionHeading}>
        <div>
          <p className={shell.eyebrow}>{category} prompts</p>
          <h2 id="sibling-series-title">More {category.toLowerCase()} prompt series</h2>
        </div>
      </div>
      <div className={cards.templateGrid}>
        {siblings.map((item) => (
          <a className={cards.templateCard} href={item.hubPath ?? "/prompts"} key={item.id}>
            <h3>{capitalize(item.label)}</h3>
            <p>
              {item.members.length} prompts · {item.blurb}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

function SeriesHubPage({ series }: { series: PromptSeries }) {
  const path = `/prompts/topics/${series.slug}`;
  const canonicalUrl = `${SITE_URL}${path}`;
  const title = seriesHubTitle(series);
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
                name: title,
                description: seriesHubDescription(series),
                url: canonicalUrl,
                isPartOf: { "@type": "WebSite", name: "AIPM Registry", url: SITE_URL },
                mainEntity: {
                  "@type": "ItemList",
                  numberOfItems: series.members.length,
                  itemListElement: series.members.map((prompt, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: prompt.title,
                    url: `${SITE_URL}${prompt.path}`,
                  })),
                },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_URL}/prompts` },
                  { "@type": "ListItem", position: 2, name: capitalize(series.label), item: canonicalUrl },
                ],
              },
            ],
          }),
        }}
      />

      <section className={cn(shell.pageHeader, shell.compactPageHeader)}>
        <p className={shell.eyebrow}>{series.category} prompt series</p>
        <h1>{capitalize(series.label)}</h1>
        <p className={shell.lede}>{series.blurb}</p>
        <p>
          {series.members.length} prompts in this series. Each prompt page shows the full prompt, the
          variables to fill in, the models it was tested with, and example output.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/prompts">
            Browse all prompts
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/prompts/new">
            List a prompt
          </Link>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="series-prompts-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>All prompts in this series</p>
            <h2 id="series-prompts-title">
              {series.members.length} {midSentenceLabel(series.label)}
            </h2>
          </div>
        </div>
        <div className={cards.results}>
          {series.members.map((prompt) => (
            <article className={cn(shell.panel, cards.stepCard)} key={prompt.path}>
              <h3>
                <a href={prompt.path}>{prompt.title}</a>
              </h3>
              <p>{prompt.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <SiblingSeries series={series} category={series.category} />
    </main>
  );
}

export default async function PromptTopicHubPage({ params }: PromptTopicRouteProps) {
  const { topic } = await params;
  const hub = getPromptTopicHub(topic);
  if (!hub) {
    const series = getGeneratedSeriesHub(topic);
    if (series) return <SeriesHubPage series={series} />;
    notFound();
  }

  const prompts = loadHubPrompts(hub);
  const canonicalUrl = `${SITE_URL}/prompts/topics/${hub.slug}`;
  const otherHubs = PROMPT_TOPIC_HUBS.filter((item) => item.slug !== hub.slug);
  // Curated hubs that double as a series hub list the rest of the series from the snapshot.
  const hubSeries = getSeriesForTopicHub(hub.slug) ?? null;
  const curatedPaths = new Set(hub.promptSlugs.map((slug) => `/prompts/${hub.publisher}/${slug}`));
  const moreInSeries = hubSeries ? hubSeries.members.filter((member) => !curatedPaths.has(member.path)) : [];

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
                    url: `${SITE_URL}${prompt.path}`,
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
              <article className={cn(shell.panel, cards.stepCard)} key={prompt.path}>
                <h3>
                  <Link href={prompt.path}>{prompt.title}</Link>
                </h3>
                <p>{prompt.summary}</p>
                <p className={shell.muted}>
                  <Link href={prompt.path}>{prompt.path}</Link>
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

      {moreInSeries.length > 0 ? (
        <section className={shell.panelSection} aria-labelledby="topic-series-more-title">
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>Full series</p>
              <h2 id="topic-series-more-title">More {midSentenceLabel(hubSeries?.label ?? "prompts")}</h2>
            </div>
          </div>
          <div className={cards.results}>
            {moreInSeries.map((prompt) => (
              <article className={cn(shell.panel, cards.stepCard)} key={prompt.path}>
                <h3>
                  <a href={prompt.path}>{prompt.title}</a>
                </h3>
                <p>{prompt.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {hubSeries ? <SiblingSeries series={hubSeries} category={hubSeries.category} /> : null}

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
