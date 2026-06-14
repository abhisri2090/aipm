import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { CLI_INSTALL_COMMAND, CLI_RELEASE_URL, CLI_VERSION } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

type ExampleStep = {
  title: string;
  body: string;
  code: string;
};

type Example = {
  title: string;
  scenario: string;
  publishSteps: ExampleStep[];
  installSteps: ExampleStep[];
  notes: string[];
};

const examples: Example[] = [
  {
    title: "Code review helper for Cursor",
    scenario: "A team wants the same pull request review checklist in every Cursor project.",
    publishSteps: [
      {
        title: "1. Create the skill folder",
        body: "Creates a new package folder with a manifest, starter SKILL.md, and .aipmignore. The --targets cursor flag means this skill is for Cursor only.",
        code: "aipm publish init --name @team/review-helper --template code-review --targets cursor",
      },
      {
        title: "2. Open the folder",
        body: "Move into the folder AIPM just created so the next commands run in the right place.",
        code: "cd review-helper",
      },
      {
        title: "3. Stage your files",
        body: "Adds the skill files in this folder to the publish bundle. Run this after you edit SKILL.md or add other files.",
        code: "aipm publish add .",
      },
      {
        title: "4. Preview what will be published (optional)",
        body: "Shows the file list and package size before you push. Use this to catch secrets or extra files early.",
        code: "aipm publish preview",
      },
      {
        title: "5. Publish to the registry",
        body: "Sign in on the website, reserve the package name, create a 5-minute token in the dashboard, then paste it here and push.",
        code: "AIPM_TOKEN=<5-minute-token> aipm publish push --yes",
      },
    ],
    installSteps: [
      {
        title: "Install into a project",
        body: "Adds the published skill to your project and writes the Cursor skill file. --ci skips prompts in scripts or CI.",
        code: "aipm add @team/review-helper@1.0.0 --target cursor --ci",
      },
    ],
    notes: ["Good for pull request reviews", "Installs into .cursor/aipm/skills/<skill>.md"],
  },
  {
    title: "Sentry issue summariser for Claude",
    scenario: "A product engineer wants Claude to turn error reports into clear triage notes.",
    publishSteps: [
      {
        title: "1. Create the skill folder",
        body: "Creates a package for Claude with starter content for issue summaries.",
        code: "aipm publish init --name @team/sentry-issue-summary --template issue-summary --targets claude",
      },
      {
        title: "2. Open the folder",
        body: "Go into the new package folder before staging or publishing.",
        code: "cd sentry-issue-summary",
      },
      {
        title: "3. Stage your files",
        body: "Adds your edited skill files to the publish bundle.",
        code: "aipm publish add .",
      },
      {
        title: "4. Validate the package (optional)",
        body: "Checks the manifest, entry file, and staged files before you publish.",
        code: "aipm publish validate",
      },
      {
        title: "5. Publish to the registry",
        body: "Use a fresh dashboard token. It expires after 5 minutes.",
        code: "AIPM_TOKEN=<5-minute-token> aipm publish push --yes",
      },
    ],
    installSteps: [
      {
        title: "Install into a project",
        body: "Installs the skill as a Claude project skill folder.",
        code: "aipm add @team/sentry-issue-summary@1.0.0 --target claude --ci",
      },
    ],
    notes: ["Good for incidents, support, and bug triage", "Installs into .claude/aipm/skills/<skill>/SKILL.md"],
  },
  {
    title: "Release notes skill for Cursor and Claude",
    scenario: "A maintainer wants one skill that helps Cursor and Claude draft release notes.",
    publishSteps: [
      {
        title: "1. Create the skill folder",
        body: "Creates one package that supports both Cursor and Claude.",
        code: "aipm publish init --name @team/release-notes --template release-notes --targets cursor,claude",
      },
      {
        title: "2. Open the folder",
        body: "Move into the package folder you just created.",
        code: "cd release-notes",
      },
      {
        title: "3. Stage your files",
        body: "Adds the skill files to the publish bundle.",
        code: "aipm publish add .",
      },
      {
        title: "4. Preview what will be published (optional)",
        body: "Review included files before pushing a new version.",
        code: "aipm publish preview",
      },
      {
        title: "5. Publish to the registry",
        body: "Push the version to the public registry with a dashboard token.",
        code: "AIPM_TOKEN=<5-minute-token> aipm publish push --yes",
      },
    ],
    installSteps: [
      {
        title: "Install for Cursor",
        body: "Installs the Cursor version of the skill into your project.",
        code: "aipm add @team/release-notes@1.0.0 --target cursor --ci",
      },
      {
        title: "Install for Claude",
        body: "Installs the Claude version into the same or another project.",
        code: "aipm add @team/release-notes@1.0.0 --target claude --ci",
      },
    ],
    notes: ["Good for teams using more than one AI tool", "The manifest should include both cursor and claude targets"],
  },
  {
    title: "Import an existing Codex skill folder",
    scenario: "A user already has a local skill folder and wants to publish it.",
    publishSteps: [
      {
        title: "1. Import into an AIPM package",
        body: "Copies an existing skill folder into a new AIPM package layout with a manifest.",
        code: "aipm publish import ~/.codex/skills/review-helper --name @team/review-helper",
      },
      {
        title: "2. Open the folder",
        body: "Go into the imported package folder.",
        code: "cd review-helper",
      },
      {
        title: "3. Stage your files",
        body: "Stages the imported files. Check .aipmignore first so private files stay out.",
        code: "aipm publish add .",
      },
      {
        title: "4. Preview what will be published (optional)",
        body: "Confirms which files will go public before you push.",
        code: "aipm publish preview",
      },
      {
        title: "5. Publish to the registry",
        body: "Publish with a short-lived token from the package dashboard.",
        code: "AIPM_TOKEN=<5-minute-token> aipm publish push --yes",
      },
    ],
    installSteps: [
      {
        title: "Install into a project",
        body: "Installs the published skill for Cursor in this example.",
        code: "aipm add @team/review-helper@1.0.0 --target cursor --ci",
      },
    ],
    notes: ["Good when an AI tool created the first draft", "Review .aipmignore before staging imported files"],
  },
];

function ExampleSteps({ steps }: { steps: ExampleStep[] }) {
  return (
    <div className={cards.exampleSteps}>
      {steps.map((step) => (
        <div className={cards.exampleStep} key={step.title}>
          <h4>{step.title}</h4>
          <p>{step.body}</p>
          <CodeBlock code={step.code} />
        </div>
      ))}
    </div>
  );
}

export const metadata = pageMetadata({
  title: "AIPM Skill Examples",
  description: "Copy simple AIPM examples for publishing and installing skills.",
  path: "/examples",
  keywords: [
    "AIPM examples",
    "AI skill examples",
    "Cursor skill example",
    "Claude skill example",
    "publish AI skill",
    "AIPM install example",
  ],
});

export default function ExamplesPage() {
  return (
    <DocLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AIPM Skill Examples",
            description: "Copy simple AIPM examples for publishing and installing skills.",
            url: "https://aipm-registry.com/examples",
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Examples</p>
        <h1>Copy a working flow for a common skill.</h1>
        <p className={shell.lede}>
          These examples show the whole path: create a skill, stage it, publish it, and install it
          into an AI tool. Each step has its own command and a short explanation.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/templates">
            Templates
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/targets">
            Targets
          </Link>
        </div>
      </section>

      <article className={docs.doc}>
        <section>
          <h2>Before any example</h2>
          <p>
            Install the CLI once, then sign in on the website to create an org and reserve the package name.
            Current verified release: <a href={CLI_RELEASE_URL}>AIPM CLI {CLI_VERSION}</a>.
          </p>
          <CodeBlock code={`${CLI_INSTALL_COMMAND}\naipm --version`} />
        </section>
      </article>

      <section className={cards.exampleList} aria-label="AIPM publishing examples">
        {examples.map((example) => (
          <article className={cards.exampleCard} key={example.title}>
            <h2>{example.title}</h2>
            <p>{example.scenario}</p>
            <h3>Publish</h3>
            <ExampleSteps steps={example.publishSteps} />
            <h3>Install</h3>
            <ExampleSteps steps={example.installSteps} />
            <ul className={docs.checkList}>
              {example.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </DocLayout>
  );
}
