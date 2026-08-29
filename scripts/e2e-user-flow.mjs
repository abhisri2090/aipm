#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";
import {
  dashboardPackagePath,
  loadDotEnv,
  packageNameForRun,
  packageVersionForRun,
  publicPackagePath,
  redactSecrets,
  requiredEnv,
  resolveInstallShUrl,
} from "./e2e-user-flow-lib.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await loadDotEnv(join(repoRoot, ".env.e2e"));
const cfg = requiredEnv();
const cliVersion = JSON.parse(await readFile(join(repoRoot, "apps/cli/package.json"), "utf8")).version;
const installShUrl = await resolveInstallShUrl({
  explicitUrl: cfg.installShUrl || undefined,
  cliVersion,
});
const unixSeconds = Math.floor(Date.now() / 1000);
const packageName = packageNameForRun(cfg.org, unixSeconds);
const packageVersion = packageVersionForRun(unixSeconds);
const secrets = [cfg.pin];
const screenshotDir = join(repoRoot, ".tmp/e2e-user-flow");

const state = {
  tempRoot: "",
  npmPrefix: "",
  curlBin: "",
  browser: null,
  context: null,
  page: null,
  reserved: false,
  published: false,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectEnabled(locator, timeoutMs = 15000) {
  await locator.waitFor({ state: "visible", timeout: timeoutMs });
  await locator.evaluate(async (node) => {
    const start = Date.now();
    while (node.matches("button:disabled")) {
      if (Date.now() - start > 14000) throw new Error("Button stayed disabled");
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });
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

async function command(cmd, args, options = {}) {
  try {
    return await execFileAsync(cmd, args, {
      cwd: options.cwd ?? repoRoot,
      env: { ...process.env, ...(options.env ?? {}) },
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const combined = `${error.stdout ?? ""}${error.stderr ?? ""}${error.message ?? ""}`;
    throw new Error(redactSecrets(combined, secrets).slice(0, 1500));
  }
}

function curlAipm() {
  return join(state.curlBin, "aipm");
}

async function runAipm(args, options = {}) {
  return command(curlAipm(), args, options);
}

async function screenshot(label) {
  if (!state.page || state.page.isClosed()) return;
  try {
    await mkdir(screenshotDir, { recursive: true });
    await state.page.screenshot({ path: join(screenshotDir, `${label}.png`), fullPage: true });
  } catch {
    // Browser may already be closing during cleanup.
  }
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

async function sessionDelete(path) {
  if (!state.context) return { status: 0 };
  const response = await state.context.request.delete(`${cfg.webUrl}${path}`);
  return { status: response.status() };
}

async function apiPackageGone() {
  const href = `${cfg.apiUrl}/v1/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(packageVersion)}`;
  const response = await fetch(href, { headers: { "cache-control": "no-cache" } });
  return response.status === 404;
}

async function cleanup(originalError) {
  const errors = [];
  try {
    if (state.published || state.reserved) {
      if (state.page && !state.page.isClosed()) {
        await state.page.goto(`${cfg.webUrl}${dashboardPackagePath(packageName)}`, {
          waitUntil: "domcontentloaded",
        });
        const deleteInput = state.page.locator("#delete-package-name");
        if (await deleteInput.count()) {
          await deleteInput.fill(packageName);
          await state.page.getByRole("button", { name: "Delete skill" }).click();
          await state.page.waitForURL("**/dashboard/packages**", { timeout: 15000 }).catch(() => {});
        }
      }
      const deleted = await sessionDelete(`/v1/packages/${encodeURIComponent(packageName)}`);
      if (![204, 404, 0].includes(deleted.status)) {
        const reservedDel = await sessionDelete(
          `/v1/orgs/${encodeURIComponent(cfg.org)}/packages/${encodeURIComponent(packageName)}`,
        );
        if (![204, 404, 0].includes(reservedDel.status)) {
          errors.push(`cleanup delete returned ${deleted.status}/${reservedDel.status}`);
        }
      }
      if (state.published) {
        // Source of truth is the API. The website package page can stay cached briefly on the CDN.
        if (!(await apiPackageGone())) {
          errors.push("API still returns the published package after delete");
        }
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await state.browser?.close();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    state.page = null;
    state.context = null;
    state.browser = null;
  }
  try {
    if (state.tempRoot) await rm(state.tempRoot, { recursive: true, force: true });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  for (const message of errors) console.error(`cleanup: ${redactSecrets(message, secrets)}`);
  if (originalError) throw originalError;
  if (errors.length > 0) throw new Error(errors.join("; "));
}

async function installNpmCli() {
  state.npmPrefix = join(state.tempRoot, "npm-prefix");
  await mkdir(state.npmPrefix, { recursive: true });
  await command("npm", ["install", "-g", "--prefix", state.npmPrefix, "@aipm-registry/cli"]);
  const bin = join(state.npmPrefix, "bin", "aipm");
  const { stdout } = await command(bin, ["--version"]);
  assert(stdout.trim().length > 0, "npm-installed aipm --version was empty");
  await rm(state.npmPrefix, { recursive: true, force: true });
  state.npmPrefix = "";
}

async function installCurlCli() {
  state.curlBin = join(state.tempRoot, "curl-bin");
  await mkdir(state.curlBin, { recursive: true });
  const scriptPath = join(state.tempRoot, "install.sh");
  await command("curl", ["-fsSL", installShUrl, "-o", scriptPath]);
  await command("sh", [scriptPath], { env: { AIPM_INSTALL_DIR: state.curlBin } });
  const { stdout } = await command(curlAipm(), ["--version"]);
  assert(stdout.trim().length > 0, "curl-installed aipm --version was empty");
}

async function selectOrg(page) {
  const switcher = page.locator("#dashboard-org-switcher");
  await switcher.waitFor({ timeout: 30000 });
  const values = await switcher.locator("option").evaluateAll((options) =>
    options.map((option) => option.value),
  );
  if (!values.includes(cfg.org)) return false;
  await switcher.selectOption(cfg.org);
  return true;
}

async function ensureOrg(page) {
  if (await page.locator("#dashboard-org-switcher").count()) {
    if (await selectOrg(page)) return;
  }
  await page.goto(`${cfg.webUrl}/dashboard/orgs/new`, { waitUntil: "domcontentloaded" });
  await page.locator("#org-slug").waitFor({ timeout: 30000 });
  await page.locator("#org-slug").click();
  await page.locator("#org-slug").fill("");
  await page.locator("#org-slug").pressSequentially(cfg.org, { delay: 15 });
  const name = page.locator("#org-name");
  if (await name.count()) {
    await name.click();
    await name.fill("");
    await name.pressSequentially(cfg.org, { delay: 15 });
  }
  await page.getByRole("button", { name: "Create organization" }).click();
  await page.waitForURL(new RegExp(`/dashboard/orgs/${cfg.org}(/|$)`), { timeout: 30000 }).catch(() => {});
  await page.goto(`${cfg.webUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  if (await selectOrg(page).catch(() => false)) return;
  // Org may already exist from a prior run.
  await page.goto(`${cfg.webUrl}/dashboard/orgs`, { waitUntil: "domcontentloaded" });
  if (await selectOrg(page).catch(() => false)) return;
  throw new Error(`Could not select or create org ${cfg.org}`);
}

async function loginAndPreparePackage() {
  state.browser = await chromium.launch({ headless: false });
  state.context = await state.browser.newContext();
  state.page = await state.context.newPage();
  const page = state.page;
  await page.goto(`${cfg.webUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("#login-email").waitFor({ timeout: 30000 });
  await page.locator("#login-email").click();
  await page.locator("#login-email").fill("");
  await page.locator("#login-email").pressSequentially(cfg.email, { delay: 15 });
  await page.getByRole("button", { name: "Send verification code" }).waitFor({ state: "visible" });
  await expectEnabled(page.getByRole("button", { name: "Send verification code" }));
  await page.getByRole("button", { name: "Send verification code" }).click();
  await page.locator("#login-code").waitFor({ timeout: 30000 });
  await page.locator("#login-code").click();
  await page.locator("#login-code").pressSequentially(cfg.pin, { delay: 15 });
  await expectEnabled(page.getByRole("button", { name: "Verify and continue" }));
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30000 }).catch(() => {});
  await page.goto(`${cfg.webUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Sign out" }).waitFor({ timeout: 30000 });
  await ensureOrg(page);
  await page.goto(`${cfg.webUrl}/dashboard/packages`, { waitUntil: "domcontentloaded" });
  await page.locator("#package-name").fill(packageName);
  await page.getByRole("button", { name: "Reserve package" }).click();
  await page
    .getByText(`Reserved ${packageName}`)
    .waitFor({ timeout: 15000 })
    .catch(() => {});
  await page.goto(`${cfg.webUrl}${dashboardPackagePath(packageName)}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Generate token" }).waitFor({ timeout: 30000 });
  state.reserved = true;
  const visibility = page.locator("#package-visibility");
  if (await visibility.count()) {
    const current = await visibility.inputValue();
    if (current === "private") {
      page.once("dialog", (dialog) => dialog.accept());
      await visibility.selectOption("public");
    }
  }
  await page.getByRole("button", { name: "Generate token" }).click();
  await page.getByText("This token expires").waitFor();
  const token = (await page.locator("code").filter({ hasText: /^aipm_/ }).first().innerText()).trim();
  assert(token.startsWith("aipm_"), "Publish token was not shown");
  secrets.push(token);
  return token;
}

async function publishAndInstall(token) {
  const skillDir = join(state.tempRoot, "skill");
  await mkdir(skillDir, { recursive: true });
  await runAipm(
    ["publish", "init", "--name", packageName, "--version", packageVersion, "--template", "blank", "--here"],
    { cwd: skillDir },
  );
  const published = await runAipm(["publish", skillDir, "--registry", cfg.apiUrl, "--token", token], {
    cwd: skillDir,
  });
  assert(
    published.stdout.includes(`Published ${packageName}@${packageVersion}`),
    "Publish output missing version",
  );
  state.published = true;
  const listing = await fetch(`${cfg.webUrl}${publicPackagePath(packageName, packageVersion)}`);
  const html = await listing.text();
  assert(listing.ok, `Package page returned ${listing.status}`);
  assert(html.includes(`aipm add ${packageName}@${packageVersion}`), "Package page missing install command");
  const projectDir = join(state.tempRoot, "project");
  await mkdir(join(projectDir, ".cursor"), { recursive: true });
  await runAipm(["init", "--registry", cfg.apiUrl, "--target", "cursor"], { cwd: projectDir });
  await runAipm(["add", `${packageName}@${packageVersion}`, "--target", "cursor", "--ci"], {
    cwd: projectDir,
  });
  const installed = await listMarkdownFiles(join(projectDir, ".cursor", "aipm", "skills"));
  assert(installed.length > 0, "No Cursor skill markdown file was installed");
}

console.log("AIPM user-flow e2e");
console.log(`Website: ${cfg.webUrl}`);
console.log(`API: ${cfg.apiUrl}`);
console.log(`Package: ${packageName}@${packageVersion}`);
console.log("");

state.tempRoot = await mkdtemp(join(tmpdir(), "aipm-e2e-user-"));
try {
  await check("install CLI from npm into an isolated prefix", installNpmCli);
  await check("install CLI from GitHub install.sh into an isolated prefix", installCurlCli);
  const token = await (async () => {
    process.stdout.write("- dashboard login, org, reserve, token ... ");
    try {
      const value = await loginAndPreparePackage();
      console.log("ok");
      return value;
    } catch (error) {
      console.log("failed");
      await screenshot("dashboard");
      throw error;
    }
  })();
  await check("publish, website listing, and CLI install", () => publishAndInstall(token));
  await cleanup();
  console.log("");
  console.log("User-flow e2e passed.");
} catch (error) {
  await screenshot("failure");
  await cleanup(error);
}
