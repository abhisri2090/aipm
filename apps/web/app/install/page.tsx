import Link from "next/link";
import { shell, docs, cn } from "../../lib/page-styles";
import { CodeBlock } from "../../components/code-block";
import { DocLayout } from "../../components/doc-layout";
import {
  CLI_INSTALL_OPTIONS,
  CLI_RELEASE_URL,
  CLI_SCOOP_COMMAND,
  CLI_VERSION,
  SITE_URL,
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
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Install AIPM CLI",
            description: "Install the AIPM CLI on macOS, Linux, or Windows to manage AI skills in your projects.",
            url: `${SITE_URL}/install`,
            step: [
              {
                "@type": "HowToStep",
                name: "Choose install method",
                text: "Pick npm, Homebrew, shell script, PowerShell, or Scoop based on your operating system.",
              },
              {
                "@type": "HowToStep",
                name: "Run the install command",
                text: "Execute the install command for your chosen method in a terminal.",
              },
              {
                "@type": "HowToStep",
                name: "Verify installation",
                text: "Run aipm --version to confirm the CLI is installed and on your PATH.",
              },
            ],
          }),
        }}
      />

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

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Choose an install method</h2>
          <p>
            Pick the option that matches your machine. All methods install the same <code>aipm</code> command.
            The CLI works on macOS, Linux, and Windows. It requires Node.js 18 or later for the npm install,
            but the native installers bundle their own runtime.
          </p>
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
        </section>

        <section>
          <h2>Check the install</h2>
          <p>After installing, confirm the command is on your PATH and check your local setup.</p>
          <CodeBlock
            code={`aipm --version\naipm doctor # (optional)`}
            trackingEvent="CLI Check Command Copied"
          />
          <p>
            The <code>aipm doctor</code> command checks your environment for common issues. It verifies
            that the CLI can reach the registry, that your authentication is valid (if logged in), and
            that your project configuration is correct.
          </p>
        </section>

        <section>
          <h2>Troubleshooting</h2>
          <p>
            If the command is not found after install, check that the install directory is in your PATH.
            For npm global installs, run <code>npm config get prefix</code> to find the bin directory.
            For Homebrew, ensure <code>/opt/homebrew/bin</code> (Apple Silicon) or <code>/usr/local/bin</code> (Intel) is in your PATH.
          </p>
          <p>
            If you see permission errors on Linux or macOS, avoid using <code>sudo</code> with npm. Instead, configure npm
            to use a directory in your home folder for global packages, or use a version manager like nvm.
          </p>
        </section>

        <section>
          <h2>Next steps</h2>
          <p>
            After installing, follow the <Link href="/use">use guide</Link> to install skills into a project.
            To share your own workflow, read the <Link href="/publish/guide">publishing guide</Link>.
            For a full command reference, see the <Link href="/commands">CLI commands</Link> page.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
