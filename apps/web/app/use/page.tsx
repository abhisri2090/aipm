import { CodeBlock } from "../../components/code-block";
import { DocLayout } from "../../components/doc-layout";
import { CLI_INSTALL_COMMAND } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Use AIPM",
  description: "Install and use AIPM skills in project-ready AI tool setups.",
  path: "/use",
});

export default function UsePage() {
  return (
    <DocLayout>
      <section className="page-header">
        <p className="eyebrow">Use AIPM</p>
        <h1>Bind AI skills and tool files to your project.</h1>
        <p className="lede">
          AIPM installs the files a skill needs into your project, so your AI setup travels with
          the code instead of living in scattered notes.
        </p>
      </section>

      <article className="doc">
        <h2>Manage project-specific skills</h2>
        <p>AIPM maintaines aipm.package.json file in your project to track installed skills and their versions.</p>

        <h2>Install the CLI</h2>
        <p>Install the bundled AIPM command once on your machine.</p>
        <CodeBlock code={CLI_INSTALL_COMMAND} />

        <h2>Initialize a project</h2>
        <p>This writes an aipm.package.json file with the public registry URL.</p>
        <CodeBlock code="aipm init" />

        <h2>Install a skill</h2>
        <p>Choose a package from the registry and install it for the target tool.</p>
        <p>
          Install for single AI Tool: See <a href="/targets">supported targets</a> for install paths and detection behavior.
        </p>
        <CodeBlock code="aipm add <Skill_Name>" />

        <h2>List installed skills</h2>
        <CodeBlock code="aipm list" />

        <h2>Search and update installed skills</h2>
        <CodeBlock code={`aipm search sentry\naipm update`} />

        <h2>Where files go</h2>
        <p>
          AIPM writes tool-specific files into project locations that adapters understand. For
          Cursor, installed skill files are placed under the project Cursor skill area.
        </p>

        <h2>Updating a skill</h2>
        <p>
          Install the newer package version with the same add command. Versions are explicit, so
          project changes stay reviewable.
        </p>
      </article>
    </DocLayout>
  );
}
