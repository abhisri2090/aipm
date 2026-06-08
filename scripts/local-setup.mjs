#!/usr/bin/env node
import { execFile, spawn } from "node:child_process";
import { access, copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const DOCKER_CANDIDATES = [
  "/usr/local/bin/docker",
  "/opt/homebrew/bin/docker",
  "/Applications/Docker.app/Contents/Resources/bin/docker",
];

export function isDockerComposeOutput(output) {
  return /Docker Compose version/i.test(output);
}

export async function resolveDockerBinary(env = process.env) {
  const pathEntries = env.PATH?.split(":").filter(Boolean) ?? [];
  const candidates = [
    ...DOCKER_CANDIDATES,
    ...pathEntries
      .filter((entry) => !entry.includes("/.nvm/"))
      .map((entry) => join(entry, "docker")),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      const { stdout } = await execFileAsync(candidate, ["compose", "version"], { encoding: "utf8" });
      if (isDockerComposeOutput(stdout)) return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    "Docker Compose was not found. Install Docker Desktop and ensure `docker compose version` works outside nvm shims.",
  );
}

export async function waitForPostgres(docker, attempts = 30, delayMs = 1000) {
  let lastError = "Postgres did not become ready in time.";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await execFileAsync(
        docker,
        ["compose", "exec", "-T", "postgres", "pg_isready", "-U", "aipm", "-d", "aipm"],
        { cwd: repoRoot },
      );
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(lastError);
}

export async function startPostgres() {
  const docker = await resolveDockerBinary();
  await new Promise((resolve, reject) => {
    const child = spawn(docker, ["compose", "up", "-d", "postgres"], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`docker compose up failed with exit code ${code ?? "unknown"}`));
    });
  });
  await waitForPostgres(docker);
}

async function copyIfMissing(source, destination) {
  try {
    await access(destination);
    console.log(`Keeping existing ${destination}`);
  } catch {
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
    console.log(`Created ${destination}`);
  }
}

export async function runLocalSetup() {
  await copyIfMissing(join(repoRoot, ".env.example"), join(repoRoot, ".env"));
  await copyIfMissing(
    join(repoRoot, "apps/web/.env.local.example"),
    join(repoRoot, "apps/web/.env.local"),
  );
  console.log("Starting local Postgres with Docker Compose…");
  try {
    await startPostgres();
    console.log("Local Postgres is ready.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Postgres was not started: ${message}`);
    console.warn("Install Docker Desktop, then re-run `pnpm local:setup` for dashboard/admin features.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runLocalSetup().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
