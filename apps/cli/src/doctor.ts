import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { delimiter, join, sep } from "node:path";
import { promisify } from "node:util";
import { assertRegistryReachable } from "./registry-client.js";
import {
  readProjectPackageJson,
  resolveRegistryUrl,
} from "./project-files.js";
import { initRequiredMessage, resolveConfigRoot, scopeLabel } from "./project-root.js";
import {
  readManifest,
  statusPublishState,
  validatePublishState,
} from "./publish-state.js";

const execFileAsync = promisify(execFile);
const MIN_NODE_MAJOR = 20;

type Check = {
  name: string;
  ok: boolean;
  detail: string;
};

async function commandOutput(command: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(command, args, {
      encoding: "utf8",
      timeout: 5000,
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

function npmGlobalBin(prefix: string | null): string | null {
  if (!prefix) return null;
  return process.platform === "win32" ? prefix : `${prefix}${sep}bin`;
}

function pathIncludes(pathDir: string | null): boolean {
  if (!pathDir) return false;
  return (process.env.PATH ?? "").split(delimiter).includes(pathDir);
}

function shellPathHint(binDir: string | null): string {
  if (!binDir) return "Run npm prefix -g and add its bin folder to PATH.";
  const shell = process.env.SHELL ?? "";
  const rc = shell.includes("zsh") ? "~/.zshrc" : shell.includes("bash") ? "~/.bashrc" : "your shell profile";
  return `Add this to ${rc}: export PATH="${binDir}:$PATH"`;
}

async function commandExists(command: string): Promise<boolean> {
  const probe = process.platform === "win32" ? "where" : "sh";
  const args = process.platform === "win32" ? [command] : ["-c", `command -v ${command}`];
  return (await commandOutput(probe, args)) !== null;
}

export async function runDoctor(options: {
  registry?: string;
  json?: boolean;
  publish?: boolean;
  global?: boolean;
}): Promise<void> {
  const scope = { global: options.global };
  const configRoot = resolveConfigRoot(scope);
  const root = process.cwd();
  const project = await readProjectPackageJson(configRoot);
  const registry = resolveRegistryUrl(project, options.registry, "https://api.aipm-registry.com");
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const npmPrefix = await commandOutput("npm", ["prefix", "-g"]);
  const globalBin = npmGlobalBin(npmPrefix);
  const hasAipmCommand = await commandExists("aipm");
  const checks: Check[] = options.publish
    ? []
    : [
    {
      name: "Node.js",
      ok: nodeMajor >= MIN_NODE_MAJOR,
      detail: `Detected ${process.versions.node}; AIPM requires Node ${MIN_NODE_MAJOR}+`,
    },
    {
      name: "aipm command",
      ok: hasAipmCommand,
      detail: hasAipmCommand
        ? "The aipm executable is discoverable from PATH."
        : "Install with npm install -g @aipm-registry/cli, then open a new shell.",
    },
    {
      name: "npm global PATH",
      ok: pathIncludes(globalBin),
      detail: pathIncludes(globalBin)
        ? `${globalBin} is on PATH.`
        : shellPathHint(globalBin),
    },
  ];

  try {
    await assertRegistryReachable(registry);
    checks.push({ name: "Registry", ok: true, detail: `${registry}/health is reachable.` });
  } catch (error) {
    checks.push({
      name: "Registry",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  if (!options.publish) {
    const configLabel = options.global ? "Global config" : "Project config";
    try {
      await access(join(configRoot, "aipm.package.json"));
      checks.push({
        name: configLabel,
        ok: true,
        detail: `${join(configRoot, "aipm.package.json")} exists (${scopeLabel(scope)}).`,
      });
    } catch {
      checks.push({
        name: configLabel,
        ok: false,
        detail: initRequiredMessage(scope),
      });
    }
  }

  try {
    const manifest = await readManifest(root);
    checks.push({
      name: "Skill manifest",
      ok: true,
      detail: `${manifest.name}@${manifest.version} is valid.`,
    });
  } catch {
    checks.push({
      name: "Skill manifest",
      ok: false,
      detail: "No valid aipm.manifest.json found in the current folder.",
    });
  }

  try {
    const rows = await statusPublishState(root);
    const changed = rows.filter((row) => row.changed);
    checks.push({
      name: "Publish stage",
      ok: rows.length > 0 && changed.length === 0,
      detail:
        rows.length === 0
          ? "No files staged. Run aipm publish add ."
          : changed.length > 0
            ? `${changed.length} staged file(s) changed after add. Run aipm publish add . again.`
            : `${rows.length} file(s) staged.`,
    });
  } catch (error) {
    checks.push({
      name: "Publish stage",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const validated = await validatePublishState(root);
    checks.push({
      name: "Publish validation",
      ok: true,
      detail: `${validated.manifest.name}@${validated.manifest.version}, ${validated.size} bytes.`,
    });
  } catch (error) {
    checks.push({
      name: "Publish validation",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  const token = process.env.AIPM_TOKEN;
  checks.push({
    name: "Publish token",
    ok: Boolean(token),
    detail: token ? "AIPM_TOKEN is set for this shell." : "Generate a 5-minute token from the dashboard before push.",
  });

  if (options.json) {
    console.log(JSON.stringify({ ok: checks.every((check) => check.ok), checks }, null, 2));
    return;
  }

  for (const check of checks) {
    console.log(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.detail}`);
  }
}
