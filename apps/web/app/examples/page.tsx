import { shell, cards, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { pageMetadata } from "../../lib/seo";
import { SITE_URL } from "../../lib/registry";

type ExampleStep = {
  title: string;
  body: string;
  code: string;
};

type Example = {
  title: string;
  storyline: string;
  publishSteps: ExampleStep[];
  installSteps: ExampleStep[];
  notes: string[];
};

const examples: Example[] = [
  {
    title: "Code review AI skill for Cursor",
    storyline:
      "Maya leads a small backend team. Every pull request gets different review comments because each developer prompts Cursor differently. She packages the team's PR checklist as a skill so every project installs the same review standards.",
    publishSteps: [
      {
        title: "1. Create the skill folder",
        body: "Creates a new package folder with a manifest, starter SKILL.md, and .aipmignore. The --targets cursor flag means this skill is for Cursor only. --template code-review means the skill is a code review skill.",
        code: "aipm publish init --name {{your-team-name/review-helper}} --template code-review --targets cursor",
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
        code: "aipm add {{your-team-name/review-helper}}@1.0.0 --target cursor --ci",
      },
    ],
    notes: ["This will get installed into .cursor/aipm/skills/<skill>.md"],
  },
  {
    title: "Sentry issue summariser AI skill for Claude",
    storyline:
      "James gets paged when Sentry fires. He spends the first ten minutes rewriting the same triage prompt in Claude. He publishes one skill so incident summaries follow the same format every time.",
    publishSteps: [
      {
        title: "1. Create the skill folder",
        body: "Creates a package for Claude with starter content for issue summaries.",
        code: "aipm publish init --name {{your-team-name/sentry-issue-summary}} --template issue-summary --targets claude",
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
        code: "aipm add {{your-team-name/sentry-issue-summary}}@1.0.0 --target claude --ci",
      },
    ],
    notes: ["Good for incidents, support, and bug triage", "This will get installed into .claude/aipm/skills/<skill>/SKILL.md"],
  },
  {
    title: "Release notes skill for Cursor and Claude",
    storyline:
      "Priya ships features weekly and uses both Cursor for day-to-day coding and Claude for release drafts. She wants one skill package that works in both tools without maintaining two separate copies.",
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
    title: "Import an existing Codex AI skill folder",
    storyline:
      "Alex already built a review skill in Codex. The team wants it on the registry so others can install it with aipm add. He imports the folder instead of starting from scratch.",
    publishSteps: [
      {
        title: "1. Import into an AIPM package",
        body: "Copies an existing skill folder into a new AIPM package layout with a manifest.",
        code: "aipm publish import ~/.codex/skills/review-helper --name {{your-team-name/review-helper}}",
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
        code: "aipm add {{your-team-name/review-helper}}@1.0.0 --target cursor --ci",
      },
    ],
    notes: ["Good when an AI tool created the first draft", "Review .aipmignore before staging imported files", "This will get installed into .cursor/aipm/skills/<skill>.md"],
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
            url: `${SITE_URL}/examples`,
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Examples</p>
        <h1>Skill publishing examples.</h1>
        <p className={shell.lede}>
          These examples show the whole path:
          {`Create a skill -> stage it -> publish it -> let people install it`} <br />
          Install the AIPM CLI once before you start — see the <Link href="/install">install guide</Link>.
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

      <section className={cards.exampleList} aria-label="AIPM publishing examples">
        {examples.map((example, index) => (
          <article className={cards.exampleCard} key={example.title}>
            <p className={shell.eyebrow}>Example {index + 1}</p>
            <h2>{example.title}</h2>
            <p className={cards.exampleStoryline}>{example.storyline}</p>
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
