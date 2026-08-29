#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = await readFile(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function hasFlag(name) {
  return args.includes(name);
}

function usage() {
  return `Usage:
  pnpm local:db:pull -- --prod-url <prod-postgres-url> --local-url <local-postgres-url> --yes

Environment fallback:
  AIPM_PROD_DATABASE_URL or PROD_DATABASE_URL
  AIPM_LOCAL_DATABASE_URL or LOCAL_DATABASE_URL or DATABASE_URL
  AIPM_PROD_SSLMODE or PROD_SSLMODE

Options:
  --prod-url <url>              Production Postgres connection string
  --local-url <url>             Local Postgres connection string to replace
  --prod-sslmode <mode>         Override production URL sslmode, e.g. require
  --backup-file <path>          Local backup path before replacement
  --dump-file <path>            Temporary production dump path
  --keep-dump                   Keep the production dump file
  --skip-local-backup           Replace local DB without backing it up
  --allow-remote-destination    Allow a non-local destination URL
  --yes                         Required confirmation for destructive restore
`;
}

if (hasFlag("--help") || hasFlag("-h")) {
  console.log(usage());
  process.exit(0);
}

await loadEnvFile(resolve(repoRoot, ".env.local"));
await loadEnvFile(resolve(repoRoot, ".env"));
await loadEnvFile(resolve(repoRoot, "apps/web/.env.local"));

const prodUrl = readFlag("--prod-url") ?? process.env.AIPM_PROD_DATABASE_URL ?? process.env.PROD_DATABASE_URL;
const localUrl =
  readFlag("--local-url") ??
  process.env.AIPM_LOCAL_DATABASE_URL ??
  process.env.LOCAL_DATABASE_URL ??
  process.env.DATABASE_URL;
const prodSslMode = readFlag("--prod-sslmode") ?? process.env.AIPM_PROD_SSLMODE ?? process.env.PROD_SSLMODE;

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = resolve(readFlag("--backup-file") ?? `.tmp/local-db-backup-${stamp}.sql`);
const dumpFile = resolve(readFlag("--dump-file") ?? `.tmp/prod-db-dump-${stamp}.sql`);
const keepDump = hasFlag("--keep-dump");
const skipLocalBackup = hasFlag("--skip-local-backup");
const allowRemoteDestination = hasFlag("--allow-remote-destination");
const confirmed = hasFlag("--yes");

function parseDatabaseUrl(value, label) {
  if (!value) throw new Error(`${label} is required`);
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) {
      throw new Error("URL must use postgres:// or postgresql://");
    }
    return url;
  } catch (error) {
    throw new Error(`${label} is not a valid Postgres URL: ${error.message}`);
  }
}

function isLocalDestination(url) {
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

function applySslMode(url, sslmode) {
  if (!sslmode) return url;
  const copy = new URL(url.toString());
  copy.searchParams.set("sslmode", sslmode);
  copy.searchParams.delete("sslrootcert");
  return copy;
}

function warnAboutMissingRootCert(url) {
  const sslmode = url.searchParams.get("sslmode");
  const sslrootcert = url.searchParams.get("sslrootcert");
  if (!["verify-ca", "verify-full"].includes(sslmode ?? "")) return;
  const defaultRootCert = `${process.env.HOME ?? ""}/.postgresql/root.crt`;
  if (sslrootcert || existsSync(defaultRootCert)) return;
  console.warn(
    `Warning: production URL uses sslmode=${sslmode}, but ${defaultRootCert} does not exist. ` +
      "Use --prod-sslmode require for encrypted TLS without local CA verification, or install the CA file.",
  );
}

function redacted(url) {
  const copy = new URL(url.toString());
  if (copy.password) copy.password = "****";
  return copy.toString();
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      ...options,
    });
    child.on("error", rejectRun);
    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} exited with ${code}`));
    });
  });
}

function commandExists(command) {
  return new Promise((resolveExists) => {
    const child = spawn(command, ["--version"], { stdio: "ignore" });
    child.on("error", () => resolveExists(false));
    child.on("exit", (code) => resolveExists(code === 0));
  });
}

async function requireCommand(command) {
  if (!(await commandExists(command))) {
    throw new Error(`${command} is required. Install PostgreSQL client tools first.`);
  }
}

async function main() {
  const prod = applySslMode(parseDatabaseUrl(prodUrl, "Production database URL"), prodSslMode);
  const local = parseDatabaseUrl(localUrl, "Local database URL");
  warnAboutMissingRootCert(prod);

  if (prod.toString() === local.toString()) {
    throw new Error("Production and local database URLs are identical. Refusing to continue.");
  }
  if (!allowRemoteDestination && !isLocalDestination(local)) {
    throw new Error(
      `Destination must be localhost/127.0.0.1 by default. Got ${local.hostname}. ` +
        "Pass --allow-remote-destination only if you really intend to replace a remote database.",
    );
  }
  if (!confirmed) {
    throw new Error("This replaces the local database. Re-run with --yes after checking the URLs.");
  }

  await requireCommand("pg_dump");
  await requireCommand("psql");
  await mkdir(dirname(dumpFile), { recursive: true });
  if (!skipLocalBackup) await mkdir(dirname(backupFile), { recursive: true });

  console.log("Source:      ", redacted(prod));
  console.log("Destination: ", redacted(local));
  if (!skipLocalBackup) console.log("Local backup:", backupFile);
  console.log("Prod dump:   ", keepDump ? dumpFile : `${dumpFile} (removed after restore)`);
  console.log("");

  if (!skipLocalBackup) {
    console.log("Backing up current local database...");
    await run("pg_dump", [
      "--dbname",
      local.toString(),
      "--format",
      "plain",
      "--no-owner",
      "--no-privileges",
      "--file",
      backupFile,
    ]);
  }

  console.log("Dumping production database...");
  await run("pg_dump", [
    "--dbname",
    prod.toString(),
    "--format",
    "plain",
    "--no-owner",
    "--no-privileges",
    "--file",
    dumpFile,
  ]);

  console.log("Resetting local public schema...");
  await run("psql", [
    local.toString(),
    "--set",
    "ON_ERROR_STOP=1",
    "--command",
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;",
  ]);

  console.log("Restoring production dump into local database...");
  await run("psql", [local.toString(), "--set", "ON_ERROR_STOP=1", "--file", dumpFile]);

  if (!keepDump) {
    await rm(dumpFile, { force: true });
  }

  console.log("");
  console.log("Done. Local database now matches the production dump.");
  if (!skipLocalBackup) console.log(`Previous local backup: ${backupFile}`);
}

main().catch((error) => {
  console.error(error.message);
  console.error("");
  console.error(usage());
  process.exit(1);
});
