import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { listGuideIndexEntries } from "../../lib/guide-index";
import { shell, cards } from "../../lib/page-styles";
import { SITE_URL } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

const guides = listGuideIndexEntries();

export const metadata = pageMetadata({
  title: "Guides for Claude, Codex & Cursor",
  description:
    "Guides for skills in Claude Code, Codex, and Cursor: what they are, where they live, and how to install them.",
  path: "/guides",
  keywords: ["AIPM guides", "AI agent guides", "Claude skills guides"],
});

export default function GuidesIndexPage() {
  return (
    <DocLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Guides for Claude, Codex & Cursor",
            description:
              "Guides for skills in Claude Code, Codex, and Cursor: what they are, where they live, and how to install them.",
            url: `${SITE_URL}/guides`,
            isPartOf: { "@type": "WebSite", name: "AIPM Registry", url: SITE_URL },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: guides.length,
              itemListElement: guides.map((guide, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: guide.title,
                description: guide.description,
                url: `${SITE_URL}/guides/${guide.slug}`,
              })),
            },
          }),
        }}
      />
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Guides</p>
        <h1>Guides</h1>
        <p className={shell.lede}>
          Every guide published on this site. Each card uses that guide&apos;s title and
          description.
        </p>
      </section>

      <section>
        <div className={cards.guideGrid}>
          {guides.map((guide) => (
            <Link
              className={cards.guideCard}
              href={`/guides/${guide.slug}`}
              key={guide.slug}
            >
              <h2>{guide.title}</h2>
              <p>{guide.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </DocLayout>
  );
}
