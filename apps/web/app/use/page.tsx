import Link from "next/link";
import { shell, docs } from "../../lib/page-styles";
import { CodeBlock } from "../../components/code-block";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Use AIPM",
  description: "Install AIPM skills into a project and keep them with your code.",
  path: "/use",
});

export default function UsePage() {
  return (
    <DocLayout>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Use AIPM</p>
        <h1>Install AI skills into your project.</h1>
        <p className={shell.lede}>
          AIPM adds the files an AI tool needs directly to your repo. Your prompts, rules,
          and skill files stay with the code instead of living in scattered notes.
        </p>
      </section>

      <article className={docs.doc}>
        <section aria-labelledby="use-overview">
          <p className={shell.eyebrow} id="use-overview">
            Overview
          </p>
          <h2>Track skills per project</h2>
          <p>
            AIPM keeps an aipm.package.json file in your project. It lists the skills you installed
            and their versions.
          </p>
          <p>
            Install the AIPM CLI once before running these commands. See the{" "}
            <Link href="/install">install guide</Link>.
          </p>
        </section>

        <section aria-labelledby="use-project-setup">
          <p className={shell.eyebrow} id="use-project-setup">
            Project setup
          </p>
          <h2>Initialize a project</h2>
          <p>This creates aipm.package.json and points it at the public registry.</p>
          <CodeBlock code="aipm init --target cursor" trackingEvent="CLI Init Command Copied" />
        </section>

        <section aria-labelledby="use-private-packages">
          <p className={shell.eyebrow} id="use-private-packages">
            Private packages
          </p>
          <h2>Sign in for private packages</h2>
          <p>
            Public packages install without an account. If your org has private packages, sign in
            once from the CLI. AIPM opens the browser, confirms your account, and stores a local
            session so future installs do not need a token pasted into every command.
          </p>
          <CodeBlock code={`aipm login\naipm whoami # (optional)`} trackingEvent="CLI Login Command Copied" />

          <h2>Sign out</h2>
          <p>Use this when you want to remove the local CLI session from your machine.</p>
          <CodeBlock code="aipm logout" trackingEvent="CLI Logout Command Copied" />
        </section>

        <section aria-labelledby="use-install-manage">
          <p className={shell.eyebrow} id="use-install-manage">
            Install and manage
          </p>
          <h2>Install a skill</h2>
          <p>Choose a package from the registry and install it for the AI tool you use.</p>
          <p>
            To install for one tool, choose a target like Cursor or Claude. Private org packages
            work the same way after <code>aipm login</code>. See{" "}
            <Link href="/targets">supported targets</Link> for the folders AIPM writes to.
          </p>
          <CodeBlock
            code="aipm add @scope/name@1.0.0 --target cursor --ci"
            trackingEvent="Example Package Install Command Copied"
          />

          <h2>List installed skills</h2>
          <p>Show the packages currently recorded in this project lockfile.</p>
          <CodeBlock code="aipm list" trackingEvent="CLI List Command Copied" />

          <h2>Search and update installed skills</h2>
          <p>Search finds registry packages; update checks configured packages for newer versions.</p>
          <CodeBlock code={`aipm search sentry\naipm update`} trackingEvent="CLI Discover Command Copied" />

          <h2>Updating a skill</h2>
          <p>
            Install the newer version with the same add command. The version is written down, so
            your team can review what changed.
          </p>
        </section>

        <section aria-labelledby="use-ci">
          <p className={shell.eyebrow} id="use-ci">
            CI and automation
          </p>
          <h2>Use install tokens in CI</h2>
          <p>
            Browser login is best for people working locally. For CI or automation, use an org install
            token with <code>--token</code> or <code>AIPM_TOKEN</code> so the job can read private
            packages.
          </p>
          <CodeBlock
            code="AIPM_TOKEN=<install-token> aipm add @scope/private-skill@1.0.0 --target cursor --ci"
            trackingEvent="Private Package Install Command Copied"
          />
        </section>

        <section aria-labelledby="use-file-layout">
          <p className={shell.eyebrow} id="use-file-layout">
            File layout
          </p>
          <h2>Where files go</h2>
          <p>
            AIPM writes files into the folder your AI tool expects. For Cursor, skill files go into
            the project Cursor skill area. For Claude, AIPM writes a project skill folder.
          </p>
          <p>
            See the <Link href="/targets">targets guide</Link> for exact folders and supported tools.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
