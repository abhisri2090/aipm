import { shell, cards } from "../../lib/page-styles";
import { pageMetadata } from "../../lib/seo";
import { DocLayout } from "../../components/doc-layout";

const terms = [
  {
    term: "AIPM package",
    definition: "A versioned public package containing an AI skill manifest and the files needed to install that skill into a supported tool.",
  },
  {
    term: "Skill",
    definition: "A reusable AI workflow, instruction set, prompt file, or tool-specific project file that helps an assistant do one job consistently.",
  },
  {
    term: "Manifest",
    definition: "The aipm.manifest.json file that names the package, version, type, entry file, supported targets, description, and license.",
  },
  {
    term: "Target",
    definition: "The AI tool adapter used for installation. Current supported targets are cursor and claude.",
  },
  {
    term: "Adapter",
    definition: "Install logic that writes skill files into the right project location for a target tool.",
  },
  {
    term: "Org namespace",
    definition: "The reserved scope that owns package names, such as @team in @team/review-helper.",
  },
  {
    term: "Package reservation",
    definition: "A dashboard-owned package name that lets an org generate short-lived publish tokens for that package.",
  },
  {
    term: "Publish token",
    definition: "A short-lived token generated from the dashboard and passed to the CLI when pushing a package version.",
  },
  {
    term: "Template",
    definition: "Starter SKILL.md content for common workflows such as code review, issue summaries, and release notes.",
  },
  {
    term: "Entry file",
    definition: "The primary file inside a package that AIPM reads and installs as the skill content.",
  },
  {
    term: ".aipmignore",
    definition: "An ignore file used before publishing to keep secrets, noisy outputs, and private project context out of public packages.",
  },
  {
    term: "Readiness",
    definition: "A registry dependency check that confirms metadata and package storage are reachable, separate from process health.",
  },
];

export const metadata = pageMetadata({
  title: "AIPM Glossary",
  description:
    "Plain-language definitions for AIPM terms including packages, skills, manifests, targets, adapters, org namespaces, publish tokens, and templates.",
  path: "/glossary",
  keywords: [
    "AIPM glossary",
    "AI package manager terms",
    "AI skill manifest",
    "publish token",
    "AI tool target",
  ],
});

export default function GlossaryPage() {
  return (
    <DocLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "AIPM Glossary",
            url: "https://aipm-registry.com/glossary",
            hasDefinedTerm: terms.map((item) => ({
              "@type": "DefinedTerm",
              name: item.term,
              description: item.definition,
            })),
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Glossary</p>
        <h1>Understand the words AIPM uses before you publish or install.</h1>
        <p className={shell.lede}>
          AIPM has package-manager words, AI-tool words, and publisher-account words. This glossary
          keeps the core terms short, explicit, and easy to scan.
        </p>
      </section>

      <section className={cards.glossaryList} aria-label="AIPM glossary terms">
        {terms.map((item) => (
          <article className={cards.glossaryCard} key={item.term}>
            <h2>{item.term}</h2>
            <p>{item.definition}</p>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
