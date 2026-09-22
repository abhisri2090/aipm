import { installSkillPackage } from "@aipm-registry/engine";
import type {
  AiTool,
  Lockfile,
  LockfilePackageEntry,
  PackageInstall,
} from "@aipm-registry/schemas";
import { cp, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
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
import { offerChoices } from "./ui/recover.js";
import { createSpinner } from "./ui/spinner.js";
import { printNote } from "./ui/note.js";

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
  /**
   * When false, skip aipm-lock.json writes (untracked / --no-init installs).
   * Defaults to true.
   */
  track?: boolean;
}

export type InstalledPackageAssets = {
  main: string[];
  helper: string[];
};

type SkillSupportingFile = {
  path: string;
  content: Uint8Array;
  mode?: number;
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

function installReferencedFiles(install?: PackageInstall): string[] {
  return [
    ...(install?.mainFiles ?? []).map((file) => file.from),
    ...(install?.helperFiles ?? []).map((file) => file.from),
  ];
}

function isRootLicenseOrNotice(path: string): boolean {
  return !path.includes("/") && /^(?:licen[cs]e|notice|copying)(?:$|[._-])/i.test(path);
}

async function listRegularPackageFiles(root: string, current = root): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listRegularPackageFiles(root, absolute));
    } else if (entry.isFile()) {
      files.push(normalizeRelativePath(relative(root, absolute)));
    }
  }
  return files;
}

export async function collectSkillSupportingFiles(
  packageRoot: string,
  manifest: { entry: string; install?: PackageInstall },
): Promise<SkillSupportingFile[]> {
  const entry = assertSafeRelativePath(manifest.entry);
  const entryDirectory = dirname(entry);
  const excluded = new Set([
    entry,
    "aipm.manifest.json",
    "pkg.tgz",
    ...installReferencedFiles(manifest.install).map(assertSafeRelativePath),
  ]);
  const supportingFiles: SkillSupportingFile[] = [];

  for (const sourcePath of await listRegularPackageFiles(packageRoot)) {
    if (excluded.has(sourcePath)) continue;
    const fromEntryDirectory = normalizeRelativePath(relative(entryDirectory, sourcePath));
    const isEntrySibling =
      fromEntryDirectory !== ".." &&
      !fromEntryDirectory.startsWith("../") &&
      !fromEntryDirectory.startsWith("/");
    if (!isEntrySibling && !isRootLicenseOrNotice(sourcePath)) continue;
    const destinationPath = isEntrySibling ? fromEntryDirectory : basename(sourcePath);
    if (destinationPath.toLowerCase() === "skill.md") {
      throw new Error(`Package supporting file conflicts with installed SKILL.md: ${sourcePath}`);
    }
    const source = safeJoin(packageRoot, sourcePath);
    supportingFiles.push({
      path: destinationPath,
      content: await readFile(source),
      mode: (await stat(source)).mode,
    });
  }

  return supportingFiles.sort((a, b) => a.path.localeCompare(b.path));
}

async function copyMainFile(input: {
  packageRoot: string;
  installRoot: string;
  file: NonNullable<PackageInstall["mainFiles"]>[number];
  ci?: boolean;
}): Promise<string | null> {
  const source = await assertSourceFile(input.packageRoot, input.file.from);
  const target = safeJoin(input.installRoot, input.file.to);
  let overwrite = input.file.overwrite ?? "fail";
  const exists = await stat(target).catch(() => null);
  if (exists) {
    if (overwrite === "skip") return null;
    if (overwrite === "fail") {
      overwrite = await offerChoices<"replace" | "skip">({
        ci: input.ci,
        note: {
          type: "warn",
          title: "File already exists",
          message: target,
        },
        message: "How do you want to continue?",
        choices: [
          { value: "replace", label: "Overwrite the existing file" },
          { value: "skip", label: "Skip this file" },
        ],
        fallbackError: `Install target already exists: ${target}`,
      });
      if (overwrite === "skip") return null;
    }
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
  ci?: boolean;
}): Promise<{ assets: InstalledPackageAssets; postInstall?: LockfilePackageEntry["postInstall"] }> {
  const assets: InstalledPackageAssets = { main: [], helper: [] };
  const install = options.install;
  if (!install) return { assets };

  for (const file of install.mainFiles ?? []) {
    const copied = await copyMainFile({
      packageRoot: options.packageRoot,
      installRoot: options.installRoot,
      file,
      ci: options.ci,
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
  const spinner = createSpinner({
    text: `Fetching ${options.name}@${options.version}`,
    disabled: options.ci,
  });
  spinner.start();

  try {
    await assertRegistryReachable(options.registry);
    const { manifest, integrity: remoteIntegrity, deprecated } = await fetchPackageMetadata(
      options.registry,
      options.name,
      options.version,
      options.token,
    );
    if (deprecated) {
      spinner.stop();
      printNote({
        type: "warn",
        title: "Deprecated package",
        message: `${options.name}${deprecated.message ? `: ${deprecated.message}` : ""}`,
      });
      spinner.start(`Installing ${options.name}@${options.version}`);
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
      spinner.stop();
      if (options.ci) {
        throw new Error(
          "No tool detected. Use --target cursor|claude|codex|* in CI mode.",
        );
      }
      printNote({
        type: "info",
        title: "No AI tool folder found",
        message: "Could not find .cursor, .claude, or .codex in this project.",
      });
      const choice = await promptForTool();
      explicitTarget = choice;
      preferredTools = [choice];
      tools = await resolveInstallTools({
        projectRoot: installRoot,
        manifest,
        preferredTools,
        explicitTarget,
      });
      spinner.start(`Installing ${options.name}@${options.version}`);
    } else if (tools.length > 1 && !explicitTarget && !options.ci) {
      // Multiple matches — ask instead of installing into every tool silently.
      spinner.stop();
      printNote({
        type: "info",
        title: "Multiple AI tools found",
        message: `Detected: ${tools.join(", ")}`,
      });
      const choice = await promptForTool(tools);
      explicitTarget = choice;
      preferredTools = [choice];
      tools = [choice];
      spinner.start(`Installing ${options.name}@${options.version}`);
    }

    spinner.update(`Downloading ${options.name}@${options.version}`);
    const tarball = await fetchPackageTarball(
      options.registry,
      options.name,
      options.version,
      options.token,
    );
    const packageRoot = await unpackTarballToDirectory(tarball);
    try {
      spinner.update(`Installing ${options.name}@${options.version}`);
      const skillMarkdown = await readFile(safeJoin(packageRoot, manifest.entry), "utf8");
      const supportingFiles = await collectSkillSupportingFiles(packageRoot, manifest);

      const result = await installSkillPackage({
        projectRoot: installRoot,
        manifest,
        skillMarkdown,
        supportingFiles,
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
        ci: options.ci,
      });

      const track = options.track !== false;
      if (track) {
        const lock: Lockfile = (await readLockfile(configRoot)) ?? {
          schemaVersion: "0.1",
          packages: {},
          prompts: {},
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
      }

      spinner.stop();
      console.log(`Installed ${options.name}@${options.version} → ${result.resolvedTools.join(", ")}`);
      printPostInstallNotice(options.name, postInstall);
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
    }
  } catch (error) {
    spinner.fail(`Failed to install ${options.name}@${options.version}`);
    throw error;
  }
}
