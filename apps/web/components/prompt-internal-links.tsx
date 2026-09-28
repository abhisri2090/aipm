import {
  midSentenceLabel,
  type PromptInternalLinks as PromptInternalLinksData,
} from "../lib/prompt-series";
import { cn, shell } from "../lib/page-styles";
import styles from "../app/prompts/[slug]/prompt-detail.module.css";

/**
 * "More in this series" and "Related prompts" for a prompt detail page.
 * Server-rendered plain <a href> links (no client JS, no Next prefetch) so crawlers follow them
 * and visitors do not trigger background fetches of a dozen prompt pages.
 */
export function PromptInternalLinks({ links }: { links: PromptInternalLinksData }) {
  const { series, seriesLinks, relatedLinks } = links;
  if (!seriesLinks.length && !relatedLinks.length) return null;
  const total = series?.members.length ?? 0;

  return (
    <div className={styles.internalLinks}>
      {series && seriesLinks.length ? (
        <section
          className={cn(styles.contentPanel, styles.linkPanel)}
          aria-labelledby="prompt-series-title"
        >
          <div className={styles.panelHeading}>
            <div>
              <p className={shell.eyebrow}>{series.label}</p>
              <h2 id="prompt-series-title">More in this series</h2>
            </div>
            {series.hubPath ? (
              <a className={styles.seeAllLink} href={series.hubPath}>
                See all {total} {midSentenceLabel(series.label)}
              </a>
            ) : null}
          </div>
          <ul className={styles.linkList}>
            {seriesLinks.map((link) => (
              <li key={link.path}>
                <a href={link.path}>{link.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {relatedLinks.length ? (
        <section
          className={cn(styles.contentPanel, styles.linkPanel)}
          aria-labelledby="related-prompts-title"
        >
          <p className={shell.eyebrow}>Keep exploring</p>
          <h2 id="related-prompts-title">Related prompts</h2>
          <ul className={styles.linkList}>
            {relatedLinks.map((link) => (
              <li key={link.path}>
                <a href={link.path}>{link.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
