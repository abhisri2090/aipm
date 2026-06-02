#!/usr/bin/env node
import { Command } from "commander";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cwd, env } from "node:process";
import { PackageManifestSchema, isValidScopeName } from "@aipm-registry/schemas";
import { detectToolsInProject } from "@aipm-registry/engine";
import { packDirectory, packStagedFiles } from "./pack.js";
import { publishPackage, searchPackages } from "./registry-client.js";
import { installOnePackage } from "./install-one.js";
import { runDoctor } from "./doctor.js";
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
  readLockfile,
  readProjectPackageJson,
  resolveRegistryUrl,
  writeLockfile,
  writeProjectPackageJson,
} from "./project-files.js";
import { promptForTool } from "./prompt.js";

const program = new Command();
const DEFAULT_REGISTRY = "https://api.aipm-registry.com";
const SITE_URL = "https://aipm-registry.com";
const PUBLISH_DOC_URL = "https://aipm-registry.com/publish";
const DASHBOARD_URL = "https://aipm-registry.com/dashboard";

program
  .name("aipm")
  .description("AI package manager")
  .version("0.1.2", "-v, --version", "output the current version")
  .option("--verbose", "Print extra diagnostic output")
  .option("--quiet", "Reduce non-essential output")
  .addHelpText(
    "after",
    `

Examples:
  $ npm install -g @aipm-registry/cli
  $ aipm doctor
  $ aipm init
  $ aipm search sentry
  $ aipm add @scope/name@1.0.0 --target cursor --ci
  $ aipm publish init --name @org/skill
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
  console.log("3. Create local skill files: aipm publish init --name @team/review-helper");
  console.log("4. Edit SKILL.md and any files the skill needs.");
  console.log("5. Stage files: aipm publish add .");
  console.log("6. Review files: aipm publish status");
  console.log("7. Preview package: aipm publish preview");
  console.log("8. Validate package: aipm publish validate");
  console.log("9. Generate a 5-minute token from the dashboard.");
  console.log("10. Push: AIPM_TOKEN=<token> aipm publish push --yes");
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

function parseTargets(value: string): Array<"cursor" | "claude"> {
  const targets = value
    .split(",")
    .map((target) => target.trim())
    .filter(Boolean);
  if (targets.length === 0) throw new Error("At least one target is required.");
  for (const target of targets) {
    if (target !== "cursor" && target !== "claude") {
      throw new Error('--targets must contain only "cursor" and/or "claude"');
    }
  }
  return [...new Set(targets)] as Array<"cursor" | "claude">;
}

async function initSkill(opts: {
  name: string;
  version: string;
  description: string;
  targets: string;
  entry: string;
}): Promise<void> {
  if (!isValidScopeName(opts.name)) throw new Error("Invalid @scope/name");
  const root = cwd();
  const manifest = {
    schemaVersion: "0.1",
    name: opts.name,
    version: opts.version,
    type: "skill",
    description: opts.description,
    entry: opts.entry,
    targets: parseTargets(opts.targets),
    license: "Apache-2.0",
  };
  PackageManifestSchema.parse(manifest);
  await writeFile(join(root, "aipm.manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  await writeFile(
    join(root, opts.entry),
    `# ${opts.name}\n\nDescribe what this skill does and how an AI assistant should use it.\n`,
    "utf8",
  );
  await writeFile(
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
    "utf8",
  );
  await mkdir(join(root, ".aipm"), { recursive: true });
  console.log(`Created ${opts.name} skill files.`);
  printPublishGuide(
    `Created aipm.manifest.json, ${opts.entry}, .aipmignore, and the local publish state folder.`,
    "Edit the skill files, then run aipm publish add .",
  );
}

program
  .command("init")
  .description("Create aipm.package.json in the current project")
  .option("--registry <url>", "Default registry URL")
  .action(async (opts: { registry?: string }) => {
    const root = cwd();
    const existing = await readProjectPackageJson(root);
    if (existing) {
      console.log("aipm.package.json already exists.");
      return;
    }
    const detected = await detectToolsInProject(root);
    let preferredTools = detected;
    if (detected.length === 0) {
      const choice = await promptForTool();
      preferredTools = [choice];
    }
    const registry = registryFromEnvOrDefault(opts.registry);
    await writeProjectPackageJson(root, {
      schemaVersion: "0.1",
      registry,
      preferredTools: preferredTools.length ? preferredTools : undefined,
      packages: {},
    });
    console.log(`Created aipm.package.json (registry: ${registry})`);
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
  .option("--registry <url>", "Registry base URL")
  .option("--json", "Print machine-readable JSON")
  .action(async (opts: { registry?: string; json?: boolean }) => {
    const root = cwd();
    const project = await readProjectPackageJson(root);
    const lock = await readLockfile(root);
    const registry = resolveRegistryUrl(project, opts.registry, DEFAULT_REGISTRY);
    const data = {
      cliVersion: "0.1.2",
      nodeVersion: process.versions.node,
      cwd: root,
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
    console.log(`Project: ${data.cwd}`);
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
  .option("--registry <url>", "Registry base URL")
  .option("--target <tool>", "cursor or claude")
  .option("--ci", "Non-interactive; fail if prompt needed")
  .action(async (pkgArg: string, opts: { registry?: string; target?: string; ci?: boolean }) => {
    const { name, version: requestedVersion } = parsePackageArg(pkgArg);

    const root = cwd();
    let project = await readProjectPackageJson(root);
    if (!project) throw new Error("Run aipm init first");
    const registry = resolveRegistryUrl(project, opts.registry, DEFAULT_REGISTRY);
    const version = requestedVersion ?? project.packages[name] ?? (await latestVersionForPackage(registry, name));
    if (!version) throw new Error("Specify version: aipm add @scope/pkg@1.0.0");

    project = {
      ...project,
      packages: { ...project.packages, [name]: version.replace(/^\^/, "") },
    };
    await writeProjectPackageJson(root, project);

    await installOnePackage({
      projectRoot: root,
      registry,
      name,
      version: version.replace(/^\^/, ""),
      project,
      explicitTarget: parseTargetFlag(opts.target),
      ci: opts.ci,
    });
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
    }
  });

program
  .command("install")
  .description("Install all packages from aipm.package.json")
  .option("--registry <url>", "Registry base URL")
  .option("--target <tool>", "cursor or claude")
  .option("--ci", "Non-interactive")
  .action(async (opts: { registry?: string; target?: string; ci?: boolean }) => {
    const root = cwd();
    const project = await readProjectPackageJson(root);
    if (!project) throw new Error("Run aipm init first");
    const registry = resolveRegistryUrl(project, opts.registry, DEFAULT_REGISTRY);
    const target = parseTargetFlag(opts.target);

    for (const [name, version] of Object.entries(project.packages)) {
      await installOnePackage({
        projectRoot: root,
        registry,
        name,
        version: version.replace(/^\^/, ""),
        project,
        explicitTarget: target,
        ci: opts.ci,
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
  .action(
    async (opts: {
      name: string;
      version: string;
      description: string;
      targets: string;
      entry: string;
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
  .action(initSkill);

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
  .action(async () => {
    const { readLockfile } = await import("./project-files.js");
    const lock = await readLockfile(cwd());
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
  .action(async (pkgArg: string) => {
    const { name } = parsePackageArg(pkgArg);
    const root = cwd();
    const project = await readProjectPackageJson(root);
    if (!project) throw new Error("Run aipm init first");
    const packages = { ...project.packages };
    delete packages[name];
    await writeProjectPackageJson(root, { ...project, packages });

    const lock = await readLockfile(root);
    if (lock) {
      const lockPackages = { ...lock.packages };
      delete lockPackages[name];
      await writeLockfile(root, { ...lock, packages: lockPackages });
    }
    console.log(`Removed ${name} from AIPM project files.`);
    console.log("Adapter-written files are not deleted yet; review your project before committing.");
  });

program
  .command("update [package]")
  .description("Update one installed package, or all installed packages, to the latest registry version")
  .option("--registry <url>", "Registry base URL")
  .option("--target <tool>", "cursor or claude")
  .option("--ci", "Non-interactive")
  .action(async (pkgArg: string | undefined, opts: { registry?: string; target?: string; ci?: boolean }) => {
    const root = cwd();
    let project = await readProjectPackageJson(root);
    if (!project) throw new Error("Run aipm init first");
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
      await writeProjectPackageJson(root, project);
      await installOnePackage({
        projectRoot: root,
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
  .option("--registry <url>", "Registry base URL")
  .option("--json", "Print machine-readable JSON")
  .option("--publish", "Only show publish-readiness checks")
  .action((opts: { registry?: string; json?: boolean; publish?: boolean }) => runDoctor(opts));

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
