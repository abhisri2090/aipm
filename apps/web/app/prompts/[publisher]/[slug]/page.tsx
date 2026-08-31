import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PromptCopyButton } from "../../../../components/prompt-copy-button";
import { PromptRunner } from "../../../../components/prompt-runner";
import {
  displayPromptType,
  formatCopyCount,
  formatPromptDate,
  getPrompt,
} from "../../../../lib/prompts";
import { SITE_URL } from "../../../../lib/registry";
import { cn, shell } from "../../../../lib/page-styles";
import styles from "../../[slug]/prompt-detail.module.css";

type PromptPageProps = {
  params: Promise<{ publisher: string; slug: string }>;
};

export async function generateMetadata({ params }: PromptPageProps): Promise<Metadata> {
  const { publisher, slug } = await params;
  const prompt = await getPrompt(publisher, slug);
  if (!prompt) return { title: "Prompt not found" };

  const canonical = `${SITE_URL}${prompt.path}`;
  const sampleImage = prompt.sampleImageUrl
    ? `${SITE_URL}${prompt.sampleImageUrl}`
    : null;
  return {
    title: prompt.title,
    description: prompt.summary,
    alternates: { canonical },
    openGraph: {
      title: prompt.title,
      description: prompt.summary,
      url: canonical,
      type: "article",
      images: sampleImage
        ? [
            {
              url: sampleImage,
              alt: prompt.sampleImageAlt ?? `Sample output for ${prompt.title}`,
            },
          ]
        : [],
    },
    twitter: {
      card: sampleImage ? "summary_large_image" : "summary",
      title: prompt.title,
      description: prompt.summary,
      images: sampleImage ? [sampleImage] : [],
    },
  };
}

function PublisherAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  return avatarUrl ? (
    <img alt="" className={styles.publisherAvatar} src={avatarUrl} />
  ) : (
    <span aria-hidden="true" className={styles.publisherAvatar}>
      {name.charAt(0).toUpperCase() || "A"}
    </span>
  );
}

export default async function PromptDetailPage({ params }: PromptPageProps) {
  const { publisher, slug } = await params;
  const prompt = await getPrompt(publisher, slug);
  if (!prompt) notFound();

  const publisherName =
    prompt.publisher.org?.name ??
    prompt.publisher.user.name ??
    prompt.publisher.user.username;
  const trackingPath = `/v1/prompts/${encodeURIComponent(prompt.publisher.scope)}/${encodeURIComponent(prompt.slug)}`;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: prompt.title,
            description: prompt.summary,
            creator: {
              "@type":
                prompt.publisher.kind === "organization" ? "Organization" : "Person",
              name: publisherName,
            },
            datePublished: prompt.publishedAt,
            dateModified: prompt.updatedAt,
            keywords: prompt.tags.join(", "),
            url: `${SITE_URL}${prompt.path}`,
            image: prompt.sampleImageUrl
              ? `${SITE_URL}${prompt.sampleImageUrl}`
              : undefined,
            isPartOf: {
              "@type": "CollectionPage",
              name: "AIPM AI Prompt Directory",
              url: `${SITE_URL}/prompts`,
            },
          }),
        }}
      />

      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/prompts">Prompts</Link>
        <span aria-hidden="true">/</span>
        <span>@{prompt.publisher.scope}</span>
      </nav>

      <section className={cn(shell.pageHeader, styles.detailHeader)}>
        <div>
          <div className={styles.headerBadges}>
            <span>{prompt.category}</span>
            {prompt.outputTypes.map((output) => (
              <span key={output}>{displayPromptType(output)} output</span>
            ))}
            <span>{displayPromptType(prompt.effort)}</span>
          </div>
          <h1>{prompt.title}</h1>
          <p className={shell.lede}>{prompt.summary}</p>
          <p className={styles.byline}>
            Published by {publisherName} · Updated {formatPromptDate(prompt.updatedAt)} ·{" "}
            {formatCopyCount(prompt.copyCount)}
          </p>
        </div>
      </section>

      <div className={styles.detailLayout}>
        <div className={styles.mainColumn}>
          <section className={styles.contentPanel} aria-labelledby="prompt-text-title">
            <div className={styles.panelHeading}>
              <div>
                <p className={shell.eyebrow}>Ready to use</p>
                <h2 id="prompt-text-title">Prompt</h2>
              </div>
              <PromptCopyButton
                label="Copy prompt"
                trackingPath={trackingPath}
                value={prompt.promptText}
              />
            </div>
            <pre className={styles.promptText}>{prompt.promptText}</pre>
          </section>

          <PromptRunner
            promptText={prompt.promptText}
            trackingPath={trackingPath}
            variables={prompt.variables}
          />

          {prompt.sampleImageUrl ? (
            <section className={styles.contentPanel} aria-labelledby="sample-image-title">
              <p className={shell.eyebrow}>Published example</p>
              <h2 id="sample-image-title">Sample image output</h2>
              <img
                alt={prompt.sampleImageAlt ?? `Sample output for ${prompt.title}`}
                className={styles.sampleImage}
                src={prompt.sampleImageUrl}
              />
              {prompt.exampleOutput ? (
                <p className={styles.sampleCaption}>{prompt.exampleOutput}</p>
              ) : null}
            </section>
          ) : prompt.exampleOutput ? (
            <section
              className={styles.contentPanel}
              aria-labelledby="example-output-title"
            >
              <p className={shell.eyebrow}>What to expect</p>
              <h2 id="example-output-title">Example output</h2>
              <div className={styles.exampleOutput}>{prompt.exampleOutput}</div>
            </section>
          ) : null}

          {prompt.exampleInput ? (
            <section
              className={styles.contentPanel}
              aria-labelledby="example-input-title"
            >
              <p className={shell.eyebrow}>Example context</p>
              <h2 id="example-input-title">Example input</h2>
              <div className={styles.exampleOutput}>{prompt.exampleInput}</div>
            </section>
          ) : null}

        </div>

        <aside className={styles.sideColumn} aria-label="Prompt details">
          <section className={styles.publisherPanel}>
            <PublisherAvatar
              avatarUrl={prompt.publisher.user.avatarUrl}
              name={publisherName}
            />
            <div>
              <p className={shell.eyebrow}>Publisher</p>
              <h2>{publisherName}</h2>
              <p>
                @{prompt.publisher.scope}
                {prompt.publisher.user.verified ? " · Verified publisher" : ""}
              </p>
            </div>
          </section>

          <section className={styles.factsPanel}>
            <h2>At a glance</h2>
            <dl>
              <div>
                <dt>Tested with</dt>
                <dd>{prompt.testedModels.join(", ")}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>{prompt.outputTypes.map(displayPromptType).join(", ")}</dd>
              </div>
              <div>
                <dt>Input</dt>
                <dd>{prompt.inputTypes.map(displayPromptType).join(", ")}</dd>
              </div>
              <div>
                <dt>Effort</dt>
                <dd>{displayPromptType(prompt.effort)}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{prompt.language}</dd>
              </div>
              <div>
                <dt>License</dt>
                <dd>{prompt.license}</dd>
              </div>
            </dl>
          </section>

          {prompt.variables.length ? (
            <section className={styles.factsPanel}>
              <h2>Variables</h2>
              <div className={styles.variables}>
                {prompt.variables.map((variable) => (
                  <article key={variable.name}>
                    <h3>
                      {`{{${variable.name}}}`}
                      {variable.required ? <span>Required</span> : null}
                    </h3>
                    <p>{variable.description}</p>
                    <small>Example: {variable.example}</small>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.factsPanel}>
            <h2>Tags</h2>
            <div className={styles.tags}>
              {prompt.tags.map((tag) => (
                <Link href={`/prompts?tag=${encodeURIComponent(tag)}`} key={tag}>
                  #{tag}
                </Link>
              ))}
            </div>
            {prompt.sourceUrl ? (
              <p className={styles.sourceLink}>
                <a href={prompt.sourceUrl} rel="noreferrer" target="_blank">
                  View source
                </a>
              </p>
            ) : null}
          </section>

          <section className={styles.contentPanel} aria-labelledby="use-prompt-title">
            <p className={shell.eyebrow}>Use responsibly</p>
            <h2 id="use-prompt-title">How to use it</h2>
            <ol className={styles.steps}>
              <li>
                <span>1</span>
                <div>
                  <strong>Fill in the variables</strong>
                  <p>Replace every double-braced placeholder with your own context.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Add the required inputs</strong>
                  <p>
                    Provide{" "}
                    {prompt.inputTypes.map(displayPromptType).join(" and ").toLowerCase()}{" "}
                    as requested.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Copy and use the prompt</strong>
                  <p>Copy the finished prompt and paste it into your AI tool.</p>
                </div>
              </li>
            </ol>
            {prompt.usageNotes ? (
              <p className={styles.usageNotes}>{prompt.usageNotes}</p>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
