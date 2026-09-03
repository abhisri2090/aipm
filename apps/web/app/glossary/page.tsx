import { shell, cards } from "../../lib/page-styles";
import { pageMetadata } from "../../lib/seo";
import { DocLayout } from "../../components/doc-layout";
import { SITE_URL } from "../../lib/registry";

const terms = [
  {
    term: "AIPM package",
    definition: "A versioned package with a manifest, visibility setting, and the files needed to install an AI skill.",
  },
  {
    term: "Skill",
    definition: "A reusable set of instructions or files that helps an AI assistant do one job.",
  },
  {
    term: "Manifest",
    definition: "The aipm.manifest.json file. It tells AIPM the package name, version, entry file, supported tools, description, and license.",
  },
  {
    term: "Target",
    definition: "The AI tool you want to install into. Current targets are cursor and claude.",
  },
  {
    term: "Adapter",
    definition: "Code that writes skill files into the right folder for a target tool.",
  },
  {
    term: "Org namespace",
    definition: "The scope that owns package names, such as @team in @team/review-helper.",
  },
  {
    term: "Package reservation",
    definition: "A package name reserved in the dashboard so an org can publish versions for it.",
  },
  {
    term: "Private package",
    definition: "An org package that only authenticated members with access can discover, inspect, and install.",
  },
  {
    term: "CLI login",
    definition: "The browser-based aipm login flow that stores a local CLI session for private package reads and installs.",
  },
  {
    term: "CLI session",
    definition: "A local auth record stored in ~/.aipm/auth.json so the CLI can refresh access without asking for a token each time.",
  },
  {
    term: "Install token",
    definition: "An org-scoped read token used by CI or automation to install private packages without browser login.",
  },
  {
    term: "Publish token",
    definition: "A short-lived token from the dashboard. The CLI uses it when you publish a package version.",
  },
  {
    term: "Template",
    definition: "Starter SKILL.md content for common tasks like code review, issue summaries, and release notes.",
  },
  {
    term: "Entry file",
    definition: "The main file in a package. AIPM reads and installs this as the skill content.",
  },
  {
    term: ".aipmignore",
    definition: "A file that tells AIPM what not to publish, such as secrets, logs, and private notes.",
  },
  {
    term: "Readiness",
    definition: "A check that confirms the registry can reach its database and package storage.",
  },
];

export const metadata = pageMetadata({
  title: "AIPM Glossary",
  description:
    "Simple definitions for common AIPM words.",
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
            url: `${SITE_URL}/glossary`,
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
        <h1>Simple definitions for AIPM terms.</h1>
        <p className={shell.lede}>
          AIPM uses words from package managers, AI tools, and publishing accounts. This page keeps
          those words short and easy to scan.
        </p>
      </section>

      <section className={cards.glossaryList} aria-label="AIPM glossary terms">
        {terms.map((item) => (
          <article className={cards.glossaryCard} key={item.term}>
            <p>
              <h2>• {item.term}</h2>{item.definition}
            </p>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
