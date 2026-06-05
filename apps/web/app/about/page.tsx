import { shell, cards, docs } from "../../lib/page-styles";
import { pageMetadata } from "../../lib/seo";
import { DocLayout } from "../../components/doc-layout";

export const metadata = pageMetadata({
  title: "About AIPM",
  description: "AIPM helps teams install and publish AI skills, prompts, and tool files.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <DocLayout>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>About</p>
        <h1>AIPM manages AI skills for projects.</h1>
        <p className={shell.lede}>
          Many projects now depend on prompts, skill files, editor rules, and AI tool setup. AIPM
          makes those files searchable, versioned, and installable.
        </p>
      </section>

      <section className={cards.guideGrid}>
        <article className={cards.guideCard}>
          <h2>Reusable setup</h2>
          <p>Install the same skill into any project that needs it.</p>
        </article>
        <article className={cards.guideCard}>
          <h2>Clear changes</h2>
          <p>Publish updates as new versions so teams can review them.</p>
        </article>
        <article className={cards.guideCard}>
          <h2>Tool-specific install</h2>
          <p>Install into Cursor, Claude, and more tools as AIPM grows.</p>
        </article>
      </section>

      <article className={docs.doc}>
        <h2>What AIPM is not</h2>
        <p>
          AIPM is not an AI model, chat app, or prompt marketplace. It manages the files and
          instructions your AI tools use inside a project.
        </p>
      </article>
    </DocLayout>
  );
}
