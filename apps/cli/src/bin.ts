#!/usr/bin/env node
import { Command } from "commander";
import { execFile } from "node:child_process";
import { cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { cwd, env } from "node:process";
import {
  PackageManifestSchema,
  isValidScopeName,
  type AiTool,
  type PackageManifest,
} from "@aipm-registry/schemas";
import { detectToolsInProject } from "@aipm-registry/engine";
import { packDirectory, packStagedFiles } from "./pack.js";
import { publishPackage, searchPackages } from "./registry-client.js";
import { installOnePackage } from "./install-one.js";
import { runDoctor } from "./doctor.js";
import {
  initRequiredMessage,
  resolveConfigRoot,
  resolveInstallRoot,
  scopeLabel,
  type ProjectScopeOptions,
} from "./project-root.js";
import {
  addPublishFiles,
  readManifest,
  removePublishFiles,
  resetPublishState,
  statusPublishState,
  validatePublishState,
} from "./publish-state.js";
import {
  parseTargetFlag,
  parseTargetsFlag,
  readLockfile,
  readProjectPackageJson,
  resolveRegistryUrl,
  writeLockfile,
  writeProjectPackageJson,
} from "./project-files.js";
import { promptForTool } from "./prompt.js";
import { getCliVersion } from "./version.js";
import { notifyCliUpdateIfNeeded } from "./cli-update-check.js";

const CLI_VERSION = getCliVersion();
const program = new Command();
const DEFAULT_REGISTRY = "https://api.aipm-registry.com";
const SITE_URL = "https://aipm-registry.com";
const PUBLISH_DOC_URL = "https://aipm-registry.com/publish";
const DASHBOARD_URL = "https://aipm-registry.com/dashboard";
const GLOBAL_OPTION = "-g, --global";
const GLOBAL_OPTION_DESC =
  "Use global config (~/.aipm) and install skills under your home directory";

type ScopedCommandOptions = ProjectScopeOptions;

program
  .name("aipm")
  .description("AI package manager")
  .enablePositionalOptions()
  .version(CLI_VERSION, "-v, --version", "output the current version")
  .option("--verbose", "Print extra diagnostic output")
  .option("--quiet", "Reduce non-essential output")
  .addHelpText(
    "after",
    `

Examples:
  $ npm install -g @aipm-registry/cli
  $ aipm doctor
  $ aipm init
  $ aipm init -g
  $ aipm search sentry
  $ aipm add @scope/name@1.0.0 --target cursor --ci
  $ aipm add @scope/name -g
  $ aipm publish init --name @org/skill
  $ cd skill
  $ aipm publish add .
  $ AIPM_TOKEN=<token> aipm publish push
`,
  );

function registryFromEnvOrDefault(flag?: string): string {
  return resolveRegistryUrl(null, flag, DEFAULT_REGISTRY);
}

function parsePackageArg(value: string): { name: string; version?: string } {
  const match = value.match(/^(@[^@]+)(?:@(.+))?$/);
  if (!match) throw new Error("Package must be @scope/name or @scope/name@version");
  const name = match[1];
  if (!isValidScopeName(name)) throw new Error("Invalid @scope/name");
  return { name, version: match[2] };
}

function skillFolderName(name: string): string {
  const parsed = parsePackageArg(name);
  const folder = parsed.name.split("/").pop();
  if (!folder) throw new Error("Invalid @scope/name");
  return folder;
}

async function writeStarterFile(path: string, content: string): Promise<void> {
  await writeFile(path, content, { encoding: "utf8", flag: "wx" });
}

async function inferEntryFromSource(source: string, fallback: string): Promise<string> {
  const sourceInfo = await stat(source);
  if (sourceInfo.isFile()) return basename(source);
  if (!sourceInfo.isDirectory()) return fallback;
  const entries = await readdir(source);
  if (entries.includes(fallback)) return fallback;
  return entries.find((entry) => entry.endsWith(".md")) ?? entries.find((entry) => entry.endsWith(".mdc")) ?? fallback;
}

async function copySourceIntoSkillRoot(source: string, root: string, sourceLabel: string): Promise<void> {
  const sourceInfo = await stat(source);
  await mkdir(root, { recursive: true });
  if (sourceInfo.isDirectory()) {
    const entries = await readdir(source);
    for (const entry of entries) {
      await cp(join(source, entry), join(root, entry), {
        recursive: true,
        force: false,
        errorOnExist: true,
      });
    }
    return;
  }
  if (sourceInfo.isFile()) {
    await cp(source, join(root, basename(source)), { force: false, errorOnExist: true });
    return;
  }
  throw new Error(`Unsupported source path: ${sourceLabel}`);
}

async function latestVersionForPackage(registry: string, name: string): Promise<string> {
  const packages = await searchPackages(registry, name, 20);
  const exact = packages.find((pkg) => pkg.name === name);
  if (!exact) throw new Error(`Package not found in registry: ${name}`);
  return exact.version;
}

function printPublishGuide(done: string, next: string): void {
  console.log(`Done: ${done}`);
  console.log(`Next: ${next}`);
  console.log(`Guide: ${PUBLISH_DOC_URL}`);
}

function formatBytes(bytes?: number): string | null {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0] ?? "KB";
  for (const nextUnit of units.slice(1)) {
    if (value < 1024) break;
    value /= 1024;
    unit = nextUnit;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
}

function packageDashboardUrl(name?: string): string {
  if (!name) return DASHBOARD_URL;
  return `${DASHBOARD_URL}/packages/${name.replace(/^@/, "")}`;
}

async function openUrl(url: string): Promise<void> {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  await new Promise<void>((resolveOpen) => {
    execFile(command, args, { timeout: 5000 }, () => resolveOpen());
  });
  console.log(`Open: ${url}`);
}

function printPublishFlow(): void {
  console.log("AIPM publish flow");
  console.log("1. Create an account and organization in the dashboard.");
  console.log("2. Reserve a package name such as @team/review-helper.");
  console.log("3. Create a package folder: aipm publish init --name @team/review-helper");
  console.log("4. Move into it: cd review-helper");
  console.log("5. Edit SKILL.md and any files the skill needs.");
  console.log("6. Stage files: aipm publish add .");
  console.log("7. Review files: aipm publish status (optional)");
  console.log("8. Preview package: aipm publish preview (optional)");
  console.log("9. Validate package: aipm publish validate (optional)");
  console.log("10. Open the dashboard token page: aipm publish token --package @team/review-helper (optional)");
  console.log("11. Push: AIPM_TOKEN=<token> aipm publish push --yes");
  console.log(`Guide: ${PUBLISH_DOC_URL}`);
}

async function printPublishPreview(root: string, json?: boolean): Promise<void> {
  const manifest = await readManifest(root);
  const rows = await statusPublishState(root);
  const changed = rows.filter((row) => row.changed);
  const size = rows.reduce((total, row) => total + row.size, 0);
  const preview = {
    package: `${manifest.name}@${manifest.version}`,
    description: manifest.description,
    targets: manifest.targets,
    entry: manifest.entry,
    files: rows.map((row) => ({ path: row.path, size: row.size, changed: row.changed })),
    totalBytes: size,
    warnings: [
      ...(rows.length === 0 ? ["No files are staged."] : []),
      ...(changed.length > 0 ? [`${changed.length} staged file(s) changed after add.`] : []),
      ...(!rows.some((row) => row.path === "aipm.manifest.json") ? ["aipm.manifest.json is not staged."] : []),
      ...(!rows.some((row) => row.path === manifest.entry) ? [`Manifest entry is not staged: ${manifest.entry}`] : []),
    ],
  };
  if (json) {
    console.log(JSON.stringify(preview, null, 2));
    return;
  }
  console.log(`Package: ${preview.package}`);
  console.log(`Description: ${preview.description}`);
  console.log(`Targets: ${preview.targets.join(", ")}`);
  console.log(`Entry: ${preview.entry}`);
  console.log(`Total: ${preview.files.length} file${preview.files.length === 1 ? "" : "s"}, ${preview.totalBytes} bytes`);
  for (const file of preview.files) {
    console.log(`${file.changed ? "modified" : "staged"} ${file.path} (${file.size} bytes)`);
  }
  if (preview.warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of preview.warnings) console.log(`  ${warning}`);
  }
  printPublishGuide(
    `Previewed ${preview.package} before upload.`,
    preview.warnings.length > 0 ? "Fix the warnings, then run aipm publish preview again." : "Run aipm publish validate.",
  );
}


const SKILL_TEMPLATES = {
  blank: (name: string) => `# ${name}

Describe what this skill does and how an AI assistant should use it.
`,
  "code-review": (name: string) => `# ${name}

Use this skill to review code changes in this project.

## Goal
- Identify correctness, security, reliability, and maintainability issues.
- Point to specific files or code when possible.
- Prioritize actionable findings over broad style feedback.

## Review checklist
- Confirm the change matches the requested behavior.
- Look for edge cases, missing validation, and risky assumptions.
- Check whether tests cover the changed behavior.
- Call out secrets, credentials, or private data if they appear in files.

## Output
Return findings first, ordered by severity. If there are no findings, say that clearly and mention any remaining test gaps.
`,
  "issue-summary": (name: string) => `# ${name}

Use this skill to summarize product, support, or error-tracking issues for triage.

## Goal
- Turn raw issue notes into a concise engineering summary.
- Separate known facts from guesses.
- Identify owner, impact, urgency, and next debugging steps.

## Inputs to look for
- Error messages, stack traces, user reports, screenshots, logs, and recent deploys.
- Reproduction steps and affected environments.

## Output
Include summary, impact, likely cause, evidence, open questions, and recommended next action.
`,
  "release-notes": (name: string) => `# ${name}

Use this skill to draft release notes from project changes.

## Goal
- Explain what changed in user-facing language.
- Separate features, fixes, operational notes, and breaking changes.
- Keep internal implementation details out unless users need them.

## Output
Create a concise release note with sections for highlights, fixes, upgrade notes, and known issues.
`,
} as const;

type SkillTemplate = keyof typeof SKILL_TEMPLATES;

function parseSkillTemplate(value: string): SkillTemplate {
  if (value in SKILL_TEMPLATES) return value as SkillTemplate;
  throw new Error(`Unknown template "${value}". Use one of: ${Object.keys(SKILL_TEMPLATES).join(", ")}`);
}

async function initSkill(opts: {
  name: string;
  version: string;
  description: string;
  targets: string;
  entry: string;
  template?: string;
  dir?: string;
  here?: boolean;
  from?: string;
}): Promise<void> {
  if (!isValidScopeName(opts.name)) throw new Error("Invalid @scope/name");
  const root = opts.here ? cwd() : resolve(cwd(), opts.dir ?? skillFolderName(opts.name));
  const cdTarget = opts.here ? null : (opts.dir ?? skillFolderName(opts.name));
  const source = opts.from ? resolve(opts.from) : null;
  const entry = source ? await inferEntryFromSource(source, opts.entry) : opts.entry;
  const manifest: PackageManifest = PackageManifestSchema.parse({
    schemaVersion: "0.1",
    name: opts.name,
    version: opts.version,
    type: "skill",
    description: opts.description,
    entry,
    targets: parseTargetsFlag(opts.targets),
    license: "Apache-2.0",
  });
  if (source) {
    await copySourceIntoSkillRoot(source, root, source);
  } else {
    await mkdir(root, { recursive: true });
  }
  await writeStarterFile(join(root, "aipm.manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  if (!opts.from) {
    const template = parseSkillTemplate(opts.template ?? "blank");
    await writeStarterFile(
      join(root, entry),
      SKILL_TEMPLATES[template](opts.name),
    );
  }
  await writeStarterFile(
    join(root, ".aipmignore"),
    [
      "# Files that should never be published with this skill",
      ".env*",
      ".git/",
      ".aipm/",
      "node_modules/",
      "dist/",
      ".next/",
      "*.log",
      "*.pem",
      "*.key",
      "*.pfx",
      "*.p12",
      "*.publishsettings",
      "",
    ].join("\n"),
  );
  await mkdir(join(root, ".aipm"), { recursive: true });
  console.log(`Created ${opts.name} skill folder: ${root}`);
  printPublishGuide(
    opts.from
      ? `Copied ${opts.from} into ${root} and created aipm.manifest.json, .aipmignore, and the local publish state folder.`
      : `Created ${root} with aipm.manifest.json, ${entry}, .aipmignore, and the local publish state folder.`,
    cdTarget
      ? `Run cd ${cdTarget}, edit/review the files, then run aipm publish add .`
      : "Edit/review the files, then run aipm publish add .",
  );
}

program
  .command("init")
  .description("Create aipm.package.json in the current project or globally")
  .option(GLOBAL_OPTION, GLOBAL_OPTION_DESC)
  .option("--registry <url>", "Default registry URL")
  .action(async (opts: { registry?: string; global?: boolean }) => {
    const scope: ScopedCommandOptions = { global: opts.global };
    const configRoot = resolveConfigRoot(scope);
    const existing = await readProjectPackageJson(configRoot);
    if (existing) {
      console.log(`aipm.package.json already exists (${scopeLabel(scope)}).`);
      return;
    }
    if (scope.global) await mkdir(configRoot, { recursive: true });
    const installRoot = resolveInstallRoot(scope);
    const detected = await detectToolsInProject(installRoot);
    let preferredTools: AiTool[] = detected;
    if (detected.length === 0) {
      const choice = await promptForTool();
      preferredTools = [choice];
    }
    const registry = registryFromEnvOrDefault(opts.registry);
    await writeProjectPackageJson(configRoot, {
      schemaVersion: "0.1",
      registry,
      preferredTools: preferredTools.length ? preferredTools : undefined,
      packages: {},
    });
    console.log(`Created aipm.package.json (${scopeLabel(scope)}, registry: ${registry})`);
  });

program
  .command("login")
  .description("Open the AIPM dashboard sign-in page")
  .option("--no-open", "Print the URL without opening a browser")
  .action(async (opts: { open: boolean }) => {
    const url = `${SITE_URL}/login`;
    console.log("AIPM uses the website dashboard for account sign-in and short-lived publish tokens.");
    console.log("After signing in, create or open an organization, reserve a package, and generate a token.");
    if (opts.open) await openUrl(url);
    else console.log(`Open: ${url}`);
  });

program
  .command("config")
  .description("Show resolved AIPM CLI and project configuration")
  .option(GLOBAL_OPTION, GLOBAL_OPTION_DESC)
  .option("--registry <url>", "Registry base URL")
  .option("--json", "Print machine-readable JSON")
  .action(async (opts: { global?: boolean; registry?: string; json?: boolean }) => {
    const scope: ScopedCommandOptions = { global: opts.global };
    const configRoot = resolveConfigRoot(scope);
    const installRoot = resolveInstallRoot(scope);
    const project = await readProjectPackageJson(configRoot);
    const lock = await readLockfile(configRoot);
    const registry = resolveRegistryUrl(project, opts.registry, DEFAULT_REGISTRY);
    const data = {
      cliVersion: CLI_VERSION,
      nodeVersion: process.versions.node,
      scope: scopeLabel(scope),
      configRoot,
      installRoot,
      cwd: cwd(),
      registry,
      envRegistry: env.AIPM_REGISTRY_URL ?? env.AIPM_REGISTRY ?? null,
      hasProjectConfig: Boolean(project),
      projectPackages: project ? Object.keys(project.packages) : [],
      hasLockfile: Boolean(lock),
      installedPackages: lock ? Object.keys(lock.packages) : [],
      publishDoc: PUBLISH_DOC_URL,
    };
    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log(`CLI: ${data.cliVersion}`);
    console.log(`Node: ${data.nodeVersion}`);
    console.log(`Scope: ${data.scope}`);
    console.log(`Config: ${data.configRoot}`);
    console.log(`Install root: ${data.installRoot}`);
    console.log(`Working directory: ${data.cwd}`);
    console.log(`Registry: ${data.registry}`);
    console.log(`Env registry: ${data.envRegistry ?? "not set"}`);
    console.log(`Project config: ${data.hasProjectConfig ? "found" : "not found"}`);
    console.log(`Configured packages: ${data.projectPackages.length}`);
    console.log(`Lockfile: ${data.hasLockfile ? "found" : "not found"}`);
    console.log(`Installed packages: ${data.installedPackages.length}`);
    console.log(`Publish guide: ${data.publishDoc}`);
  });

program
  .command("add <package>")
  .description("Add and install a package @scope/name[@version]")
  .option(GLOBAL_OPTION, GLOBAL_OPTION_DESC)
  .option("--registry <url>", "Registry base URL")
  .option("--target <tool>", "cursor, claude, or *")
  .option("--token <token>", "Install token for private packages")
  .option("--ci", "Non-interactive; fail if prompt needed")
  .action(async (pkgArg: string, opts: { global?: boolean; registry?: string; target?: string; token?: string; ci?: boolean }) => {
    const { name, version: requestedVersion } = parsePackageArg(pkgArg);

    const scope: ScopedCommandOptions = { global: opts.global };
    const configRoot = resolveConfigRoot(scope);
    const installRoot = resolveInstallRoot(scope);
    let project = await readProjectPackageJson(configRoot);
    if (!project) throw new Error(initRequiredMessage(scope));
    const registry = resolveRegistryUrl(project, opts.registry, DEFAULT_REGISTRY);
    const version = requestedVersion ?? project.packages[name] ?? (await latestVersionForPackage(registry, name));
    if (!version) throw new Error("Specify version: aipm add @scope/pkg@1.0.0");

    project = {
      ...project,
      packages: { ...project.packages, [name]: version.replace(/^\^/, "") },
    };
    await writeProjectPackageJson(configRoot, project);

    await installOnePackage({
      configRoot,
      installRoot,
      registry,
      name,
      version: version.replace(/^\^/, ""),
      project,
      explicitTarget: parseTargetFlag(opts.target),
      ci: opts.ci,
      token: opts.token ?? process.env.AIPM_TOKEN,
    });

    if (!opts.ci && !program.opts().quiet) {
      await notifyCliUpdateIfNeeded(CLI_VERSION);
    }
  });

program
  .command("search [query]")
  .description("Search public registry packages")
  .option("--registry <url>", "Registry base URL")
  .option("--limit <number>", "Maximum results", "20")
  .option("--json", "Print machine-readable JSON")
  .action(async (query = "", opts: { registry?: string; limit: string; json?: boolean }) => {
    const registry = registryFromEnvOrDefault(opts.registry);
    const packages = await searchPackages(registry, query, Number(opts.limit));
    if (opts.json) {
      console.log(JSON.stringify({ packages }, null, 2));
      return;
    }
    if (packages.length === 0) {
      console.log("No packages found.");
      return;
    }
    for (const pkg of packages) {
      console.log(`${pkg.name}@${pkg.version} [${pkg.targets.join(", ")}]`);
      if (pkg.description) console.log(`  ${pkg.description}`);
      const publisher = pkg.publisher
        ? `${pkg.publisher.user.name ?? `@${pkg.publisher.user.githubLogin}`} in @${pkg.publisher.org.slug}`
        : "publisher unavailable";
      const meta = [publisher, pkg.license ? `license ${pkg.license}` : null, formatBytes(pkg.sizeBytes)]
        .filter(Boolean)
        .join(" | ");
      console.log(`  ${meta}`);
    }
  });

program
  .command("install")
  .description("Install all packages from aipm.package.json")
  .option(GLOBAL_OPTION, GLOBAL_OPTION_DESC)
  .option("--registry <url>", "Registry base URL")
  .option("--target <tool>", "cursor, claude, or *")
  .option("--token <token>", "Install token for private packages")
  .option("--ci", "Non-interactive")
  .action(async (opts: { global?: boolean; registry?: string; target?: string; token?: string; ci?: boolean }) => {
    const scope: ScopedCommandOptions = { global: opts.global };
    const configRoot = resolveConfigRoot(scope);
    const installRoot = resolveInstallRoot(scope);
    const project = await readProjectPackageJson(configRoot);
    if (!project) throw new Error(initRequiredMessage(scope));
    const registry = resolveRegistryUrl(project, opts.registry, DEFAULT_REGISTRY);
    const target = parseTargetFlag(opts.target);

    for (const [name, version] of Object.entries(project.packages)) {
      await installOnePackage({
        configRoot,
        installRoot,
        registry,
        name,
        version: version.replace(/^\^/, ""),
        project,
        explicitTarget: target,
        ci: opts.ci,
        token: opts.token ?? process.env.AIPM_TOKEN,
      });
    }
  });

program
  .command("skill")
  .description("Create and manage local skill packages")
  .command("init")
  .description("Create aipm.manifest.json and SKILL.md")
  .requiredOption("--name <name>", "Package name, e.g. @org/skill")
  .option("--version <version>", "Initial version", "1.0.0")
  .option("--description <description>", "Skill description", "AIPM skill")
  .option("--targets <targets>", "Comma-separated targets", "cursor")
  .option("--entry <entry>", "Entry file", "SKILL.md")
  .option("--template <template>", "Starter SKILL.md template: blank, code-review, issue-summary, release-notes", "blank")
  .option("--dir <dir>", "Create files in this folder")
  .option("--here", "Create files in the current folder instead of a skill-named folder")
  .option("--from <path>", "Copy an existing AI-tool skill file or folder into the package folder")
  .action(
    async (opts: {
      name: string;
      version: string;
      description: string;
      targets: string;
      entry: string;
      template?: string;
      dir?: string;
      here?: boolean;
      from?: string;
    }) => initSkill(opts),
  );

const publish = program
  .command("publish [dir]")
  .description("Stage, validate, and publish a skill package")
  .option("--registry <url>", "Registry base URL")
  .option("--token <token>", "Publish token")
  .action(async (dir: string | undefined, opts: { registry?: string; token?: string }) => {
    if (!dir) {
      publish.help();
      return;
    }
    const abs = resolve(dir);
    const manifestRaw = await readFile(join(abs, "aipm.manifest.json"), "utf8");
    const manifest = PackageManifestSchema.parse(JSON.parse(manifestRaw));
    const tarball = await packDirectory(abs);
    const registry = registryFromEnvOrDefault(opts.registry);
    const result = await publishPackage(registry, manifest.name, tarball, opts.token ?? env.AIPM_TOKEN);
    console.log(`Published ${manifest.name}@${result.version}`);
    console.log(`View: ${registry.replace(/\/$/, "")}/packages/${manifest.name.replace(/^@/, "").replace("/", "/")}/${result.version}`);
    console.log(`Install: aipm add ${manifest.name}@${result.version} --target ${manifest.targets[0]} --ci`);
    printPublishGuide(
      `Published ${manifest.name}@${result.version} from ${abs}.`,
      "Share the install command or open the package page to confirm the listing.",
    );
  });

publish
  .command("init")
  .description("Alias for aipm skill init")
  .requiredOption("--name <name>", "Package name, e.g. @org/skill")
  .option("--version <version>", "Initial version", "1.0.0")
  .option("--description <description>", "Skill description", "AIPM skill")
  .option("--targets <targets>", "Comma-separated targets", "cursor")
  .option("--entry <entry>", "Entry file", "SKILL.md")
  .option("--template <template>", "Starter SKILL.md template: blank, code-review, issue-summary, release-notes", "blank")
  .option("--dir <dir>", "Create files in this folder")
  .option("--here", "Create files in the current folder instead of a skill-named folder")
  .option("--from <path>", "Copy an existing AI-tool skill file or folder into the package folder")
  .action(initSkill);

publish
  .command("import <source>")
  .description("Create a package folder from an existing AI-tool skill file or folder")
  .requiredOption("--name <name>", "Package name, e.g. @org/skill")
  .option("--version <version>", "Initial version", "1.0.0")
  .option("--description <description>", "Skill description", "AIPM skill")
  .option("--targets <targets>", "Comma-separated targets", "cursor")
  .option("--entry <entry>", "Entry file", "SKILL.md")
  .option("--dir <dir>", "Create files in this folder")
  .option("--here", "Create files in the current folder instead of a skill-named folder")
  .action(
    async (
      source: string,
      opts: {
        name: string;
        version: string;
        description: string;
        targets: string;
        entry: string;
        dir?: string;
        here?: boolean;
      },
    ) => initSkill({ ...opts, from: source }),
  );

publish
  .command("add [files...]")
  .description("Stage files for publishing")
  .action(async (files: string[]) => {
    const state = await addPublishFiles(cwd(), files);
    console.log(`Staged ${state.files.length} file${state.files.length === 1 ? "" : "s"}.`);
    printPublishGuide(
      `Added ${files.length > 0 ? files.join(", ") : "."} to the publish stage, respecting .aipmignore and secret-file exclusions.`,
      "Run aipm publish status to review staged files.",
    );
  });

publish
  .command("explain")
  .description("Explain the full publishing flow")
  .action(() => {
    printPublishFlow();
  });

publish
  .command("open")
  .description("Open the publishing guide or package dashboard")
  .option("--package <name>", "Package name, e.g. @org/skill")
  .option("--docs", "Open the publishing guide instead of the dashboard")
  .option("--no-open", "Print the URL without opening a browser")
  .action(async (opts: { package?: string; docs?: boolean; open: boolean }) => {
    const url = opts.docs ? PUBLISH_DOC_URL : packageDashboardUrl(opts.package);
    if (opts.open) await openUrl(url);
    else console.log(`Open: ${url}`);
    printPublishGuide(
      opts.docs ? "Opened the publishing guide." : "Opened the publisher dashboard.",
      "Use the dashboard to reserve names and generate 5-minute publish tokens.",
    );
  });

publish
  .command("token")
  .description("Open the dashboard page used to generate a short-lived publish token")
  .option("--package <name>", "Package name, e.g. @org/skill")
  .option("--no-open", "Print the URL without opening a browser")
  .action(async (opts: { package?: string; open: boolean }) => {
    const url = packageDashboardUrl(opts.package);
    console.log("Publish tokens are generated in the dashboard and are valid for 5 minutes.");
    console.log("AIPM does not store publish tokens locally.");
    if (opts.open) await openUrl(url);
    else console.log(`Open: ${url}`);
    printPublishGuide(
      "Pointed you to the dashboard token flow.",
      "Generate a token, then run AIPM_TOKEN=<token> aipm publish push.",
    );
  });

publish
  .command("remove <files...>")
  .alias("rm")
  .description("Remove files from the publish stage")
  .action(async (files: string[]) => {
    const state = await removePublishFiles(cwd(), files);
    console.log(`Staged ${state.files.length} file${state.files.length === 1 ? "" : "s"}.`);
    printPublishGuide(
      `Removed ${files.join(", ")} from the publish stage.`,
      "Run aipm publish status to review what remains staged.",
    );
  });

publish
  .command("reset")
  .description("Clear staged publish files")
  .action(async () => {
    await resetPublishState(cwd());
    console.log("Cleared publish stage.");
    printPublishGuide(
      "Cleared all staged publish files.",
      "Run aipm publish add . when you are ready to stage files again.",
    );
  });

publish
  .command("status")
  .description("Show staged publish files")
  .option("--json", "Print machine-readable JSON")
  .action(async (opts: { json?: boolean }) => {
    const rows = await statusPublishState(cwd());
    if (opts.json) {
      console.log(JSON.stringify({ files: rows }, null, 2));
      return;
    }
    if (rows.length === 0) {
      console.log("No files staged.");
      printPublishGuide(
        "Checked the publish stage; it is empty.",
        "Run aipm publish add . to stage files.",
      );
      return;
    }
    for (const row of rows) {
      console.log(`${row.changed ? "modified" : "staged"} ${row.path} (${row.size} bytes)`);
    }
    const changed = rows.filter((row) => row.changed);
    printPublishGuide(
      `Reviewed ${rows.length} staged file${rows.length === 1 ? "" : "s"}${changed.length > 0 ? `; ${changed.length} changed after staging` : ""}.`,
      changed.length > 0
        ? "Run aipm publish add . again, then aipm publish validate."
        : "Run aipm publish validate to check the package before pushing.",
    );
  });

publish
  .command("diff")
  .description("Show staged files that changed since add")
  .action(async () => {
    const rows = await statusPublishState(cwd());
    const changed = rows.filter((row) => row.changed);
    if (changed.length === 0) {
      console.log("No staged files changed.");
      printPublishGuide(
        "Checked staged files for changes; none changed after staging.",
        "Run aipm publish validate.",
      );
      return;
    }
    for (const row of changed) console.log(`modified ${row.path}`);
    printPublishGuide(
      `Found ${changed.length} staged file${changed.length === 1 ? "" : "s"} changed after add.`,
      "Run aipm publish add . again to refresh the stage.",
    );
  });

publish
  .command("validate")
  .description("Validate staged files before publish")
  .action(async () => {
    const result = await validatePublishState(cwd());
    console.log(`Valid ${result.manifest.name}@${result.manifest.version} (${result.size} bytes staged).`);
    printPublishGuide(
      `Validated ${result.manifest.name}@${result.manifest.version}; manifest, entry file, staged hashes, ignored paths, package size, and obvious secrets passed.`,
      "Generate a 5-minute token from the dashboard, then run AIPM_TOKEN=<token> aipm publish push.",
    );
  });

publish
  .command("preview")
  .description("Preview exactly what will be uploaded")
  .option("--json", "Print machine-readable JSON")
  .action((opts: { json?: boolean }) => printPublishPreview(cwd(), opts.json));

publish
  .command("push")
  .description("Publish staged files")
  .option("--registry <url>", "Registry base URL")
  .option("--token <token>", "Publish token")
  .option("--yes", "Confirm upload without an extra reminder")
  .action(async (opts: { registry?: string; token?: string; yes?: boolean }) => {
    const root = cwd();
    const { manifest } = await validatePublishState(root);
    const registry = registryFromEnvOrDefault(opts.registry);
    const tarball = await packStagedFiles(root);
    const staged = await statusPublishState(root);
    if (!opts.yes) {
      console.log("Reminder: this publishes an immutable public package version.");
      console.log("Use --yes to skip this reminder in automation.");
    }
    console.log(`Uploading ${staged.length} file${staged.length === 1 ? "" : "s"} to ${registry}.`);
    for (const entry of staged) console.log(`  ${entry.path}`);
    const result = await publishPackage(registry, manifest.name, tarball, opts.token ?? env.AIPM_TOKEN);
    const base = registry.replace(/\/$/, "");
    console.log(`Published ${manifest.name}@${result.version}`);
    console.log(`View: ${base}/packages/${manifest.name.replace(/^@/, "")}/${result.version}`);
    console.log(`Install: aipm add ${manifest.name}@${result.version} --target ${manifest.targets[0]} --ci`);
    printPublishGuide(
      `Published ${manifest.name}@${result.version} to ${registry}.`,
      "Open the registry page, test the install command in a clean project, and share the package link.",
    );
  });

program
  .command("list")
  .description("List packages from aipm-lock.json")
  .option(GLOBAL_OPTION, GLOBAL_OPTION_DESC)
  .action(async (opts: { global?: boolean }) => {
    const configRoot = resolveConfigRoot({ global: opts.global });
    const lock = await readLockfile(configRoot);
    if (!lock || Object.keys(lock.packages).length === 0) {
      console.log("No packages installed.");
      return;
    }
    for (const [name, entry] of Object.entries(lock.packages)) {
      console.log(`${name}@${entry.version} [${entry.resolvedTools.join(", ")}]`);
    }
  });

program
  .command("remove <package>")
  .alias("rm")
  .description("Remove a package from aipm.package.json and aipm-lock.json")
  .option(GLOBAL_OPTION, GLOBAL_OPTION_DESC)
  .action(async (pkgArg: string, opts: { global?: boolean }) => {
    const { name } = parsePackageArg(pkgArg);
    const scope: ScopedCommandOptions = { global: opts.global };
    const configRoot = resolveConfigRoot(scope);
    const project = await readProjectPackageJson(configRoot);
    if (!project) throw new Error(initRequiredMessage(scope));
    const packages = { ...project.packages };
    delete packages[name];
    await writeProjectPackageJson(configRoot, { ...project, packages });

    const lock = await readLockfile(configRoot);
    if (lock) {
      const lockPackages = { ...lock.packages };
      delete lockPackages[name];
      await writeLockfile(configRoot, { ...lock, packages: lockPackages });
    }
    console.log(`Removed ${name} from AIPM ${scopeLabel(scope)} files.`);
    console.log("Adapter-written files are not deleted yet; review your project before committing.");
  });

program
  .command("update [package]")
  .description("Update one installed package, or all installed packages, to the latest registry version")
  .option(GLOBAL_OPTION, GLOBAL_OPTION_DESC)
  .option("--registry <url>", "Registry base URL")
  .option("--target <tool>", "cursor, claude, or *")
  .option("--ci", "Non-interactive")
  .action(async (pkgArg: string | undefined, opts: { global?: boolean; registry?: string; target?: string; ci?: boolean }) => {
    const scope: ScopedCommandOptions = { global: opts.global };
    const configRoot = resolveConfigRoot(scope);
    const installRoot = resolveInstallRoot(scope);
    let project = await readProjectPackageJson(configRoot);
    if (!project) throw new Error(initRequiredMessage(scope));
    const registry = resolveRegistryUrl(project, opts.registry, DEFAULT_REGISTRY);
    const names = pkgArg ? [parsePackageArg(pkgArg).name] : Object.keys(project.packages);
    if (names.length === 0) {
      console.log("No packages configured.");
      return;
    }

    for (const name of names) {
      const version = await latestVersionForPackage(registry, name);
      project = {
        ...project,
        packages: { ...project.packages, [name]: version },
      };
      await writeProjectPackageJson(configRoot, project);
      await installOnePackage({
        configRoot,
        installRoot,
        registry,
        name,
        version,
        project,
        explicitTarget: parseTargetFlag(opts.target),
        ci: opts.ci,
      });
    }
  });

program
  .command("doctor")
  .description("Check PATH, Node, registry, project config, and publish readiness")
  .option(GLOBAL_OPTION, GLOBAL_OPTION_DESC)
  .option("--registry <url>", "Registry base URL")
  .option("--json", "Print machine-readable JSON")
  .option("--publish", "Only show publish-readiness checks")
  .action((opts: { global?: boolean; registry?: string; json?: boolean; publish?: boolean }) => runDoctor(opts));

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  const message = err.message.toLowerCase();
  if (message.includes("token") || message.includes("unauthorized") || message.includes("forbidden")) {
    process.exit(3);
  }
  if (message.includes("registry") || message.includes("fetch") || message.includes("network")) {
    process.exit(4);
  }
  if (message.includes("invalid") || message.includes("required") || message.includes("usage")) {
    process.exit(2);
  }
  process.exit(1);
});
