import Link from "next/link";
import { shell, cards } from "../../lib/page-styles";
import { DocLayout } from "../../components/doc-layout";
import { DOC_NAV_SECTIONS } from "../../lib/docs-nav";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AI Skill Resources",
  description:
    "Guides for using, publishing, and understanding AIPM skills.",
  path: "/resources",
  keywords: ["AI skill resources", "AI package manager", "AI publishing guide", "AI best practices"],
});

export default function ResourcesPage() {
  return (
    <DocLayout>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Resources</p>
        <h1>Find the guide you need.</h1>
        <p className={shell.lede}>
          This is the home for AIPM docs. Use it to learn how to install skills, publish packages,
          choose targets, avoid leaks, and fix common problems.
        </p>
      </section>

      {DOC_NAV_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className={shell.eyebrow}>{section.title}</h2>
          <div className={cards.guideGrid}>
            {section.items
              .filter((item) => item.href !== "/resources")
              .map((item) => (
                <Link className={cards.guideCard} href={item.href} key={item.href}>
                  <h2>{item.label}</h2>
                  <p>{item.body}</p>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </DocLayout>
  );
}
