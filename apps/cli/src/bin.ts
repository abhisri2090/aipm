#!/usr/bin/env node
import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import { PackageManifestSchema, isValidScopeName } from "@aipm/schemas";
import { detectToolsInProject } from "@aipm/engine";
import { packDirectory } from "./pack.js";
import { publishPackage } from "./registry-client.js";
import { installOnePackage } from "./install-one.js";
import {
  parseTargetFlag,
  readProjectPackageJson,
  resolveRegistryUrl,
  writeProjectPackageJson,
} from "./project-files.js";
import { promptForTool } from "./prompt.js";

const program = new Command();

program.name("aipm").description("AI package manager").version("0.0.0");

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
      "http://localhost:8080";
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
  .command("publish <dir>")
  .description("Publish a skill folder to the registry")
  .requiredOption("--registry <url>", "Registry base URL")
  .action(async (dir: string, opts: { registry: string }) => {
    const abs = resolve(dir);
    const manifestRaw = await readFile(join(abs, "aipm.manifest.json"), "utf8");
    const manifest = PackageManifestSchema.parse(JSON.parse(manifestRaw));
    const tarball = await packDirectory(abs);
    const result = await publishPackage(opts.registry, manifest.name, tarball);
    console.log(`Published ${manifest.name}@${result.version}`);
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
