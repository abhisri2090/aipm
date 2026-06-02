import { CLI_INSTALL_COMMAND } from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Publishing Guide",
  description: "Package, validate, and publish AIPM skills for supported AI tools.",
  path: "/publish",
});

export default function PublishPage() {
  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Publishing</p>
        <h1>Package AI skills once, then install them anywhere.</h1>
        <p className="lede">
          A published AIPM skill is a versioned folder with a manifest and the files your AI tool
          needs. Publish through the CLI; the website helps users discover and install packages.
        </p>
        <p className="notice">
          Production publishing is currently approval-only. Public users can browse and install
          packages while self-service publisher accounts are designed.
        </p>
      </section>

      <article className="doc">
        <h2>Install the CLI</h2>
        <pre>
          <code>{CLI_INSTALL_COMMAND}</code>
        </pre>

        <h2>1. Create a skill folder</h2>
        <p>Each skill needs an aipm.manifest.json file and an entry file.</p>
        <pre>
          <code>{`{
  "schemaVersion": "0.1",
  "name": "@team/review-helper",
  "version": "1.0.0",
  "type": "skill",
  "description": "Review checklist for project PRs",
  "entry": "SKILL.md",
  "targets": ["cursor"],
  "license": "Apache-2.0"
}`}</code>
        </pre>

        <h2>2. Publish the folder</h2>
        <pre>
          <code>AIPM_TOKEN=&lt;5-minute-token&gt; aipm publish ./skills/review-helper --registry https://aipm-registry.com</code>
        </pre>

        <h2>Planned self-service publishing</h2>
        <ol className="flow-list">
          <li>Create an AIPM account.</li>
          <li>Register an organization and reserve a skill name such as @team/review-helper.</li>
          <li>Generate a publish token that is valid for 5 minutes.</li>
          <li>Use the CLI to validate, stage, and push the skill files to the registry.</li>
        </ol>

        <h2>Target examples</h2>
        <div className="example-grid">
          <section>
            <h3>Cursor-only</h3>
            <pre>
              <code>{`"targets": ["cursor"]`}</code>
            </pre>
            <p>Use this when the skill should write Cursor-compatible files only.</p>
          </section>
          <section>
            <h3>Claude-only</h3>
            <pre>
              <code>{`"targets": ["claude"]`}</code>
            </pre>
            <p>Use this when the skill is built for Claude project instructions.</p>
          </section>
          <section>
            <h3>Multi-tool</h3>
            <pre>
              <code>{`"targets": ["cursor", "claude"]`}</code>
            </pre>
            <p>Use this when the same skill should install into multiple AI tools.</p>
          </section>
        </div>

        <h2>Common publish conditions</h2>
        <table>
          <thead>
            <tr>
              <th>Condition</th>
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
    </main>
  );
}
