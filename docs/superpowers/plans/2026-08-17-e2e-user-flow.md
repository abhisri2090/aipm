# Phase 1 Package User-Flow E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let allowlisted test emails log in with a fixed PIN, then add a headed Playwright script that installs the CLI (npm + curl), publishes a disposable skill from the dashboard token, verifies and installs it, and deletes it.

**Architecture:** Keep `verifyAuthCode` unchanged. On `requestAuthCode`, if `resolveTestAuthPin(email)` returns a 6-digit PIN, hash that PIN as the challenge and skip sending email. A separate `scripts/e2e-user-flow.mjs` drives Chromium plus isolated CLI installs; helpers live in `scripts/e2e-user-flow-lib.mjs` so they can be unit-tested without hitting production.

**Tech Stack:** Node 20+, existing Vitest, Playwright Chromium (headed), Fastify registry API, AIPM CLI (`@aipm-registry/cli` and GitHub `install.sh`).

## Global Constraints

- Do **not** create git commits unless the user explicitly asks.
- PIN and test emails live only in env. Never commit `.env.e2e`. Never log PIN or publish token.
- Fail closed: missing `AIPM_TEST_AUTH_EMAILS`, missing `AIPM_TEST_AUTH_PIN`, or PIN not matching `^\d{6}$` means no bypass.
- Exact email match after `normalizeAuthEmail` (`trim`, NFKC, lowercase).
- `verify-code` stays unchanged. API errors must not mention the test-email allowlist.
- Rate limits still apply to test emails.
- Isolated CLI prefixes only — do not overwrite the machine global `aipm`.
- Do not delete `AIPM_TEST_ORG`.
- Do not add this e2e to default `pnpm test` or CI.
- Leave `scripts/production-smoke.mjs` unchanged.
- Phase 1 does not cover Homebrew, Scoop, winget, GitHub OAuth, inbox polling, private packages, org invites, admin, or docs pages.
- Dashboard has a **Delete skill** control (`#delete-package-name`). Use that on the happy path; API `DELETE /v1/packages/:name` is the `finally` fallback.

## File map

- Create: `scripts/e2e-user-flow-lib.mjs` — env load, URL/package helpers, cookie header, CLI install helpers.
- Create: `scripts/e2e-user-flow.test.mjs` — unit tests for those helpers.
- Create: `scripts/e2e-user-flow.mjs` — headed Playwright + CLI runner.
- Create: `.env.e2e.example` — committed template (no secrets).
- Modify: `apps/registry-api/src/email-auth.ts` — `resolveTestAuthPin`, `requestAuthCode` test-PIN path.
- Modify: `apps/registry-api/src/email-auth.test.ts` — unit tests for PIN helper and request-code skip-email.
- Modify: `apps/registry-api/src/index.ts` — pass `testAuthPin: resolveTestAuthPin(request.body?.email)`.
- Modify: `apps/registry-api/src/email-auth-api.test.ts` — HTTP-level allowlist tests (skipped without `DATABASE_URL`).
- Modify: `package.json` — `e2e:user` script and Playwright devDependency.
- Modify: `infra/azure/PRODUCTION_RUNBOOK.md` — operator steps for PIN env + `pnpm e2e:user`.

---

### Task 1: Test-PIN resolver and request-code bypass

**Files:**
- Modify: `apps/registry-api/src/email-auth.ts`
- Modify: `apps/registry-api/src/email-auth.test.ts`

**Interfaces:**
- Consumes: existing `normalizeAuthEmail`, `sha256Hex`, `requestAuthCode`, `verifyAuthCode`, `EmailAuthStore`.
- Produces: `resolveTestAuthPin(email: string | null | undefined, env?: NodeJS.Dict<string>): string | null`. Extends `requestAuthCode` options with `testAuthPin?: string | null`. When `testAuthPin` is a 6-digit string, that value is the challenge code, email is not sent, and `devCode` is omitted.

- [ ] **Step 1: Write the failing unit tests**

Add to `apps/registry-api/src/email-auth.test.ts` imports: `resolveTestAuthPin`.

Append these tests (keep existing tests):

```ts
describe("resolveTestAuthPin", () => {
  it("returns the pin for an exact allowlisted email", () => {
    expect(
      resolveTestAuthPin("Test.User@Example.com", {
        AIPM_TEST_AUTH_EMAILS: "other@example.com, test.user@example.com",
        AIPM_TEST_AUTH_PIN: "246801",
      }),
    ).toBe("246801");
  });

  it("returns null when env is unset, pin is invalid, or email is not listed", () => {
    expect(resolveTestAuthPin("test.user@example.com", {})).toBeNull();
    expect(
      resolveTestAuthPin("test.user@example.com", {
        AIPM_TEST_AUTH_EMAILS: "test.user@example.com",
        AIPM_TEST_AUTH_PIN: "12",
      }),
    ).toBeNull();
    expect(
      resolveTestAuthPin("other@example.com", {
        AIPM_TEST_AUTH_EMAILS: "test.user@example.com",
        AIPM_TEST_AUTH_PIN: "246801",
      }),
    ).toBeNull();
  });
});

describe("requestAuthCode test pin", () => {
  it("hashes the test pin, skips email, and omits devCode", async () => {
    const store = makeStore({});
    let sent = 0;
    const sender = {
      isEnabled: true,
      async sendAuthCodeEmail() {
        sent += 1;
        return { sent: true, provider: "azure" as const };
      },
    };
    const result = await requestAuthCode(
      store,
      sender,
      { email: "test.user@example.com" },
      { devAuth: true, testAuthPin: "246801" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.emailSent).toBe(false);
    expect(result.body.devCode).toBeUndefined();
    expect(sent).toBe(0);
    const challenge = await store.getActiveAuthEmailChallenge("test.user@example.com");
    expect(challenge?.code_hash).toBe(sha256Hex("246801"));
  });

  it("still verifies the test pin through verifyAuthCode", async () => {
    const store = makeStore({});
    const requested = await requestAuthCode(
      store,
      disabledSender,
      { email: "test.user@example.com" },
      { devAuth: false, testAuthPin: "246801" },
    );
    expect(requested.ok).toBe(true);
    const verify = await verifyAuthCode(store, { email: "test.user@example.com", code: "246801" });
    expect(verify.ok).toBe(true);
    const wrong = await requestAuthCode(
      makeStore({}),
      disabledSender,
      { email: "test.user@example.com" },
      { devAuth: false, testAuthPin: "246801" },
    );
    expect(wrong.ok).toBe(true);
    const failed = await verifyAuthCode(makeStore({
      challenge: {
        id: "challenge-1",
        email: "test.user@example.com",
        code_hash: sha256Hex("246801"),
        attempts: 0,
        expires_at: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
        consumed_at: null,
        request_ip: null,
        created_at: new Date(),
      },
    }), { email: "test.user@example.com", code: "000000" });
    expect(failed).toMatchObject({ ok: false, status: 400 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @aipm-registry/registry-api test src/email-auth.test.ts`

Expected: FAIL because `resolveTestAuthPin` is not exported.

- [ ] **Step 3: Implement resolver and request-code path**

In `apps/registry-api/src/email-auth.ts`, add:

```ts
const TEST_AUTH_PIN_REGEX = /^\d{6}$/;

export function resolveTestAuthPin(
  email: string | null | undefined,
  env: NodeJS.Dict<string> = process.env,
): string | null {
  const normalized = normalizeAuthEmail(email);
  if (!normalized) return null;
  const pin = env.AIPM_TEST_AUTH_PIN?.trim() ?? "";
  if (!TEST_AUTH_PIN_REGEX.test(pin)) return null;
  const allowlist = (env.AIPM_TEST_AUTH_EMAILS ?? "")
    .split(",")
    .map((value) => normalizeAuthEmail(value))
    .filter((value): value is string => Boolean(value));
  return allowlist.includes(normalized) ? pin : null;
}
```

Change `requestAuthCode` options to `{ devAuth: boolean; now?: () => number; testAuthPin?: string | null }`.

Replace the block that starts with `const code = newVerificationCode();` through the `devCode` return with:

```ts
  const testAuthPin =
    options.testAuthPin && TEST_AUTH_PIN_REGEX.test(options.testAuthPin) ? options.testAuthPin : null;
  const code = testAuthPin ?? newVerificationCode();
  const expiresAt = new Date(now + VERIFICATION_CODE_TTL_MS);
  await store.createAuthEmailChallenge({
    email,
    codeHash: sha256Hex(code),
    expiresAt,
    requestIp: input.requestIp ?? null,
  });

  let emailSent = false;
  if (!testAuthPin) {
    try {
      const emailResult = await emailSender.sendAuthCodeEmail({ to: email, code, expiresAt });
      emailSent = emailResult.sent;
    } catch {
      return { ok: false, status: 502, error: "Could not send the verification email. Try again later." };
    }
  }

  await store.recordAuthEvent({
    eventType: "auth.code_sent",
    email,
    ip: input.requestIp ?? null,
    metadata: { emailSent },
  });

  const devCode = !testAuthPin && !emailSender.isEnabled && options.devAuth ? { devCode: code } : {};
  return {
    ok: true,
    status: 201,
    body: {
      ok: true,
      email,
      expiresAt: expiresAt.toISOString(),
      emailSent,
      ...devCode,
    },
  };
```

Leave `verifyAuthCode` untouched.

- [ ] **Step 4: Re-run unit tests**

Run: `pnpm --filter @aipm-registry/registry-api test src/email-auth.test.ts`

Expected: PASS.

- [ ] **Step 5: Do not commit**

---

### Task 2: Wire PIN into the request-code route and cover HTTP

**Files:**
- Modify: `apps/registry-api/src/index.ts` (the `POST /v1/auth/email/request-code` handler)
- Modify: `apps/registry-api/src/email-auth-api.test.ts`

**Interfaces:**
- Consumes: `resolveTestAuthPin` from `./email-auth.js`.
- Produces: `requestAuthCode(..., { devAuth, testAuthPin: resolveTestAuthPin(request.body?.email) })`. HTTP `request-code` for an allowlisted email returns 201 with `emailSent: false` and no `devCode`; `verify-code` with the PIN sets `aipm_session`.

- [ ] **Step 1: Write the failing API tests**

Import `resolveTestAuthPin` is not needed here. In `email-auth-api.test.ts`, extend `afterEach` to also `delete process.env.AIPM_TEST_AUTH_EMAILS` and `delete process.env.AIPM_TEST_AUTH_PIN`.

Add:

```ts
  it("accepts the configured test pin for allowlisted emails without returning it", async () => {
    const email = `pin-${unique()}@example.com`;
    process.env.AIPM_TEST_AUTH_EMAILS = email;
    process.env.AIPM_TEST_AUTH_PIN = "246801";
    await app?.close();
    app = await createApp();

    const request = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/request-code",
      payload: { email },
    });
    expect(request.statusCode).toBe(201);
    const requestBody = request.json() as { ok: boolean; devCode?: string; emailSent: boolean };
    expect(requestBody).toMatchObject({ ok: true, emailSent: false });
    expect(requestBody.devCode).toBeUndefined();

    const verify = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/verify-code",
      payload: { email, code: "246801" },
    });
    expect(verify.statusCode).toBe(200);
    expect(verify.cookies.find((cookie) => cookie.name === "aipm_session")?.value).toBeTruthy();
  });

  it("does not accept the test pin for emails outside the allowlist", async () => {
    const email = `other-${unique()}@example.com`;
    process.env.AIPM_TEST_AUTH_EMAILS = "allowlisted@example.com";
    process.env.AIPM_TEST_AUTH_PIN = "246801";
    await app?.close();
    app = await createApp();

    const request = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/request-code",
      payload: { email },
    });
    expect(request.statusCode).toBe(201);
    const requestBody = request.json() as { devCode?: string };
    const verify = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/verify-code",
      payload: { email, code: "246801" },
    });
    expect(verify.statusCode).toBe(400);
    expect(requestBody.devCode).not.toBe("246801");
  });
```

These tests are inside `describe.skipIf(!databaseUrl)`.

- [ ] **Step 2: Run API tests expecting the allowlisted case to fail**

Run: `pnpm --filter @aipm-registry/registry-api test src/email-auth-api.test.ts`

Expected: the new allowlisted test fails (devCode still returned / PIN not hashed) until the route is wired.

- [ ] **Step 3: Wire the route**

In `apps/registry-api/src/index.ts`, add `resolveTestAuthPin` to the `./email-auth.js` import. Change the request-code call to:

```ts
    const result = await requestAuthCode(
      store,
      emailSender,
      { email: request.body?.email, requestIp: requestIp(request) },
      {
        devAuth: isDevAuthEnabled(process.env),
        testAuthPin: resolveTestAuthPin(request.body?.email),
      },
    );
```

- [ ] **Step 4: Re-run API tests**

Run: `pnpm --filter @aipm-registry/registry-api test src/email-auth-api.test.ts src/email-auth.test.ts`

Expected: PASS when `DATABASE_URL` is set; unit tests always PASS. If `DATABASE_URL` is unset, API file is skipped — that is OK.

- [ ] **Step 5: Do not commit**

---

### Task 3: E2E helper library and unit tests

**Files:**
- Create: `scripts/e2e-user-flow-lib.mjs`
- Create: `scripts/e2e-user-flow.test.mjs`
- Create: `.env.e2e.example`
- Modify: `package.json` (script + playwright later in Task 4; this task only adds helpers tests which `pnpm test:root` already picks up via `scripts/*.test.mjs`)

**Interfaces:**
- Consumes: Node fs/path, `apps/cli/package.json` version for default install.sh URL.
- Produces:
  - `loadDotEnv(filePath: string, env: NodeJS.Dict<string>): Promise<void>`
  - `requiredEnv(env: NodeJS.Dict<string>): { email, pin, org, webUrl, apiUrl }`
  - `packageNameForRun(org: string, unixSeconds: number): string` → `@org/e2e-<unixSeconds>`
  - `packageVersionForRun(unixSeconds: number): string` → `0.0.<unixSeconds>`
  - `publicPackagePath(packageName: string, version: string): string`
  - `dashboardPackagePath(packageName: string): string`
  - `defaultInstallShUrl(cliVersion: string): string`
  - `cookieHeader(cookies: Array<{ name: string; value: string }>): string`
  - `redactSecrets(text: string, secrets: string[]): string`

- [ ] **Step 1: Write helper tests**

Create `scripts/e2e-user-flow.test.mjs`:

```js
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cookieHeader,
  dashboardPackagePath,
  defaultInstallShUrl,
  loadDotEnv,
  packageNameForRun,
  packageVersionForRun,
  publicPackagePath,
  redactSecrets,
  requiredEnv,
} from "./e2e-user-flow-lib.mjs";

describe("e2e-user-flow helpers", () => {
  it("builds package names, versions, and page paths", () => {
    expect(packageNameForRun("acme-corp", 1700000000)).toBe("@acme-corp/e2e-1700000000");
    expect(packageVersionForRun(1700000000)).toBe("0.0.1700000000");
    expect(publicPackagePath("@acme-corp/e2e-1700000000", "0.0.1700000000")).toBe(
      "/packages/acme-corp/e2e-1700000000/0.0.1700000000",
    );
    expect(dashboardPackagePath("@acme-corp/e2e-1700000000")).toBe(
      "/dashboard/packages/acme-corp/e2e-1700000000",
    );
  });

  it("requires env vars and does not echo the pin", () => {
    expect(() => requiredEnv({})).toThrow(/AIPM_TEST_EMAIL/);
    const parsed = requiredEnv({
      AIPM_TEST_EMAIL: "test.user@example.com",
      AIPM_TEST_AUTH_PIN: "246801",
      AIPM_TEST_ORG: "acme-corp",
      WEB_URL: "https://www.aipm-registry.com/",
      API_URL: "https://api.aipm-registry.com/",
    });
    expect(parsed).toMatchObject({
      email: "test.user@example.com",
      pin: "246801",
      org: "acme-corp",
      webUrl: "https://www.aipm-registry.com",
      apiUrl: "https://api.aipm-registry.com",
    });
    expect(redactSecrets("token=aipm_secret pin=246801", ["aipm_secret", "246801"])).toBe(
      "token=<redacted> pin=<redacted>",
    );
  });

  it("loads dotenv without overriding existing env", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aipm-e2e-env-"));
    const file = join(dir, ".env.e2e");
    await writeFile(file, "AIPM_TEST_ORG=from-file\nAIPM_TEST_EMAIL=from-file@example.com\n");
    const env = { AIPM_TEST_ORG: "already-set" };
    await loadDotEnv(file, env);
    expect(env.AIPM_TEST_ORG).toBe("already-set");
    expect(env.AIPM_TEST_EMAIL).toBe("from-file@example.com");
  });

  it("builds cookie headers and the default install.sh URL", () => {
    expect(cookieHeader([{ name: "aipm_session", value: "abc" }])).toBe("aipm_session=abc");
    expect(defaultInstallShUrl("0.3.3")).toBe(
      "https://github.com/abhisri2090/aipm/releases/download/cli-v0.3.3/install.sh",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run scripts/e2e-user-flow.test.mjs`

Expected: FAIL — cannot find `./e2e-user-flow-lib.mjs`.

- [ ] **Step 3: Implement the library and env example**

Create `scripts/e2e-user-flow-lib.mjs`:

```js
import { readFile } from "node:fs/promises";

export function normalizeUrl(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

export async function loadDotEnv(filePath, env = process.env) {
  let text = "";
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (env[key] === undefined) env[key] = value;
  }
}

export function requiredEnv(env = process.env) {
  const missing = ["AIPM_TEST_EMAIL", "AIPM_TEST_AUTH_PIN", "AIPM_TEST_ORG"].filter(
    (key) => !String(env[key] ?? "").trim(),
  );
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(", ")}. Copy .env.e2e.example to .env.e2e.`);
  }
  const pin = String(env.AIPM_TEST_AUTH_PIN).trim();
  if (!/^\d{6}$/.test(pin)) throw new Error("AIPM_TEST_AUTH_PIN must be exactly 6 digits.");
  return {
    email: String(env.AIPM_TEST_EMAIL).trim(),
    pin,
    org: String(env.AIPM_TEST_ORG).trim().replace(/^@/, ""),
    webUrl: normalizeUrl(env.WEB_URL ?? "https://www.aipm-registry.com"),
    apiUrl: normalizeUrl(env.API_URL ?? "https://api.aipm-registry.com"),
    installShUrl: String(env.AIPM_CLI_RELEASE_INSTALL_SH ?? "").trim(),
  };
}

export function packageNameForRun(org, unixSeconds) {
  return `@${org}/e2e-${unixSeconds}`;
}

export function packageVersionForRun(unixSeconds) {
  return `0.0.${unixSeconds}`;
}

export function publicPackagePath(packageName, version) {
  const [scope, name] = packageName.replace(/^@/, "").split("/");
  return `/packages/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(name ?? "")}/${encodeURIComponent(version)}`;
}

export function dashboardPackagePath(packageName) {
  return `/dashboard/packages/${packageName.replace(/^@/, "")}`;
}

export function defaultInstallShUrl(cliVersion) {
  return `https://github.com/abhisri2090/aipm/releases/download/cli-v${cliVersion}/install.sh`;
}

export function cookieHeader(cookies) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

export function redactSecrets(text, secrets) {
  return secrets.reduce((current, secret) => {
    if (!secret) return current;
    return current.split(secret).join("<redacted>");
  }, text);
}
```

Create `.env.e2e.example`:

```txt
# Local e2e secrets. Copy to .env.e2e (gitignored). Never commit real values.
# Production API must have the same email in AIPM_TEST_AUTH_EMAILS and the same PIN in AIPM_TEST_AUTH_PIN.

AIPM_TEST_EMAIL=
AIPM_TEST_AUTH_PIN=
AIPM_TEST_ORG=
WEB_URL=https://www.aipm-registry.com
API_URL=https://api.aipm-registry.com
# Optional. Defaults to the GitHub install.sh for the CLI version in apps/cli/package.json.
# AIPM_CLI_RELEASE_INSTALL_SH=https://github.com/abhisri2090/aipm/releases/download/cli-v0.3.3/install.sh
```

- [ ] **Step 4: Re-run helper tests**

Run: `pnpm exec vitest run scripts/e2e-user-flow.test.mjs`

Expected: PASS.

- [ ] **Step 5: Do not commit**

---

### Task 4: Headed e2e runner (CLI + website + publish + cleanup)

**Files:**
- Create: `scripts/e2e-user-flow.mjs`
- Modify: `package.json` — add `"e2e:user": "node scripts/e2e-user-flow.mjs"` and Playwright as a root devDependency
- Modify: `infra/azure/PRODUCTION_RUNBOOK.md` — document PIN env and `pnpm e2e:user`

**Interfaces:**
- Consumes: helpers from `scripts/e2e-user-flow-lib.mjs`, Playwright `chromium`, npm, curl `install.sh`, dashboard selectors `#login-email`, `#login-code`, `#dashboard-org-switcher`, `#org-slug`, `#org-name`, `#package-name`, `#package-visibility`, `#delete-package-name`.
- Produces: `pnpm e2e:user` which performs the spec run order and always cleans up.

- [ ] **Step 1: Add Playwright and the npm script**

Run:

```bash
pnpm add -Dw playwright
```

In root `package.json` `scripts`, add next to `prod:smoke`:

```json
"e2e:user": "node scripts/e2e-user-flow.mjs"
```

Install Chromium once:

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 2: Implement `scripts/e2e-user-flow.mjs`**

Implement the runner with this shape (full file). Do not print `cfg.pin` or the publish token.

```js
#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";
import {
  cookieHeader,
  dashboardPackagePath,
  defaultInstallShUrl,
  loadDotEnv,
  packageNameForRun,
  packageVersionForRun,
  publicPackagePath,
  redactSecrets,
  requiredEnv,
} from "./e2e-user-flow-lib.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(repoRoot, ".env.e2e");
await loadDotEnv(envPath);
const cfg = requiredEnv();
const cliVersion = JSON.parse(await readFile(join(repoRoot, "apps/cli/package.json"), "utf8")).version;
const installShUrl = cfg.installShUrl || defaultInstallShUrl(cliVersion);
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
  if (!state.page) return;
  await mkdir(screenshotDir, { recursive: true });
  await state.page.screenshot({ path: join(screenshotDir, `${label}.png`), fullPage: true });
}

async function sessionHeaders() {
  const cookies = (await state.context?.cookies()) ?? [];
  return { cookie: cookieHeader(cookies) };
}

async function apiFetch(path, init = {}) {
  const href = `${cfg.apiUrl}${path}`;
  const headers = { ...(init.headers ?? {}), ...(await sessionHeaders()) };
  const response = await fetch(href, { ...init, headers });
  const text = await response.text();
  return { href, response, text };
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

async function cleanup(originalError) {
  const errors = [];
  try {
    if (state.published || state.reserved) {
      if (state.page && !state.page.isClosed()) {
        await state.page.goto(`${cfg.webUrl}${dashboardPackagePath(packageName)}`, { waitUntil: "domcontentloaded" });
        const deleteInput = state.page.locator("#delete-package-name");
        if (await deleteInput.count()) {
          await deleteInput.fill(packageName);
          await state.page.getByRole("button", { name: "Delete skill" }).click();
          await state.page.waitForURL("**/dashboard/packages**");
        }
      }
      const del = await apiFetch(`/v1/packages/${encodeURIComponent(packageName)}`, { method: "DELETE" });
      if (![204, 404].includes(del.response.status)) {
        const reservedDel = await apiFetch(
          `/v1/orgs/${encodeURIComponent(cfg.org)}/packages/${encodeURIComponent(packageName)}`,
          { method: "DELETE" },
        );
        if (![204, 404].includes(reservedDel.response.status)) {
          errors.push(`cleanup delete returned ${del.response.status}/${reservedDel.response.status}`);
        }
      }
      if (state.published) {
        const page = await fetch(`${cfg.webUrl}${publicPackagePath(packageName, packageVersion)}`);
        if (page.status === 200) errors.push("public package page still returned 200 after delete");
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await state.browser?.close();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
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

async function loginAndPreparePackage() {
  state.browser = await chromium.launch({ headless: false });
  state.context = await state.browser.newContext();
  state.page = await state.context.newPage();
  const page = state.page;
  await page.goto(`${cfg.webUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.locator("#login-email").fill(cfg.email);
  await page.getByRole("button", { name: "Send verification code" }).click();
  await page.locator("#login-code").fill(cfg.pin);
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.locator("#dashboard-org-switcher").waitFor({ timeout: 30000 }).catch(() => {});
  const switcher = page.locator("#dashboard-org-switcher");
  if ((await switcher.count()) && (await switcher.locator("option").allTextContents()).some((text) => text.includes(`@${cfg.org}`))) {
    await switcher.selectOption(cfg.org);
  } else {
    await page.goto(`${cfg.webUrl}/dashboard/orgs`, { waitUntil: "domcontentloaded" });
    await page.locator("#org-slug").fill(cfg.org);
    const name = page.locator("#org-name");
    if (await name.count()) await name.fill(cfg.org);
    await page.getByRole("button", { name: "Create organization" }).click();
    await page.locator("#dashboard-org-switcher").waitFor({ timeout: 30000 });
    await page.locator("#dashboard-org-switcher").selectOption(cfg.org);
  }
  await page.goto(`${cfg.webUrl}/dashboard/packages`, { waitUntil: "domcontentloaded" });
  await page.locator("#package-name").fill(packageName);
  await page.getByRole("button", { name: "Reserve package" }).click();
  await page.waitForURL(`**${dashboardPackagePath(packageName)}**`, { timeout: 30000 });
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
    [
      "publish",
      "init",
      "--name",
      packageName,
      "--version",
      packageVersion,
      "--template",
      "blank",
      "--here",
    ],
    { cwd: skillDir },
  );
  const published = await runAipm(["publish", skillDir, "--registry", cfg.apiUrl, "--token", token], {
    cwd: skillDir,
  });
  assert(published.stdout.includes(`Published ${packageName}@${packageVersion}`), "Publish output missing version");
  state.published = true;
  const listing = await fetch(`${cfg.webUrl}${publicPackagePath(packageName, packageVersion)}`);
  const html = await listing.text();
  assert(listing.ok, `Package page returned ${listing.status}`);
  assert(html.includes(`aipm add ${packageName}@${packageVersion}`), "Package page missing install command");
  const projectDir = join(state.tempRoot, "project");
  await mkdir(join(projectDir, ".cursor"), { recursive: true });
  await runAipm(["init", "--registry", cfg.apiUrl, "--target", "cursor"], { cwd: projectDir });
  await runAipm(["add", `${packageName}@${packageVersion}`, "--target", "cursor", "--ci"], { cwd: projectDir });
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
```

Notes for the implementer:

- After **Create organization**, the app redirects to `/dashboard/orgs`. Wait for `#dashboard-org-switcher` before selecting.
- **Reserve package** on `/dashboard/packages` may stay on the same page (PackagesContent) rather than redirect. If `waitForURL` times out, click the reserved package link or `goto` `dashboardPackagePath` directly, then continue.
- Generate token button text is `Generate token` on the package page.
- `aipm publish <dir> --token` is the existing one-shot command in `apps/cli/src/bin.ts`.
- Cleanup must run if login fails after reserve, and must not throw away the original error.

- [ ] **Step 3: Document operator steps in the runbook**

In `infra/azure/PRODUCTION_RUNBOOK.md`, after the `pnpm prod:smoke` section (after the local/staging examples, before “Publish smoke is intentionally opt-in”), add a `## Package user-flow e2e` section that states:

- Headed script; not part of `pnpm test` or CI.
- Production API must set `AIPM_TEST_AUTH_EMAILS` and `AIPM_TEST_AUTH_PIN` (same values as `.env.e2e`) before the first run.
- Local steps: `cp .env.e2e.example .env.e2e`, fill email/PIN/org, `pnpm exec playwright install chromium`, `pnpm e2e:user`.
- Do not paste the PIN or publish tokens into chat, logs, or git.

Use indented code samples so markdown fences do not nest.

- [ ] **Step 4: Run helper tests plus registry-api tests**

Run:

```bash
pnpm exec vitest run scripts/e2e-user-flow.test.mjs
pnpm --filter @aipm-registry/registry-api test src/email-auth.test.ts
```

Expected: PASS.

Do **not** run `pnpm e2e:user` until the user has filled `.env.e2e` and the production API has `AIPM_TEST_AUTH_EMAILS` / `AIPM_TEST_AUTH_PIN`. Ask before hitting production.

- [ ] **Step 5: Do not commit**

---

## Spec coverage

| Spec requirement | Task |
|---|---|
| Env-gated exact-email PIN, fail closed, no `devCode`, skip email | 1, 2 |
| `verify-code` unchanged | 1 |
| Unit + API tests for PIN | 1, 2 |
| `.env.e2e` gitignored, `.env.e2e.example` committed | 3 (gitignore already has `!.env.e2e.example`) |
| `pnpm e2e:user`, Playwright headed | 4 |
| npm then curl isolated CLI | 4 |
| Login `#login-email` / `#login-code`, org reuse/create, reserve `e2e-<unix>`, token from UI | 4 |
| Publish one-shot, website assert, `aipm add` | 4 |
| Cleanup always; do not delete org; screenshot on failure | 4 |
| Runbook operator steps | 4 |
| Not in default CI/test | 4 |
| production-smoke unchanged | (no task touches it) |
