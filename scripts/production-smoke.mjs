#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const webUrl = normalizeUrl(process.env.WEB_URL ?? "https://www.aipm-registry.com");
const apiUrl = normalizeUrl(process.env.API_URL ?? "https://api.aipm-registry.com");
const allowHttp = args.has("--allow-http");
const requirePublish = args.has("--require-publish");
const listOnly = args.has("--list");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 12000);

const testPlan = [
  "Website: HTTPS, security headers, title, registry/publish/dashboard docs routes, robots.txt, sitemap.xml",
  "Website API rewrite: /v1/packages returns a package list through the website host",
  "API: /health, /ready, auth config, public package search",
  "API package read: package detail, package files list, entry file content, tarball download",
  "Security: unauthenticated publish returns 401 or 403",
  "CLI clone/install: aipm init + aipm add a public package into a clean temp project",
  "Optional publish: publish a disposable smoke package when AIPM_TOKEN and AIPM_SMOKE_PACKAGE are set",
  "Optional private install: install a private package when AIPM_PRIVATE_PACKAGE and AIPM_INSTALL_TOKEN are set",
];

if (listOnly) {
  console.log("Production smoke test plan:");
  for (const item of testPlan) console.log(`- ${item}`);
  process.exit(0);
}

if (!allowHttp) {
  for (const url of [webUrl, apiUrl]) {
    if (!url.startsWith("https://")) {
      throw new Error(`Refusing non-HTTPS production URL: ${url}. Pass --allow-http for local/staging checks.`);
    }
  }
}

let tempRoot = "";
const state = {
  publicPackage: null,
  publishedPackage: null,
};

process.on("exit", () => {
  if (tempRoot) void rm(tempRoot, { recursive: true, force: true });
});

function normalizeUrl(value) {
  return value.replace(/\/+$/, "");
}

function url(base, path) {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function encodePackageName(name) {
  return encodeURIComponent(name);
}

function packagePagePath(packageName, version) {
  const [scope, name] = packageName.replace(/^@/, "").split("/");
  return `/packages/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(name ?? "")}/${encodeURIComponent(version)}`;
}

function packageShortName(packageName) {
  return packageName.replace(/^@/, "").split("/").pop() ?? packageName;
}

function withTimeout() {
  return AbortSignal.timeout(timeoutMs);
}

async function fetchResponse(pathOrUrl, init = {}) {
  const href = pathOrUrl.startsWith("http") ? pathOrUrl : url(apiUrl, pathOrUrl);
  const response = await fetch(href, { ...init, signal: init.signal ?? withTimeout() });
  const text = await response.text();
  return { href, response, text };
}

async function fetchJson(pathOrUrl, init = {}) {
  const result = await fetchResponse(pathOrUrl, init);
  if (!result.response.ok) {
    throw new Error(`${result.href} returned ${result.response.status}: ${result.text.slice(0, 240)}`);
  }
  return JSON.parse(result.text);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(text, expected, label) {
  assert(text.includes(expected), `${label} did not include expected text: ${expected}`);
}

async function check(name, fn) {
  process.stdout.write(`- ${name} ... `);
  try {
    await fn();
    console.log("ok");
  } catch (error) {
    console.log("failed");
    throw error;
  }
}

async function command(cmd, cmdArgs, options = {}) {
  return execFileAsync(cmd, cmdArgs, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...(options.env ?? {}) },
    maxBuffer: 10 * 1024 * 1024,
  });
}

function cliCommand() {
  const explicit = process.env.AIPM_CLI;
  if (explicit) return { cmd: explicit, argsPrefix: [] };
  const localCli = join(repoRoot, "apps/cli/dist/bin.cjs");
  if (existsSync(localCli)) return { cmd: process.execPath, argsPrefix: [localCli] };
  return { cmd: "aipm", argsPrefix: [] };
}

async function runCli(cliArgs, options = {}) {
  const cli = cliCommand();
  return command(cli.cmd, [...cli.argsPrefix, ...cliArgs], options);
}

async function listMarkdownFiles(dir) {
  const files = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true }).catch(() => [])) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) await walk(fullPath);
      if (entry.isFile() && entry.name.endsWith(".md")) files.push(fullPath);
    }
  }
  await walk(dir);
  return files;
}

async function installPackage(packageName, version, token) {
  const projectDir = await mkdtemp(join(tempRoot, "project-"));
  await mkdir(join(projectDir, ".cursor"), { recursive: true });
  await runCli(["init", "--registry", apiUrl, "--target", "cursor"], { cwd: projectDir });
  const packageSpec = version && !packageName.includes("@", 1) ? `${packageName}@${version}` : packageName;
  const addArgs = ["add", packageSpec, "--target", "cursor", "--ci"];
  if (token) addArgs.push("--token", token);
  await runCli(addArgs, { cwd: projectDir });
  const installed = await listMarkdownFiles(join(projectDir, ".cursor", "aipm", "skills"));
  assert(installed.length > 0, "No Cursor skill markdown file was installed");
  return { projectDir, installed };
}

async function createSmokePackage(packageName) {
  const version = `0.0.${Math.floor(Date.now() / 1000)}`;
  const packageDir = join(tempRoot, "publish-package");
  await mkdir(packageDir, { recursive: true });
  await writeFile(
    join(packageDir, "aipm.manifest.json"),
    `${JSON.stringify(
      {
        schemaVersion: "0.1",
        name: packageName,
        version,
        type: "skill",
        description: "Production smoke test package for AIPM registry verification.",
        entry: "SKILL.md",
        targets: ["cursor", "claude"],
        license: "Apache-2.0",
        tags: ["smoke-test"],
        categories: ["Operations"],
        releaseNotes: "Automated production smoke test publish.",
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(packageDir, "SKILL.md"),
    `---\nname: ${packageShortName(packageName)}\ndescription: Production smoke test skill.\n---\n\n# Production Smoke Test\n\nThis package verifies publish and install paths.\n`,
  );
  await writeFile(join(packageDir, ".aipmignore"), ".aipm/\nnode_modules/\n.env\n.env.*\n");
  return { packageDir, version };
}

console.log("AIPM production smoke");
console.log(`Website: ${webUrl}`);
console.log(`API: ${apiUrl}`);
console.log("");

tempRoot = await mkdtemp(join(tmpdir(), "aipm-production-smoke-"));

await check("website headers and key routes", async () => {
  const head = await fetchResponse(url(webUrl, "/"), { method: "HEAD", redirect: "follow" });
  assert(head.response.ok, `${head.href} returned ${head.response.status}`);
  for (const header of ["strict-transport-security", "x-content-type-options", "referrer-policy", "content-security-policy"]) {
    assert(head.response.headers.has(header), `Missing security header on website: ${header}`);
  }
  const home = await fetchResponse(url(webUrl, "/"), { redirect: "follow" });
  assertIncludes(home.text, "<title>AIPM - AI Package Manager for Skills and Tool Files</title>", "home page");
  for (const path of ["/registry", "/publish", "/publish/guide", "/dashboard", "/thanks"]) {
    const page = await fetchResponse(url(webUrl, path), { redirect: "follow" });
    assert(page.response.ok, `${path} returned ${page.response.status}`);
  }
  const robots = await fetchResponse(url(webUrl, "/robots.txt"), { redirect: "follow" });
  assertIncludes(robots.text, "Sitemap:", "robots.txt");
  const sitemap = await fetchResponse(url(webUrl, "/sitemap.xml"), { redirect: "follow" });
  assertIncludes(sitemap.text, "<urlset", "sitemap.xml");
});

await check("API health, readiness, and auth config", async () => {
  const health = await fetchJson(url(apiUrl, "/health"));
  assert(health.status === "ok", "/health status must be ok");
  const ready = await fetchJson(url(apiUrl, "/ready"));
  assert(ready.status === "ok", "/ready status must be ok");
  assert(ready.metadata, "/ready must report metadata backend");
  assert(ready.storage, "/ready must report storage backend");
  const authConfig = await fetchJson(url(apiUrl, "/v1/auth/config"));
  for (const key of ["devAuth", "githubAuth", "emailAuth"]) {
    assert(typeof authConfig[key] === "boolean", `/v1/auth/config ${key} must be boolean`);
  }
});

await check("public package search and website API rewrite", async () => {
  const apiPackages = await fetchJson(url(apiUrl, "/v1/packages?limit=1"));
  assert(Array.isArray(apiPackages.packages), "API packages must be an array");
  assert(apiPackages.packages.length > 0, "Production registry should list at least one public package");
  state.publicPackage = apiPackages.packages[0];

  const webPackages = await fetchJson(url(webUrl, "/v1/packages?limit=1"));
  assert(Array.isArray(webPackages.packages), "Website API rewrite packages must be an array");
});

await check("package detail, files, content, tarball, and package page", async () => {
  const pkg = state.publicPackage;
  assert(pkg?.name && pkg?.version, "No public package selected");
  const encoded = encodePackageName(pkg.name);
  const detail = await fetchJson(url(apiUrl, `/v1/packages/${encoded}/versions/${encodeURIComponent(pkg.version)}`));
  assert(detail.manifest?.description, "Package detail must include manifest");
  const files = await fetchJson(url(apiUrl, `/v1/packages/${encoded}/versions/${encodeURIComponent(pkg.version)}/files`));
  assert(Array.isArray(files.files), "Package files response must include files array");
  const entry = files.entry ?? detail.manifest.entry ?? "SKILL.md";
  const content = await fetchJson(
    url(apiUrl, `/v1/packages/${encoded}/versions/${encodeURIComponent(pkg.version)}/files/content?path=${encodeURIComponent(entry)}`),
  );
  assert(content.path === entry, "Package content path mismatch");
  assert(typeof content.binary === "boolean", "Package content response must include binary flag");
  const tarball = await fetchResponse(url(apiUrl, `/v1/packages/${encoded}/versions/${encodeURIComponent(pkg.version)}/tarball`));
  assert(tarball.response.ok, `Package tarball returned ${tarball.response.status}`);

  const page = await fetchResponse(url(webUrl, packagePagePath(pkg.name, pkg.version)), { redirect: "follow" });
  assert(page.response.ok, "Package page should load");
  assertIncludes(page.text, `aipm add ${pkg.name}@${pkg.version}`, "package page");
});

await check("unauthenticated publish is closed", async () => {
  const form = new FormData();
  form.append("tarball", new Blob([Buffer.from("not-a-real-tarball")]), "package.tgz");
  const result = await fetchResponse(url(apiUrl, "/v1/packages/%40aipm%2Funauth-smoke/versions"), {
    method: "POST",
    body: form,
  });
  assert(
    [401, 403].includes(result.response.status),
    `Expected unauthenticated publish to return 401 or 403, got ${result.response.status}`,
  );
});

await check("CLI clone/install public package into a clean project", async () => {
  const pkg = state.publicPackage;
  const result = await installPackage(pkg.name, pkg.version);
  const sample = await readFile(result.installed[0], "utf8");
  assert(sample.trim().length > 0, "Installed skill file should not be empty");
});

if (process.env.AIPM_TOKEN && process.env.AIPM_SMOKE_PACKAGE) {
  await check(`publish smoke package ${process.env.AIPM_SMOKE_PACKAGE}`, async () => {
    const created = await createSmokePackage(process.env.AIPM_SMOKE_PACKAGE);
    await runCli(["publish", created.packageDir, "--registry", apiUrl, "--token", process.env.AIPM_TOKEN]);
    state.publishedPackage = { name: process.env.AIPM_SMOKE_PACKAGE, version: created.version };
  });

  await check("install newly published smoke package", async () => {
    await installPackage(state.publishedPackage.name, state.publishedPackage.version);
  });
} else if (requirePublish) {
  throw new Error("Publish smoke is required but AIPM_TOKEN and AIPM_SMOKE_PACKAGE are not both set.");
} else {
  console.log("- publish smoke package ... skipped (set AIPM_TOKEN and AIPM_SMOKE_PACKAGE)");
}

if (process.env.AIPM_PRIVATE_PACKAGE && process.env.AIPM_INSTALL_TOKEN) {
  await check(`install private package ${process.env.AIPM_PRIVATE_PACKAGE}`, async () => {
    await installPackage(process.env.AIPM_PRIVATE_PACKAGE, "", process.env.AIPM_INSTALL_TOKEN);
  });
} else {
  console.log("- private package install ... skipped (set AIPM_PRIVATE_PACKAGE and AIPM_INSTALL_TOKEN)");
}

console.log("");
console.log("Production smoke passed.");
await rm(tempRoot, { recursive: true, force: true });
tempRoot = "";
