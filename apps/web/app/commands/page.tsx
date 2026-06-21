import { shell, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { CodeBlock } from "../../components/code-block";
import { CommandSection, type CommandItem } from "../../components/command-section";
import { DocLayout } from "../../components/doc-layout";
import {
  CLI_INSTALL_OPTIONS,
  CLI_RELEASE_URL,
  CLI_SCOOP_COMMAND,
  CLI_VERSION,
} from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";

const installCommands: CommandItem[] = [
  ...CLI_INSTALL_OPTIONS.map((option) => ({
    title: option.label,
    slug: option.slug,
    description:
      option.slug === "via-npm"
        ? "Installs the AIPM CLI from npm for users who already have Node.js and npm."
        : "Put this command in your terminal to install the AIPM CLI",
    code: option.code,
  })),
  {
    title: "via Scoop",
    slug: "via-scoop",
    description: "Installs from the downloadable Scoop manifest attached to the CLI release.",
    code: CLI_SCOOP_COMMAND,
  },
];

const privatePackageCommands: CommandItem[] = [
  {
    title: "CLI login",
    description: "Opens the browser login flow and stores a local CLI session for private package installs.",
    code: "aipm login",
    options: ["--registry <url>: login for another registry", "--site <url>: use another website origin", "--no-open: print the login URL instead of opening a browser"],
  },
  {
    title: "Show current login",
    description: "Shows the stored CLI account and orgs available to this terminal.",
    code: "aipm whoami",
    options: ["--registry <url>: inspect another registry login", "--json: print machine-readable output"],
  },
  {
    title: "CLI logout",
    description: "Revokes the stored CLI session and removes it from this machine.",
    code: "aipm logout",
    options: ["--registry <url>: logout from another registry"],
  },
];

const useCommands: CommandItem[] = [
  {
    title: "Install configured packages",
    description: "Installs every package already listed in aipm.package.json.",
    code: "aipm install",
    options: ["--target <tool>: install for one tool", "--ci: do not prompt interactively", "--token <token>: override stored login for CI", "--global: use global config"],
  },
  {
    title: "Update packages",
    description: "Finds newer registry versions and reinstalls one package or all configured packages.",
    code: "aipm update",
    options: ["aipm update @scope/name: update one package", "--target <tool>: update for one target", "--token <token>: override stored login for CI", "--ci: do not prompt interactively"],
  },
  {
    title: "Initialize a project",
    description: "Creates aipm.package.json in the current project and records the registry URL.",
    code: "aipm init --target cursor",
    options: ["--target <tool>: set cursor, claude, or * without prompting", "--registry <url>: set a custom registry", "--global: create global config instead of project config"],
  },
  {
    title: "Install one package",
    description: "Adds a package to aipm.package.json and writes target-specific files into the project.",
    code: "aipm add @scope/name@1.0.0 --target cursor --ci",
    options: ["--target <tool>: cursor, claude, or *", "--ci: do not prompt interactively", "--token <token>: override stored login for CI", "--global: install globally"],
  },
  {
    title: "Search packages",
    description: "Searches registry packages. Private matches are included after aipm login.",
    code: "aipm search sentry",
    options: ["--limit <number>: cap result count", "--json: print machine-readable output", "--registry <url>: search another registry", "--token <token>: use an explicit install token"],
  },
  {
    title: "List installed packages",
    description: "Reads aipm-lock.json and shows the package versions installed for this project.",
    code: "aipm list",
    options: ["--global: list global packages"],
  },
  {
    title: "Remove a package",
    description: "Removes a package from AIPM config and lock files; review tool-written files before committing.",
    code: "aipm remove @scope/name",
    options: ["Alias: aipm rm @scope/name", "--global: remove from global config"],
  },
  {
    title: "Show CLI version",
    description: "Confirms that the AIPM command is installed and available on PATH.",
    code: "aipm --version",
    options: ["Alias: aipm -v"],
  },
  {
    title: "Show help",
    description: "Lists the available commands and top-level options.",
    code: "aipm --help",
    options: ["Use aipm <command> --help for command-specific options."],
  },
  {
    title: "Run diagnostics",
    description: "Checks Node, PATH, registry URL, project config, and publish readiness.",
    code: "aipm doctor",
    options: ["--registry <url>: check a specific registry", "--publish: focus on publish readiness", "--json: print machine-readable output"],
  },
  {
    title: "Show resolved config",
    description: "Prints the registry, project config path, install root, and installed packages.",
    code: "aipm config",
    options: ["--registry <url>: override registry for this check", "--global: inspect global AIPM config", "--json: print machine-readable output"],
  },
];

const publishCommands: CommandItem[] = [
  {
    title: "Explain the publish flow",
    description: "Prints the full account, package reservation, token, staging, and push flow.",
    code: "aipm publish explain",
  },
  {
    title: "Create a skill package",
    description: "Creates a package folder with aipm.manifest.json, SKILL.md, .aipmignore, and local publish state.",
    code: "aipm publish init --name @team/review-helper --template code-review --targets cursor",
    options: ["--name <name>: required scoped package name", "--template <name>: blank, code-review, issue-summary, release-notes", "--targets <list>: comma-separated targets", "--dir <dir>: choose output folder", "--here: create files in the current folder"],
  },
  {
    title: "Create a skill package with the skill alias",
    description: "Runs the same local package setup through the top-level skill command group.",
    code: "aipm skill init --name @team/review-helper --template code-review",
    options: ["Options match aipm publish init."],
  },
  {
    title: "Import an existing skill",
    description: "Copies an existing AI-tool skill file or folder into a new AIPM package folder.",
    code: "aipm publish import ~/.codex/skills/review-helper --name @team/review-helper",
    options: ["--name <name>: required package name", "--entry <file>: main file if not SKILL.md", "--targets <list>: supported tools", "--dir <dir>: choose output folder"],
  },
  {
    title: "Open publishing pages",
    description: "Opens the publishing guide or the package dashboard from the terminal.",
    code: "aipm publish open --package @team/review-helper",
    options: ["--docs: open the publishing guide", "--no-open: print the URL instead of opening a browser"],
  },
  {
    title: "Stage files",
    description: "Adds files to the publish bundle while respecting .aipmignore and secret-file exclusions.",
    code: "aipm publish add .",
  },
  {
    title: "Review staged files",
    description: "Shows every staged file and whether it changed after staging.",
    code: "aipm publish status",
    options: ["--json: print machine-readable output"],
  },
  {
    title: "Preview upload",
    description: "Shows package metadata, staged files, total size, and warnings before publishing.",
    code: "aipm publish preview",
    options: ["--json: print machine-readable output"],
  },
  {
    title: "Show staged changes",
    description: "Lists staged files whose content changed after you last ran publish add.",
    code: "aipm publish diff",
  },
  {
    title: "Validate package",
    description: "Checks the manifest, entry file, staged hashes, package size, ignored paths, and obvious secrets.",
    code: "aipm publish validate",
  },
  {
    title: "Open token page",
    description: "Opens the package dashboard so you can generate a 5-minute publish token.",
    code: "aipm publish token --package @team/review-helper",
    options: ["--no-open: print the URL instead of opening a browser"],
  },
  {
    title: "Publish staged files",
    description: "Uploads the staged package version to the registry with a short-lived publish token.",
    code: "AIPM_TOKEN=<5-minute-token> aipm publish push --yes",
    options: ["--token <token>: pass token as a flag", "--registry <url>: publish to another registry", "--yes: skip the final reminder"],
  },
  {
    title: "Publish a package directory directly",
    description: "Publishes a complete directory containing aipm.manifest.json without using the staging flow.",
    code: "AIPM_TOKEN=<5-minute-token> aipm publish ./path/to/skill --registry https://api.aipm-registry.com",
    options: ["--token <token>: pass token as a flag", "--registry <url>: publish to another registry"],
  },
  {
    title: "Remove staged files",
    description: "Removes paths from the publish stage without deleting them from disk.",
    code: "aipm publish remove notes/private.md",
    options: ["Alias: aipm publish rm <files...>"],
  },
  {
    title: "Clear publish stage",
    description: "Clears all staged publish files so you can start staging again.",
    code: "aipm publish reset",
  },
];

export const metadata = pageMetadata({
  title: "AIPM CLI Commands",
  description: "A complete reference for AIPM install, use, and publish commands.",
  path: "/commands",
  keywords: ["AIPM CLI commands", "aipm command reference", "AI package manager CLI", "publish AI skill command"],
});

export default function CommandsPage() {
  return (
    <DocLayout wide>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>CLI reference</p>
        <h1>Every AIPM command in one place.</h1>
        <p className={shell.lede}>
          Use this page when you want the exact command, what it does, and the options that change
          its behavior. The current verified CLI release is <a href={CLI_RELEASE_URL}>AIPM CLI {CLI_VERSION}</a>.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/use">
            Use guide
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/publish/guide">
            Publishing guide
          </Link>
        </div>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Global options</h2>
          <p>Use these with most commands when you need help, quieter output, or extra diagnostics.</p>
          <CodeBlock code={`aipm --help\naipm <command> --help\naipm --verbose <command>\naipm --quiet <command>`} />
        </section>
      </article>

      <CommandSection title="Install AIPM" commands={installCommands} />
      <CommandSection title="Use Packages" commands={useCommands} />
      <CommandSection title="Private Packages" commands={privatePackageCommands} />
      <CommandSection title="Publish Packages" commands={publishCommands} />
    </DocLayout>
  );
}
