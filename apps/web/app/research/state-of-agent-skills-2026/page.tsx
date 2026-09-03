import Link from "next/link";
import { DocLayout } from "../../../components/doc-layout";
import { AGENT_SKILLS_REPORT_DATE, getAgentSkillsSnapshot } from "../../../lib/agent-skills-research";
import { cards, cn, docs, shell } from "../../../lib/page-styles";
import { SITE_URL } from "../../../lib/registry";
import { pageMetadata } from "../../../lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "State of AI Agent Skills 2026: Registry Data and Trust Signals",
  description:
    "Explore current AIPM agent-skill registry data, target support, source coverage, licenses, integrity hashes, publisher verification, and test methodology.",
  path: "/research/state-of-agent-skills-2026",
  keywords: [
    "State of Agent Skills 2026",
    "AI agent skills research",
    "agent skills dataset",
    "Agent Skills security",
    "AI skills registry statistics",
  ],
});

function percentage(value: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function reportDate(value: string | null): string {
  if (!value) return "No package date was available";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function StateOfAgentSkillsPage() {
  const snapshot = await getAgentSkillsSnapshot();
  const reportUrl = `${SITE_URL}/research/state-of-agent-skills-2026`;
  const datasetUrl = `${SITE_URL}/research/agent-skills-2026.json`;

  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: "State of AI Agent Skills 2026",
                description: "A reproducible snapshot of public packages in the AIPM agent skills registry.",
                url: reportUrl,
                datePublished: AGENT_SKILLS_REPORT_DATE,
                dateModified: snapshot.generatedAt,
                author: { "@type": "Person", name: "Abhishek Srivastava" },
                publisher: { "@type": "Organization", name: "AIPM" },
                mainEntity: { "@id": `${datasetUrl}#dataset` },
              },
              {
                "@type": "Dataset",
                "@id": `${datasetUrl}#dataset`,
                name: "AIPM State of Agent Skills 2026 dataset",
                description: "Public AIPM package metadata used in the State of Agent Skills 2026 report.",
                url: datasetUrl,
                distribution: {
                  "@type": "DataDownload",
                  encodingFormat: "application/json",
                  contentUrl: datasetUrl,
                },
                isAccessibleForFree: true,
                license: "https://www.apache.org/licenses/LICENSE-2.0",
              },
            ],
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Original AIPM research</p>
        <h1>State of AI Agent Skills 2026</h1>
        <p className={shell.lede}>
          This report measures the public packages currently available through the AIPM Registry API.
          It shows what can be verified from package metadata and clearly separates trust signals from
          full security testing.
        </p>
        <p className={shell.muted}>
          Published 4 September 2026. Data refreshes every hour. The newest package in this
          snapshot was published {reportDate(snapshot.dataThrough)}.
        </p>
        <div className={shell.actions}>
          <a className={shell.button} href="/research/agent-skills-2026.json">Download the JSON dataset</a>
          <Link className={cn(shell.button, shell.secondary)} href="/skills">Browse the skills registry</Link>
        </div>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Short answer</h2>
          <p>
            The snapshot contains {snapshot.totals.packages} public package versions from {snapshot.totals.publishers} publishers.
            Every counted package has a SHA-256 integrity value, while source links, declared licenses, and verified publishers
            have separate coverage. These fields help review a package, but they do not prove that its instructions are safe.
          </p>
        </section>
      </article>

      <section className={cards.guideGrid} aria-label="Registry snapshot">
        <article className={cards.guideCard}><h2>{snapshot.totals.packages}</h2><p>Public package versions</p></article>
        <article className={cards.guideCard}><h2>{snapshot.totals.publishers}</h2><p>Publisher namespaces</p></article>
        <article className={cards.guideCard}><h2>{snapshot.totals.installs}</h2><p>Recorded installs</p></article>
        <article className={cards.guideCard}><h2>{snapshot.totals.imported}</h2><p>Packages imported from public sources</p></article>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Trust signals in the registry</h2>
          <table>
            <thead><tr><th>Signal</th><th>Packages</th><th>Coverage</th><th>What it means</th></tr></thead>
            <tbody>
              <tr><td>SHA-256 integrity value</td><td>{snapshot.totals.integrityProtected}</td><td>{percentage(snapshot.totals.integrityProtected, snapshot.totals.packages)}</td><td>The downloaded files can be checked against a recorded hash.</td></tr>
              <tr><td>Public source link</td><td>{snapshot.totals.sourceLinked}</td><td>{percentage(snapshot.totals.sourceLinked, snapshot.totals.packages)}</td><td>A reviewer can open the stated upstream source.</td></tr>
              <tr><td>Declared license</td><td>{snapshot.totals.licenseDeclared}</td><td>{percentage(snapshot.totals.licenseDeclared, snapshot.totals.packages)}</td><td>The package states how its content may be used.</td></tr>
              <tr><td>Verified publisher</td><td>{snapshot.totals.verifiedPublisher}</td><td>{percentage(snapshot.totals.verifiedPublisher, snapshot.totals.packages)}</td><td>AIPM has completed its current publisher verification process.</td></tr>
            </tbody>
          </table>
          <p>
            These are metadata checks, not a malware verdict or a complete instruction-safety review. Read the source and bundled files before installation.
          </p>
        </section>

        <section>
          <h2>Declared target support</h2>
          <table>
            <thead><tr><th>Target</th><th>Package versions</th></tr></thead>
            <tbody>
              {snapshot.targets.map((target) => <tr key={target.target}><td>{target.target}</td><td>{target.packages}</td></tr>)}
            </tbody>
          </table>
          <p>A package may declare all supported tools, so these rows should not be added together.</p>
        </section>

        <section>
          <h2>AIPM compatibility checks</h2>
          <table>
            <thead><tr><th>Workflow</th><th>Command</th><th>Expected project output</th></tr></thead>
            <tbody>
              <tr><td>Install for Cursor</td><td><code>aipm add @scope/name@version --target cursor --ci</code></td><td><code>.cursor/aipm/skills/&lt;skill&gt;.md</code></td></tr>
              <tr><td>Install for Claude Code</td><td><code>aipm add @scope/name@version --target claude --ci</code></td><td><code>.claude/aipm/skills/&lt;skill&gt;/SKILL.md</code></td></tr>
              <tr><td>Verify downloaded files</td><td><code>aipm install --frozen</code></td><td>The package integrity must match the lock data.</td></tr>
            </tbody>
          </table>
          <p>
            These paths and commands are checked by the AIPM repository test and web-verification suites. They describe AIPM behavior, not native support claims made by another product.
          </p>
        </section>

        <section>
          <h2>Method</h2>
          <ol>
            <li>Request every page from the public <code>/v1/packages</code> endpoint with a page size of 100.</li>
            <li>Count one row for each package version returned by that endpoint.</li>
            <li>Use only public metadata: package name, version, description, targets, license, source, integrity, date, installs, publisher, and import state.</li>
            <li>Refresh the displayed totals and downloadable dataset every hour.</li>
          </ol>
        </section>

        <section>
          <h2>Limits</h2>
          <ul>
            <li>This is an AIPM registry snapshot, not a count of every Agent Skill on the internet.</li>
            <li>Publisher verification confirms the current AIPM identity check only.</li>
            <li>An integrity hash detects changed files; it does not decide whether instructions are safe.</li>
            <li>Target support is declared in package metadata and should be confirmed by testing the installed files.</li>
            <li>Install counts include only events recorded by the registry.</li>
          </ul>
        </section>

        <section>
          <h2>Sources and reproducibility</h2>
          <ul>
            <li><a href={`${SITE_URL}/v1/packages?limit=100`}>AIPM public packages API</a></li>
            <li><a href={datasetUrl}>Normalized JSON dataset</a></li>
            <li><a href="https://github.com/abhisri2090/aipm">AIPM source code and test suite</a></li>
            <li><a href="https://code.claude.com/docs/en/skills">Anthropic Agent Skills documentation</a></li>
            <li><a href="https://developers.openai.com/codex/skills/">OpenAI Codex Agent Skills documentation</a></li>
            <li><a href="https://docs.cursor.com/context/rules-for-ai">Cursor rules documentation</a></li>
          </ul>
          <p>The downloadable dataset is available under the Apache License 2.0.</p>
        </section>
      </article>
    </DocLayout>
  );
}
