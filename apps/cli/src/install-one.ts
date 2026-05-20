import { installSkillPackage } from "@aipm/engine";
import type { AiTool, Lockfile, LockfilePackageEntry } from "@aipm/schemas";
import { unpackTarballToBuffer } from "./pack.js";
import {
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
  projectRoot: string;
  registry: string;
  name: string;
  version: string;
  project: ProjectPackageJson;
  explicitTarget?: AiTool;
  ci?: boolean;
}

export async function installOnePackage(options: InstallOneOptions): Promise<void> {
  const { manifest, integrity: remoteIntegrity } = await fetchPackageMetadata(
    options.registry,
    options.name,
    options.version,
  );

  let explicitTarget = options.explicitTarget;
  let preferredTools = options.project.preferredTools;

  const { resolveInstallTools } = await import("@aipm/engine");
  let tools = await resolveInstallTools({
    projectRoot: options.projectRoot,
    manifest,
    preferredTools,
    explicitTarget,
  });

  if (tools.length === 0) {
    if (options.ci) {
      throw new Error(
        "No tool detected. Use --target cursor|claude in CI mode.",
      );
    }
    const choice = await promptForTool();
    explicitTarget = choice;
    preferredTools = [choice];
    tools = await resolveInstallTools({
      projectRoot: options.projectRoot,
      manifest,
      preferredTools,
      explicitTarget,
    });
  }

  const tarball = await fetchPackageTarball(
    options.registry,
    options.name,
    options.version,
  );
  const skillMarkdown = await unpackTarballToBuffer(tarball, manifest.entry);

  const result = await installSkillPackage({
    projectRoot: options.projectRoot,
    manifest,
    skillMarkdown,
    preferredTools,
    explicitTarget,
  });

  const lock: Lockfile = (await readLockfile(options.projectRoot)) ?? {
    schemaVersion: "0.1",
    packages: {},
  };

  const installed: LockfilePackageEntry["installed"] = {};
  for (const tool of result.resolvedTools) {
    const paths = result.installed[tool];
    if (paths) installed[tool] = paths;
  }

  await writeLockfile(
    options.projectRoot,
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
