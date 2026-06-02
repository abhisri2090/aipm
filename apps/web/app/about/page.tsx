import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "About AIPM",
  description: "AIPM is package management for project-ready AI skills, prompts, and tool files.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">About</p>
        <h1>AIPM is package management for AI work inside projects.</h1>
        <p className="lede">
          Modern projects depend on prompts, skill files, editor rules, and AI tool setup. AIPM
          makes those pieces versioned, searchable, and installable instead of copied around
          manually.
        </p>
      </section>

      <section className="guide-grid">
        <article className="guide-card">
          <h2>Portable setup</h2>
          <p>Install the same skill into every project that needs it.</p>
        </article>
        <article className="guide-card">
          <h2>Versioned changes</h2>
          <p>Publish updates as new package versions so changes can be reviewed.</p>
        </article>
        <article className="guide-card">
          <h2>Tool-aware install</h2>
          <p>Target Cursor, Claude, or more adapters as AIPM grows.</p>
        </article>
      </section>

      <article className="doc">
        <h2>What AIPM is not</h2>
        <p>
          AIPM is not an AI model, chat interface, or prompt marketplace. It is infrastructure for
          managing the files and instructions your AI tools use while working in a project.
        </p>
      </article>
    </main>
  );
}
