import { installSkillPackage } from "@aipm-registry/engine";
import type { AiTool, Lockfile, LockfilePackageEntry } from "@aipm-registry/schemas";
import { unpackTarballToBuffer } from "./pack.js";
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
  const skillMarkdown = await unpackTarballToBuffer(tarball, manifest.entry);

  const result = await installSkillPackage({
    projectRoot: installRoot,
    manifest,
    skillMarkdown,
    preferredTools,
    explicitTarget,
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
    }),
  );

  console.log(`Installed ${options.name}@${options.version} → ${result.resolvedTools.join(", ")}`);
}
