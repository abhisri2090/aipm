#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = join(repoRoot, "apps", "cli");
const outDir = join(repoRoot, "release", "binaries");
const commandTimeoutMs = Number(process.env.AIPM_CLI_BINARY_TIMEOUT_MS ?? 20 * 60 * 1000);

const releaseTargets = [
  { pkg: "node20-macos-arm64", asset: "aipm-darwin-arm64", executable: "aipm-darwin-arm64" },
  { pkg: "node20-macos-x64", asset: "aipm-darwin-x64", executable: "aipm-darwin-x64" },
  { pkg: "node20-linux-x64", asset: "aipm-linux-x64", executable: "aipm-linux-x64" },
  { pkg: "node20-linux-arm64", asset: "aipm-linux-arm64", executable: "aipm-linux-arm64" },
  { pkg: "node20-win-x64", asset: "aipm-windows-x64.exe", executable: "aipm-windows-x64.exe" },
];

const targets =
  process.env.AIPM_CLI_BINARY_ALL === "true"
    ? releaseTargets
    : [
        {
          pkg: process.env.AIPM_CLI_BINARY_TARGET ?? "host",
          asset: process.env.AIPM_CLI_BINARY_NAME ?? hostAssetName(),
          executable: process.env.AIPM_CLI_BINARY_NAME ?? hostAssetName(),
        },
      ];

function hostAssetName() {
  const platform =
    process.platform === "darwin" ? "darwin" : process.platform === "win32" ? "windows" : process.platform;
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return platform === "windows" ? `aipm-${platform}-${arch}.exe` : `aipm-${platform}-${arch}`;
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    console.log(`$ ${command} ${args.join(" ")}`);
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });
    const timer =
      Number.isFinite(commandTimeoutMs) && commandTimeoutMs > 0
        ? setTimeout(() => {
            child.kill("SIGTERM");
            reject(
              new Error(
                `${command} ${args.join(" ")} timed out after ${Math.round(commandTimeoutMs / 1000)} seconds`,
              ),
            );
          }, commandTimeoutMs)
        : null;
    child.on("exit", (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolveRun();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      reject(error);
    });
  });
}

async function sha256(filePath) {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

async function main() {
  await run("pnpm", ["--filter", "@aipm-registry/cli", "build"]);
  if (process.env.AIPM_CLI_BINARY_KEEP_OUT_DIR !== "true") {
    await rm(outDir, { recursive: true, force: true });
  }
  await mkdir(outDir, { recursive: true });

  for (const target of targets) {
    const output = join(outDir, target.executable);
    console.log(`Building ${target.asset} with pkg target ${target.pkg}`);
    await run("pnpm", [
      "exec",
      "pkg",
      join(cliDir, "package.json"),
      "--targets",
      target.pkg,
      "--output",
      output,
      "--no-bytecode",
      "--public-packages",
      "*",
      "--public",
    ]);
    const info = await stat(output);
    const hash = await sha256(output);
    await writeFile(`${output}.sha256`, `${hash}  ${target.executable}\n`);
    console.log(`${target.asset}: ${info.size} bytes ${hash}`);
  }

  const checksums = [];
  for (const target of targets) {
    const filePath = join(outDir, target.executable);
    checksums.push(`${await sha256(filePath)}  ${target.executable}`);
  }
  await writeFile(join(outDir, "checksums.txt"), `${checksums.join("\n")}\n`);
}

await main();
