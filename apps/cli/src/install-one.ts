import { installSkillPackage } from "@aipm-registry/engine";
import type {
  AiTool,
  Lockfile,
  LockfilePackageEntry,
  PackageInstall,
} from "@aipm-registry/schemas";
import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import { basename, dirname, join, normalize, relative, resolve, sep } from "node:path";
import { unpackTarballToDirectory } from "./pack.js";
import {
  assertRegistryReachable,
  fetchPackageMetadata,
  fetchPackageTarball,
} from "./registry-client.js";
import {
  readLockfile,
  upsertLockEntry,
  writeLockfile,
  type ProjectPackageJson,
} from "./project-files.js";
import { promptForTool } from "./prompt.js";

export interface InstallOneOptions {
  /** Directory for aipm-lock.json reads and writes */
  configRoot: string;
  /** Directory for tool detection and adapter installs (.cursor/, .claude/) */
  installRoot?: string;
  registry: string;
  name: string;
  version: string;
  project: ProjectPackageJson;
  explicitTarget?: AiTool;
  ci?: boolean;
  token?: string;
}

export type InstalledPackageAssets = {
  main: string[];
  helper: string[];
};

function normalizeRelativePath(path: string): string {
  return normalize(path).split(sep).join("/");
}

function assertSafeRelativePath(path: string): string {
  const rel = normalizeRelativePath(path.trim());
  if (!rel || rel === "." || rel.startsWith("/") || rel === ".." || rel.startsWith("../") || rel.includes("/../")) {
    throw new Error(`Unsafe install path: ${path}`);
  }
  return rel;
}

function safeJoin(root: string, relPath: string): string {
  const rel = assertSafeRelativePath(relPath);
  const target = resolve(root, rel);
  const fromRoot = normalizeRelativePath(relative(root, target));
  if (fromRoot === ".." || fromRoot.startsWith("../") || fromRoot.startsWith("/")) {
    throw new Error(`Unsafe install path: ${relPath}`);
  }
  return target;
}

function packageHelperSlug(name: string): string {
  const [scope = "", pkg = ""] = name.replace(/^@/, "").split("/");
  return `${scope}__${pkg}`;
}

function helperRootFor(configRoot: string, packageName: string, version: string): string {
  const base = basename(configRoot) === ".aipm" ? join(configRoot, "helpers") : join(configRoot, ".aipm", "helpers");
  return join(base, packageHelperSlug(packageName), version);
}

async function assertSourceFile(packageRoot: string, relPath: string): Promise<string> {
  const source = safeJoin(packageRoot, relPath);
  const info = await stat(source).catch(() => null);
  if (!info?.isFile()) throw new Error(`Package install file not found: ${relPath}`);
  return source;
}

async function copyMainFile(input: {
  packageRoot: string;
  installRoot: string;
  file: NonNullable<PackageInstall["mainFiles"]>[number];
}): Promise<string | null> {
  const source = await assertSourceFile(input.packageRoot, input.file.from);
  const target = safeJoin(input.installRoot, input.file.to);
  const overwrite = input.file.overwrite ?? "fail";
  const exists = await stat(target).catch(() => null);
  if (exists) {
    if (overwrite === "skip") return null;
    if (overwrite === "fail") throw new Error(`Install target already exists: ${target}`);
  }
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target, { force: overwrite === "replace" });
  return target;
}

async function copyHelperFile(input: {
  packageRoot: string;
  helperRoot: string;
  file: NonNullable<PackageInstall["helperFiles"]>[number];
}): Promise<string> {
  const source = await assertSourceFile(input.packageRoot, input.file.from);
  const target = safeJoin(input.helperRoot, input.file.to ?? basename(input.file.from));
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target, { force: true });
  return target;
}

async function installPackageAssets(options: {
  configRoot: string;
  installRoot: string;
  packageRoot: string;
  packageName: string;
  version: string;
  install?: PackageInstall;
}): Promise<{ assets: InstalledPackageAssets; postInstall?: LockfilePackageEntry["postInstall"] }> {
  const assets: InstalledPackageAssets = { main: [], helper: [] };
  const install = options.install;
  if (!install) return { assets };

  for (const file of install.mainFiles ?? []) {
    const copied = await copyMainFile({
      packageRoot: options.packageRoot,
      installRoot: options.installRoot,
      file,
    });
    if (copied) assets.main.push(copied);
  }

  const helperRoot = helperRootFor(options.configRoot, options.packageName, options.version);
  if ((install.helperFiles ?? []).length > 0) {
    await rm(helperRoot, { recursive: true, force: true });
  }
  for (const file of install.helperFiles ?? []) {
    assets.helper.push(await copyHelperFile({ packageRoot: options.packageRoot, helperRoot, file }));
  }

  if (!install.postInstall) return { assets };
  const promptFile = safeJoin(helperRoot, install.postInstall.promptFile);
  if (!assets.helper.includes(promptFile)) {
    throw new Error(`Post-install prompt was not installed: ${install.postInstall.promptFile}`);
  }
  return {
    assets,
    postInstall: {
      mode: "manual_prompt",
      status: "pending",
      promptFile,
      cleanup: install.postInstall.cleanup ?? "manual",
    },
  };
}

function printPostInstallNotice(name: string, postInstall?: LockfilePackageEntry["postInstall"]): void {
  if (!postInstall || postInstall.mode !== "manual_prompt") return;
  console.log("");
  console.log("This package requires AI-assisted setup.");
  console.log(`Prompt saved to: ${postInstall.promptFile}`);
  console.log(`Run: aipm show-prompt ${name}`);
  console.log(`After setup, run: aipm cleanup ${name}`);
}

export async function installOnePackage(options: InstallOneOptions): Promise<void> {
  const configRoot = options.configRoot;
  const installRoot = options.installRoot ?? configRoot;
  await assertRegistryReachable(options.registry);
  const { manifest, integrity: remoteIntegrity, deprecated } = await fetchPackageMetadata(
    options.registry,
    options.name,
    options.version,
    options.token,
  );
  if (deprecated) {
    console.warn(
      `Warning: ${options.name} is deprecated${deprecated.message ? `: ${deprecated.message}` : ""}.`,
    );
  }

  let explicitTarget = options.explicitTarget;
  let preferredTools = options.project.preferredTools;

  const { resolveInstallTools } = await import("@aipm-registry/engine");
  let tools = await resolveInstallTools({
    projectRoot: installRoot,
    manifest,
    preferredTools,
    explicitTarget,
  });

  if (tools.length === 0) {
    if (options.ci) {
      throw new Error(
        "No tool detected. Use --target cursor|claude|* in CI mode.",
      );
    }
    const choice = await promptForTool();
    explicitTarget = choice;
    preferredTools = [choice];
    tools = await resolveInstallTools({
      projectRoot: installRoot,
      manifest,
      preferredTools,
      explicitTarget,
    });
  }

  const tarball = await fetchPackageTarball(
    options.registry,
    options.name,
    options.version,
    options.token,
  );
  const packageRoot = await unpackTarballToDirectory(tarball);
  try {
    const skillMarkdown = await readFile(safeJoin(packageRoot, manifest.entry), "utf8");

    const result = await installSkillPackage({
      projectRoot: installRoot,
      manifest,
      skillMarkdown,
      preferredTools,
      explicitTarget,
    });

    const { assets, postInstall } = await installPackageAssets({
      configRoot,
      installRoot,
      packageRoot,
      packageName: options.name,
      version: options.version,
      install: manifest.install,
    });

    const lock: Lockfile = (await readLockfile(configRoot)) ?? {
      schemaVersion: "0.1",
      packages: {},
    };

    const installed: LockfilePackageEntry["installed"] = {};
    for (const tool of result.resolvedTools) {
      const paths = result.installed[tool];
      if (paths) installed[tool] = paths;
    }

    await writeLockfile(
      configRoot,
      upsertLockEntry(lock, options.name, {
        version: options.version,
        integrity: remoteIntegrity,
        registry: options.registry,
        resolvedTools: result.resolvedTools,
        installed,
        ...(assets.main.length || assets.helper.length ? { installedAssets: assets } : {}),
        ...(postInstall ? { postInstall } : {}),
      }),
    );

    console.log(`Installed ${options.name}@${options.version} → ${result.resolvedTools.join(", ")}`);
    printPostInstallNotice(options.name, postInstall);
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
}
