import { CLI_INSTALL_COMMAND } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Use AIPM",
  description: "Install and use AIPM skills in project-ready AI tool setups.",
  path: "/use",
});

export default function UsePage() {
  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Use AIPM</p>
        <h1>Bind AI skills and tool files to your project.</h1>
        <p className="lede">
          AIPM installs the files a skill needs into your project, so your AI setup travels with
          the code instead of living in scattered notes.
        </p>
      </section>

      <article className="doc">
        <h2>Install the CLI</h2>
        <p>Install the bundled AIPM command once on your machine.</p>
        <pre>
          <code>{`${CLI_INSTALL_COMMAND}
aipm --version
aipm doctor`}</code>
        </pre>

        <h2>Initialize a project</h2>
        <p>This writes an aipm.package.json file with the public registry URL.</p>
        <pre>
          <code>aipm init</code>
        </pre>

        <h2>Install a skill</h2>
        <p>Choose a package from the registry and install it for the target tool.</p>
        <pre>
          <code>aipm add @scope/name@1.0.0 --target cursor --ci</code>
        </pre>

        <h2>List installed skills</h2>
        <pre>
          <code>aipm list</code>
        </pre>

        <h2>Search and update</h2>
        <pre>
          <code>{`aipm search sentry
aipm update`}</code>
        </pre>

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
    </main>
  );
}
