#!/usr/bin/env node
import { Command } from "commander";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cwd, env } from "node:process";
import { PackageManifestSchema, isValidScopeName } from "@aipm-registry/schemas";
import { detectToolsInProject } from "@aipm-registry/engine";
import { packDirectory, packStagedFiles } from "./pack.js";
import { publishPackage } from "./registry-client.js";
import { installOnePackage } from "./install-one.js";
import {
  addPublishFiles,
  removePublishFiles,
  resetPublishState,
  statusPublishState,
  validatePublishState,
} from "./publish-state.js";
import {
  parseTargetFlag,
  readProjectPackageJson,
  resolveRegistryUrl,
  writeProjectPackageJson,
} from "./project-files.js";
import { promptForTool } from "./prompt.js";

const program = new Command();
const DEFAULT_REGISTRY = "https://aipm-registry.com";

program.name("aipm").description("AI package manager").version("0.1.1");

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
  await mkdir(join(root, ".aipm"), { recursive: true });
  console.log(`Created ${opts.name} skill files.`);
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
    const registry =
      opts.registry ??
      process.env.AIPM_REGISTRY ??
      DEFAULT_REGISTRY;
    await writeProjectPackageJson(root, {
      schemaVersion: "0.1",
      registry,
      preferredTools: preferredTools.length ? preferredTools : undefined,
      packages: {},
    });
    console.log(`Created aipm.package.json (registry: ${registry})`);
  });

program
  .command("add <package>")
  .description("Add and install a package @scope/name[@version]")
  .option("--registry <url>", "Registry base URL")
  .option("--target <tool>", "cursor or claude")
  .option("--ci", "Non-interactive; fail if prompt needed")
  .action(async (pkgArg: string, opts: { registry?: string; target?: string; ci?: boolean }) => {
    const match = pkgArg.match(/^(@[^@]+)(?:@(.+))?$/);
    if (!match) throw new Error("Package must be @scope/name or @scope/name@version");
    const name = match[1];
    if (!isValidScopeName(name)) throw new Error("Invalid @scope/name");

    const root = cwd();
    let project = await readProjectPackageJson(root);
    if (!project) throw new Error("Run aipm init first");
    const version = match[2] ?? project.packages[name];
    if (!version) throw new Error("Specify version: aipm add @scope/pkg@1.0.0");

    project = {
      ...project,
      packages: { ...project.packages, [name]: version.replace(/^\^/, "") },
    };
    await writeProjectPackageJson(root, project);

    const registry = resolveRegistryUrl(project, opts.registry);
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
  .command("install")
  .description("Install all packages from aipm.package.json")
  .option("--registry <url>", "Registry base URL")
  .option("--target <tool>", "cursor or claude")
  .option("--ci", "Non-interactive")
  .action(async (opts: { registry?: string; target?: string; ci?: boolean }) => {
    const root = cwd();
    const project = await readProjectPackageJson(root);
    if (!project) throw new Error("Run aipm init first");
    const registry = resolveRegistryUrl(project, opts.registry);
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
    const registry = opts.registry ?? env.AIPM_REGISTRY ?? DEFAULT_REGISTRY;
    const result = await publishPackage(registry, manifest.name, tarball, opts.token ?? env.AIPM_TOKEN);
    console.log(`Published ${manifest.name}@${result.version}`);
    console.log(`View: ${registry.replace(/\/$/, "")}/packages/${manifest.name.replace(/^@/, "").replace("/", "/")}/${result.version}`);
    console.log(`Install: aipm add ${manifest.name}@${result.version} --target ${manifest.targets[0]} --ci`);
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
  });

publish
  .command("remove <files...>")
  .alias("rm")
  .description("Remove files from the publish stage")
  .action(async (files: string[]) => {
    const state = await removePublishFiles(cwd(), files);
    console.log(`Staged ${state.files.length} file${state.files.length === 1 ? "" : "s"}.`);
  });

publish
  .command("reset")
  .description("Clear staged publish files")
  .action(async () => {
    await resetPublishState(cwd());
    console.log("Cleared publish stage.");
  });

publish
  .command("status")
  .description("Show staged publish files")
  .action(async () => {
    const rows = await statusPublishState(cwd());
    if (rows.length === 0) {
      console.log("No files staged.");
      return;
    }
    for (const row of rows) {
      console.log(`${row.changed ? "modified" : "staged"} ${row.path} (${row.size} bytes)`);
    }
  });

publish
  .command("diff")
  .description("Show staged files that changed since add")
  .action(async () => {
    const rows = await statusPublishState(cwd());
    const changed = rows.filter((row) => row.changed);
    if (changed.length === 0) {
      console.log("No staged files changed.");
      return;
    }
    for (const row of changed) console.log(`modified ${row.path}`);
  });

publish
  .command("validate")
  .description("Validate staged files before publish")
  .action(async () => {
    const result = await validatePublishState(cwd());
    console.log(`Valid ${result.manifest.name}@${result.manifest.version} (${result.size} bytes staged).`);
  });

publish
  .command("push")
  .description("Publish staged files")
  .option("--registry <url>", "Registry base URL")
  .option("--token <token>", "Publish token")
  .action(async (opts: { registry?: string; token?: string }) => {
    const root = cwd();
    const { manifest } = await validatePublishState(root);
    const registry = opts.registry ?? env.AIPM_REGISTRY ?? DEFAULT_REGISTRY;
    const tarball = await packStagedFiles(root);
    const result = await publishPackage(registry, manifest.name, tarball, opts.token ?? env.AIPM_TOKEN);
    const base = registry.replace(/\/$/, "");
    console.log(`Published ${manifest.name}@${result.version}`);
    console.log(`View: ${base}/packages/${manifest.name.replace(/^@/, "")}/${result.version}`);
    console.log(`Install: aipm add ${manifest.name}@${result.version} --target ${manifest.targets[0]} --ci`);
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

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
