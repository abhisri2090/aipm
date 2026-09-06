import Link from "next/link";
import { shell, docs } from "../../lib/page-styles";
import { CodeBlock } from "../../components/code-block";
import { DocLayout } from "../../components/doc-layout";
import {
  CLI_INSTALL_OPTIONS,
  CLI_RELEASE_URL,
  CLI_SCOOP_COMMAND,
  CLI_VERSION,
} from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Install AIPM CLI on macOS, Linux, or Windows",
  description: "Install the AIPM CLI with npm, Homebrew, macOS or Linux scripts, Windows PowerShell, or Scoop. Then check the installation in two commands.",
  path: "/install",
  keywords: [
    "install AIPM CLI",
    "AIPM CLI npm",
    "AIPM Homebrew",
    "aipm doctor",
    "aipm --version",
  ],
});

export default function InstallPage() {
  return (
    <DocLayout>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Getting started</p>
        <h1>Install the AIPM CLI.</h1>
        <p className={shell.lede}>
          Install the CLI once on your machine before you use, publish, or manage skills. The current
          verified release is <a href={CLI_RELEASE_URL}>AIPM CLI {CLI_VERSION}</a>.
        </p>
        <p>
          <strong>Short answer:</strong> use npm on any supported system, or choose the native
          installer for your operating system. Run <code>aipm --version</code> when it finishes.
        </p>
        <p>
          New to this idea? Read <Link href="/guides/ai-package-manager">what an AI package manager is</Link>{" "}
          and why developers use one for reusable AI skills.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/use">
            Use guide
          </Link>
          <Link className={shell.button} href="/commands">
            CLI commands
          </Link>
        </div>
      </section>

      <article className={docs.doc}>
        <h2>Choose an install method</h2>
        <p>Pick the option that matches your machine. All methods install the same <code>aipm</code> command.</p>
        {CLI_INSTALL_OPTIONS.map((option) => (
          <section key={option.label} id={option.slug}>
            <h3 className={docs.cliInstallVia}>{option.label}</h3>
            <CodeBlock
              code={option.code}
              trackingEvent="CLI Install Command Copied"
              trackingProperties={{ method: option.slug }}
            />
          </section>
        ))}
        <section id="via-scoop">
          <h3 className={docs.cliInstallVia}>via Scoop</h3>
          <CodeBlock
            code={CLI_SCOOP_COMMAND}
            trackingEvent="CLI Install Command Copied"
            trackingProperties={{ method: "via-scoop" }}
          />
        </section>

        <h2>Check the install</h2>
        <p>After installing, confirm the command is on your PATH and check your local setup.</p>
        <CodeBlock
          code={`aipm --version\naipm doctor # (optional)`}
          trackingEvent="CLI Check Command Copied"
        />
        <p>
          Next, follow the <Link href="/use">use guide</Link> to install skills into a project, or the{" "}
          <Link href="/publish/guide">publishing guide</Link> to publish your first package.
        </p>
      </article>
    </DocLayout>
  );
}
