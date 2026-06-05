import { shell, cards, docs, cn } from "../../../lib/page-styles";
import { CodeBlock } from "../../../components/code-block";
import { DocLayout } from "../../../components/doc-layout";
import { CLI_INSTALL_COMMAND } from "../../../lib/registry";
import { pageMetadata } from "../../../lib/seo";

export const metadata = pageMetadata({
  title: "Publishing Guide",
  description: "Create, check, and publish AIPM skills for supported AI tools.",
  path: "/publish/guide",
});

export default function PublishPage() {
  return (
    <DocLayout>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Publishing</p>
        <h1>Create a skill package and publish it.</h1>
        <p className={shell.lede}>
          An AIPM skill package is a folder with a manifest and the files your AI tool needs. You
          publish it with the CLI. Users find and install it from the registry.
        </p>
        <div className={shell.actions}>
          <a className={shell.button} href="/login">
            Sign in to publish
          </a>
          <a className={cn(shell.button, shell.secondary)} href="/dashboard">
            Publisher dashboard
          </a>
        </div>
      </section>

      <article className={docs.doc}>
        <h2>Install the CLI</h2>
        <p>Install the CLI before running any aipm command.</p>
        <CodeBlock code={`${CLI_INSTALL_COMMAND}\naipm --version\naipm doctor # (optional)`} />

        <h2>1. Create an account and reserve a package name</h2>
        <ol className={docs.flowList}>
          <li>Sign in with GitHub.</li>
          <li>Create an org namespace, such as @team.</li>
          <li>Reserve a package name, such as @team/review-helper.</li>
          <li>Open the package dashboard. You will use it later to generate a 5-minute publish token.</li>
        </ol>

        <h2>2. Create a skill folder</h2>
        <p>
          The fastest path is to let the CLI create a folder named after the skill. It includes
          aipm.manifest.json, SKILL.md, and .aipmignore.
        </p>
        <CodeBlock
          code={`aipm publish init --name @team/review-helper --template code-review
cd review-helper`}
        />

        <h2>Manifest shape</h2>
        <p>Each skill needs an aipm.manifest.json file and a main file, usually SKILL.md.</p>
        <CodeBlock
          code={`{
  "schemaVersion": "0.1",
  "name": "@team/review-helper",
  "version": "1.0.0",
  "type": "skill",
  "description": "Review checklist for project PRs",
  "entry": "SKILL.md",
  "targets": ["cursor"],
  "license": "Apache-2.0"
}`}
        />

        <h2>3. Check and publish from the CLI</h2>
        <CodeBlock
          code={`aipm publish explain # (optional)
aipm publish add .
aipm publish status # (optional)
aipm publish preview # (optional)
aipm publish validate # (optional)
aipm publish token --package @team/review-helper # (optional)
AIPM_TOKEN=<5-minute-token> aipm publish push --yes`}
        />

        <h2>Starter templates</h2>
        <p>
          Templates only create starter SKILL.md content. Pick the closest one, then edit the
          generated files before you stage and publish.
        </p>
        <p>
          See the <a href="/templates">templates guide</a> for when to use each starter.
        </p>
        <div className={cards.exampleGrid}>
          <article className={cards.exampleCard}>
            <h3>Code review</h3>
            <CodeBlock code="aipm publish init --name @team/review-helper --template code-review" />
            <p>Starts with review goals, a checklist, and a format for findings.</p>
          </article>
          <article className={cards.exampleCard}>
            <h3>Issue summary</h3>
            <CodeBlock code="aipm publish init --name @team/issue-summary --template issue-summary" />
            <p>Starts with sections for impact, evidence, likely cause, and next action.</p>
          </article>
          <article className={cards.exampleCard}>
            <h3>Release notes</h3>
            <CodeBlock code="aipm publish init --name @team/release-notes --template release-notes" />
            <p>Starts with sections for highlights, fixes, upgrade notes, and known issues.</p>
          </article>
        </div>

        <h2>Publish an existing AI-tool skill</h2>
        <p>
          If Cursor, Claude, Codex, or another AI tool already created skill files, import that file
          or folder into an AIPM package folder. This copies the source into a new folder and creates
          the AIPM manifest around it.
        </p>
        <CodeBlock
          code={`aipm publish import ~/.codex/skills/review-helper --name @team/review-helper
cd review-helper
aipm publish add .
aipm publish preview # (optional)`}
        />

        <h2>Self-service publishing flow</h2>
        <ol className={docs.flowList}>
          <li>Create an AIPM account.</li>
          <li>Register an organization and reserve a package name such as @team/review-helper.</li>
          <li>Generate a publish token that is valid for 5 minutes.</li>
          <li>Use the CLI to check, stage, and push the skill files to the registry.</li>
          <li>Open the package page and confirm the install command works for the expected target.</li>
        </ol>

        <h2>Target examples</h2>
        <p>
          See <a href="/targets">supported targets</a> for the folders AIPM writes to.
        </p>
        <div className={cards.exampleGrid}>
          <article className={cards.exampleCard}>
            <h3>Cursor-only</h3>
            <CodeBlock code={`"targets": ["cursor"]`} />
            <p>Use this when the skill should install only into Cursor.</p>
          </article>
          <article className={cards.exampleCard}>
            <h3>Claude-only</h3>
            <CodeBlock code={`"targets": ["claude"]`} />
            <p>Use this when the skill is built for Claude project instructions.</p>
          </article>
          <article className={cards.exampleCard}>
            <h3>Multi-tool</h3>
            <CodeBlock code={`"targets": ["cursor", "claude"]`} />
            <p>Use this when the same skill should install into more than one AI tool.</p>
          </article>
        </div>

        <h2>Common publishing problems</h2>
        <table>
          <thead>
            <tr>
              <th>Problem</th>
              <th>What to do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Updating an existing skill</td>
              <td>Change the manifest version, then publish again.</td>
            </tr>
            <tr>
              <td>Duplicate version error</td>
              <td>AIPM does not overwrite versions. Publish a new version.</td>
            </tr>
            <tr>
              <td>Invalid package name</td>
              <td>Use scoped names like @team/review-helper.</td>
            </tr>
            <tr>
              <td>Registry unavailable</td>
              <td>Check the registry URL and run curl &lt;registry-url&gt;/health.</td>
            </tr>
          </tbody>
        </table>
      </article>
    </DocLayout>
  );
}
