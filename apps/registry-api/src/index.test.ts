import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./index.js";
import {
  createInstallToken,
  createOrg,
  createPool,
  ensureSchema,
  reservePackageName,
  upsertGithubUser,
} from "./db.js";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];
let app: FastifyInstance | null = null;
const token = "test-publish-token";
const savedDatabaseUrl = process.env.DATABASE_URL;

function tokenHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function pkceChallenge(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

async function createTarball(
  version: string,
  name = "@team/api-skill",
  manifestExtras: Record<string, unknown> = {},
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "aipm-api-skill-"));
  tempDirs.push(dir);
  await writeFile(join(dir, "SKILL.md"), "Skill body\n");
  await writeFile(
    join(dir, "aipm.manifest.json"),
    JSON.stringify({
      schemaVersion: "0.1",
      name,
      version,
      type: "skill",
      description: "API skill",
      entry: "SKILL.md",
      targets: ["cursor"],
      ...manifestExtras,
    }),
  );
  const { stdout } = await execFileAsync("tar", ["-czf", "-", "-C", dir, "."], {
    encoding: "buffer",
  });
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

function multipartPayload(tarball: Buffer): { body: Buffer; contentType: string } {
  const boundary = `aipm-${Date.now()}`;
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="tarball"; filename="package.tgz"\r\nContent-Type: application/gzip\r\n\r\n`,
      ),
      tarball,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  };
}

beforeEach(async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "aipm-api-data-"));
  tempDirs.push(dataDir);
  process.env.AIPM_DATA_DIR = dataDir;
  process.env.AIPM_METADATA_BACKEND = "file";
  process.env.AIPM_REQUIRE_PUBLISH_TOKEN = "true";
  process.env.AIPM_PUBLISH_TOKEN_SHA256 = tokenHash(token);
  delete process.env.AZURE_STORAGE_CONNECTION_STRING;
  delete process.env.AIPM_DEV_AUTH;
  delete process.env.AIPM_EMAIL_PROVIDER;
  delete process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING;
  delete process.env.AIPM_EMAIL_SENDER_ADDRESS;
  delete process.env.AIPM_EMAIL_FROM_NAME;
  delete process.env.DATABASE_URL;
  delete process.env.NODE_ENV;
  app = await createApp();
});

afterEach(async () => {
  await app?.close();
  app = null;
  delete process.env.AIPM_DATA_DIR;
  delete process.env.AIPM_METADATA_BACKEND;
  delete process.env.AIPM_REQUIRE_PUBLISH_TOKEN;
  delete process.env.AIPM_PUBLISH_TOKEN_SHA256;
  delete process.env.AIPM_DEV_AUTH;
  delete process.env.AIPM_EMAIL_PROVIDER;
  delete process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING;
  delete process.env.AIPM_EMAIL_SENDER_ADDRESS;
  delete process.env.AIPM_EMAIL_FROM_NAME;
  if (savedDatabaseUrl !== undefined) process.env.DATABASE_URL = savedDatabaseUrl;
  else delete process.env.DATABASE_URL;
  delete process.env.NODE_ENV;
  delete process.env.KEY_VAULT_NAME;
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("registry API production behavior", () => {
  it("keeps readiness public", async () => {
    const response = await app!.inject({ method: "GET", url: "/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok", metadata: "file" });
  });

  it("rejects unauthenticated publish", async () => {
    const tarball = await createTarball("1.0.0");
    const payload = multipartPayload(tarball);
    const response = await app!.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent("@team/api-skill")}/versions`,
      headers: { "content-type": payload.contentType },
      payload: payload.body,
    });
    expect(response.statusCode).toBe(401);
  });

  it("publishes with a token and keeps reads public", async () => {
    const tarball = await createTarball("1.0.1");
    const payload = multipartPayload(tarball);
    const publish = await app!.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent("@team/api-skill")}/versions`,
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: payload.body,
    });
    expect(publish.statusCode).toBe(201);

    const list = await app!.inject({ method: "GET", url: "/v1/packages?limit=1" });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toMatchObject({
      packages: [{ name: "@team/api-skill", version: "1.0.1", publisher: null, import: { imported: false } }],
    });

    const detail = await app!.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent("@team/api-skill")}/versions/1.0.1`,
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      publisher: null,
      import: { imported: false, sourceUrl: null },
    });
  });

  it("lists and reads package files for public packages", async () => {
    const tarball = await createTarball("2.0.0", "@team/files-skill");
    const payload = multipartPayload(tarball);
    const publish = await app!.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent("@team/files-skill")}/versions`,
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: payload.body,
    });
    expect(publish.statusCode).toBe(201);

    const files = await app!.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent("@team/files-skill")}/versions/2.0.0/files`,
    });
    expect(files.statusCode).toBe(200);
    expect(files.json()).toMatchObject({
      entry: "SKILL.md",
      files: expect.arrayContaining([
        expect.objectContaining({ path: "SKILL.md" }),
        expect.objectContaining({ path: "aipm.manifest.json" }),
      ]),
    });

    const content = await app!.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent("@team/files-skill")}/versions/2.0.0/files/content?path=${encodeURIComponent("SKILL.md")}`,
    });
    expect(content.statusCode).toBe(200);
    expect(content.json()).toMatchObject({
      path: "SKILL.md",
      binary: false,
      content: "Skill body\n",
    });
  });

  it("returns and searches package quality metadata", async () => {
    const tarball = await createTarball("1.0.4", "@team/quality-skill", {
      usage: "Use this skill to summarize production issues for handoff.",
      tags: ["issue-summarizer", "handoff"],
      categories: ["Support", "Engineering"],
      sourceUrl: "https://github.com/team/quality-skill",
      examples: [{ title: "Summarize issue", prompt: "Summarize this Sentry issue." }],
      releaseNotes: "Adds issue summarizer guidance.",
    });
    const payload = multipartPayload(tarball);
    const publish = await app!.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent("@team/quality-skill")}/versions`,
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: payload.body,
    });
    expect(publish.statusCode).toBe(201);

    const list = await app!.inject({ method: "GET", url: "/v1/packages?q=issue-summarizer" });
    expect(list.statusCode).toBe(200);
    expect(list.json().packages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "@team/quality-skill",
          tags: ["issue-summarizer", "handoff"],
          categories: ["Support", "Engineering"],
          sourceUrl: "https://github.com/team/quality-skill",
        }),
      ]),
    );

    const detail = await app!.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent("@team/quality-skill")}/versions/1.0.4`,
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().manifest).toMatchObject({
      usage: "Use this skill to summarize production issues for handoff.",
      examples: [{ title: "Summarize issue", prompt: "Summarize this Sentry issue." }],
      releaseNotes: "Adds issue summarizer guidance.",
    });
  });

  it.each(["0", "-5", "abc", "101"])("rejects invalid list limit %s", async (limit) => {
    const response = await app!.inject({ method: "GET", url: `/v1/packages?limit=${encodeURIComponent(limit)}` });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "Invalid limit; use an integer from 1 to 100",
    });
  });

  it("rejects invalid list cursors without leaking storage errors", async () => {
    const response = await app!.inject({ method: "GET", url: "/v1/packages?cursor=not-a-date" });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "Invalid cursor; use an ISO timestamp returned as nextCursor",
    });
  });

  it.skipIf(!savedDatabaseUrl)("requires reserved package names for admin-token publishing when accounts are enabled", async () => {
    await app?.close();
    app = null;
    process.env.DATABASE_URL = savedDatabaseUrl!;
    process.env.NODE_ENV = "production";

    const pool = createPool(savedDatabaseUrl!);
    await ensureSchema(pool);
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
    const owner = await upsertGithubUser(pool, {
      githubId: `publish-owner-${suffix}`,
      githubLogin: `publish-owner-${suffix}`,
      name: "Publish Owner",
    });
    const org = await createOrg(pool, {
      slug: `publish-${suffix}`,
      name: "Publish Test",
      ownerUserId: owner.id,
    });
    const reservedName = `@${org.slug}/reserved-skill`;
    await reservePackageName(pool, {
      name: reservedName,
      orgId: org.id,
      ownerUserId: owner.id,
    });
    await pool.end();

    app = await createApp();

    const unreservedTarball = await createTarball("1.0.0", `@${org.slug}/unreserved-skill`);
    const unreservedPayload = multipartPayload(unreservedTarball);
    const unreserved = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent(`@${org.slug}/unreserved-skill`)}/versions`,
      headers: {
        "content-type": unreservedPayload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: unreservedPayload.body,
    });
    expect(unreserved.statusCode).toBe(403);
    expect(unreserved.json()).toMatchObject({ error: "Package name must be reserved before publishing" });

    const reservedTarball = await createTarball("1.0.0", reservedName);
    const reservedPayload = multipartPayload(reservedTarball);
    const reserved = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent(reservedName)}/versions`,
      headers: {
        "content-type": reservedPayload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: reservedPayload.body,
    });
    expect(reserved.statusCode).toBe(201);
  });

  it("keeps admin stats behind account services", async () => {
    const response = await app!.inject({ method: "GET", url: "/v1/admin/stats" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: "Account services are not configured" });
  });

  it("hides demo packages from public listing by default", async () => {
    const tarball = await createTarball("1.0.2", "@team/sample-skill");
    const payload = multipartPayload(tarball);
    const publish = await app!.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent("@team/sample-skill")}/versions`,
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: payload.body,
    });
    expect(publish.statusCode).toBe(201);

    const publicList = await app!.inject({ method: "GET", url: "/v1/packages?q=sample" });
    expect(publicList.statusCode).toBe(200);
    expect(publicList.json()).toMatchObject({ packages: [] });

    const demoList = await app!.inject({
      method: "GET",
      url: "/v1/packages?q=sample&includeDemo=true",
    });
    expect(demoList.statusCode).toBe(200);
    expect(demoList.json()).toMatchObject({
      packages: [{ name: "@team/sample-skill", version: "1.0.2" }],
    });
  });

  it("reports auth config without dev auth by default", async () => {
    const response = await app!.inject({ method: "GET", url: "/v1/auth/config" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ devAuth: false, githubAuth: false, emailAuth: false });
  });

  it("rejects dev login when dev auth is disabled", async () => {
    const response = await app!.inject({ method: "GET", url: "/v1/auth/dev/login" });
    expect(response.statusCode).toBe(404);
  });

  it("rejects install recording when account services are not configured", async () => {
    const response = await app!.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent("@team/api-skill")}/installs`,
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: "Account services are not configured" });
  });
});

describe("package install counter", () => {
  it.skipIf(!savedDatabaseUrl)("records installs and exposes installCount", async () => {
    await app?.close();
    app = null;
    process.env.DATABASE_URL = savedDatabaseUrl!;
    process.env.NODE_ENV = "production";

    const pool = createPool(savedDatabaseUrl!);
    await ensureSchema(pool);
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
    const owner = await upsertGithubUser(pool, {
      githubId: `install-owner-${suffix}`,
      githubLogin: `install-owner-${suffix}`,
      name: "Install Owner",
    });
    const org = await createOrg(pool, {
      slug: `install-${suffix}`,
      name: "Install Test",
      ownerUserId: owner.id,
    });
    const packageName = `@${org.slug}/install-count-skill`;
    await reservePackageName(pool, {
      name: packageName,
      orgId: org.id,
      ownerUserId: owner.id,
    });
    await pool.end();

    app = await createApp();

    const tarball = await createTarball("1.0.0", packageName);
    const payload = multipartPayload(tarball);
    const publish = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions`,
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: payload.body,
    });
    expect(publish.statusCode).toBe(201);

    const record = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent(packageName)}/installs`,
    });
    expect(record.statusCode).toBe(200);
    expect(record.json()).toEqual({ installCount: 1 });

    const detail = await app.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions/1.0.0`,
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({ installCount: 1 });

    const list = await app.inject({
      method: "GET",
      url: `/v1/packages?q=${encodeURIComponent(org.slug)}`,
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().packages).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: packageName, installCount: 1 })]),
    );
  });

  it.skipIf(!savedDatabaseUrl)("returns 404 for unknown packages", async () => {
    await app?.close();
    app = null;
    process.env.DATABASE_URL = savedDatabaseUrl!;
    process.env.NODE_ENV = "production";
    app = await createApp();

    const response = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent("@missing/pkg")}/installs`,
    });
    expect(response.statusCode).toBe(404);
  });

  it.skipIf(!savedDatabaseUrl)("returns 404 for private packages without access", async () => {
    await app?.close();
    app = null;
    process.env.DATABASE_URL = savedDatabaseUrl!;
    process.env.NODE_ENV = "production";

    const pool = createPool(savedDatabaseUrl!);
    await ensureSchema(pool);
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
    const owner = await upsertGithubUser(pool, {
      githubId: `private-owner-${suffix}`,
      githubLogin: `private-owner-${suffix}`,
      name: "Private Owner",
    });
    const org = await createOrg(pool, {
      slug: `private-${suffix}`,
      name: "Private Test",
      ownerUserId: owner.id,
    });
    const packageName = `@${org.slug}/private-skill`;
    await reservePackageName(pool, {
      name: packageName,
      orgId: org.id,
      ownerUserId: owner.id,
      visibility: "private",
    });
    await pool.end();

    app = await createApp();

    const tarball = await createTarball("1.0.0", packageName);
    const payload = multipartPayload(tarball);
    const publish = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions`,
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: payload.body,
    });
    expect(publish.statusCode).toBe(201);

    const response = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent(packageName)}/installs`,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("CLI auth flow", () => {
  it.skipIf(!savedDatabaseUrl)("issues and refreshes CLI tokens through one-time code exchange", async () => {
    await app?.close();
    app = null;
    process.env.DATABASE_URL = savedDatabaseUrl!;
    process.env.AIPM_DEV_AUTH = "1";

    const pool = createPool(savedDatabaseUrl!);
    await ensureSchema(pool);
    await pool.end();
    app = await createApp();

    const login = await app.inject({ method: "GET", url: "/v1/auth/dev/login" });
    expect(login.statusCode).toBe(302);
    const cookie = login.headers["set-cookie"];
    const sessionCookie = Array.isArray(cookie) ? cookie[0] : cookie;
    expect(sessionCookie).toContain("aipm_session=");

    const verifier = "a".repeat(64);
    const redirectUri = "http://127.0.0.1:49152/callback";
    const authorize = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/authorize",
      headers: { cookie: sessionCookie },
      payload: {
        redirectUri,
        state: "test-state",
        codeChallenge: pkceChallenge(verifier),
        deviceName: "Test CLI",
      },
    });
    expect(authorize.statusCode).toBe(200);
    const redirectTo = new URL(authorize.json().redirectTo);
    expect(redirectTo.origin).toBe("http://127.0.0.1:49152");
    expect(redirectTo.searchParams.get("state")).toBe("test-state");
    const code = redirectTo.searchParams.get("code");
    expect(code).toMatch(/^aipm_cli_code_/);

    const token = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/token",
      payload: { code, codeVerifier: verifier, redirectUri, deviceName: "Test CLI" },
    });
    expect(token.statusCode).toBe(200);
    expect(token.json()).toMatchObject({
      tokenType: "Bearer",
      accessToken: expect.stringMatching(/^aipm_cli_access_/),
      refreshToken: expect.stringMatching(/^aipm_cli_refresh_/),
    });

    const me = await app.inject({
      method: "GET",
      url: "/v1/cli-auth/me",
      headers: { authorization: `Bearer ${token.json().accessToken}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user).toMatchObject({ githubLogin: "dev-local" });

    const refresh = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/refresh",
      payload: { refreshToken: token.json().refreshToken },
    });
    expect(refresh.statusCode).toBe(200);
    expect(refresh.json().accessToken).toMatch(/^aipm_cli_access_/);

    const logout = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/logout",
      payload: { refreshToken: token.json().refreshToken },
    });
    expect(logout.statusCode).toBe(200);

    const revokedRefresh = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/refresh",
      payload: { refreshToken: token.json().refreshToken },
    });
    expect(revokedRefresh.statusCode).toBe(401);
  });

  it.skipIf(!savedDatabaseUrl)("rejects invalid CLI auth inputs and reused codes", async () => {
    await app?.close();
    app = null;
    process.env.DATABASE_URL = savedDatabaseUrl!;
    process.env.AIPM_DEV_AUTH = "1";

    const pool = createPool(savedDatabaseUrl!);
    await ensureSchema(pool);
    await pool.end();
    app = await createApp();

    const login = await app.inject({ method: "GET", url: "/v1/auth/dev/login" });
    const cookie = login.headers["set-cookie"];
    const sessionCookie = Array.isArray(cookie) ? cookie[0] : cookie;
    const verifier = "b".repeat(64);
    const redirectUri = "http://127.0.0.1:49153/callback";

    const invalidRedirect = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/authorize",
      headers: { cookie: sessionCookie },
      payload: {
        redirectUri: "https://example.com/callback",
        state: "test-state",
        codeChallenge: pkceChallenge(verifier),
      },
    });
    expect(invalidRedirect.statusCode).toBe(400);

    const authorize = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/authorize",
      headers: { cookie: sessionCookie },
      payload: {
        redirectUri,
        state: "test-state",
        codeChallenge: pkceChallenge(verifier),
      },
    });
    const code = new URL(authorize.json().redirectTo).searchParams.get("code");

    const invalidVerifier = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/token",
      payload: { code, codeVerifier: "short", redirectUri },
    });
    expect(invalidVerifier.statusCode).toBe(400);

    const token = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/token",
      payload: { code, codeVerifier: verifier, redirectUri },
    });
    expect(token.statusCode).toBe(200);

    const reused = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/token",
      payload: { code, codeVerifier: verifier, redirectUri },
    });
    expect(reused.statusCode).toBe(400);
  });

  it.skipIf(!savedDatabaseUrl)("allows private package reads with CLI login and org install token", async () => {
    await app?.close();
    app = null;
    process.env.DATABASE_URL = savedDatabaseUrl!;
    process.env.AIPM_DEV_AUTH = "1";

    const pool = createPool(savedDatabaseUrl!);
    await ensureSchema(pool);
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
    const owner = await upsertGithubUser(pool, {
      githubId: "dev-local",
      githubLogin: "dev-local",
      name: "Dev Local",
    });
    const org = await createOrg(pool, {
      slug: `cli-private-${suffix}`,
      name: "CLI Private Test",
      ownerUserId: owner.id,
    });
    const packageName = `@${org.slug}/private-skill`;
    await reservePackageName(pool, {
      name: packageName,
      orgId: org.id,
      ownerUserId: owner.id,
      visibility: "private",
    });
    const installToken = `aipm_install_${suffix}`;
    await createInstallToken(pool, {
      orgId: org.id,
      userId: owner.id,
      name: "CI",
      tokenHash: tokenHash(installToken),
      expiresAt: null,
    });
    await pool.end();
    app = await createApp();

    const tarball = await createTarball("1.0.0", packageName);
    const payload = multipartPayload(tarball);
    const publish = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions`,
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: payload.body,
    });
    expect(publish.statusCode).toBe(201);

    const anonymous = await app.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions/1.0.0`,
    });
    expect(anonymous.statusCode).toBe(404);

    const withInstallToken = await app.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions/1.0.0`,
      headers: { authorization: `Bearer ${installToken}` },
    });
    expect(withInstallToken.statusCode).toBe(200);
    expect(withInstallToken.json()).toMatchObject({ name: packageName, visibility: "private" });

    const login = await app.inject({ method: "GET", url: "/v1/auth/dev/login" });
    const cookie = login.headers["set-cookie"];
    const sessionCookie = Array.isArray(cookie) ? cookie[0] : cookie;
    const verifier = "c".repeat(64);
    const redirectUri = "http://127.0.0.1:49154/callback";
    const authorize = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/authorize",
      headers: { cookie: sessionCookie },
      payload: {
        redirectUri,
        state: "test-state",
        codeChallenge: pkceChallenge(verifier),
      },
    });
    const code = new URL(authorize.json().redirectTo).searchParams.get("code");
    const cliToken = await app.inject({
      method: "POST",
      url: "/v1/cli-auth/token",
      payload: { code, codeVerifier: verifier, redirectUri },
    });
    expect(cliToken.statusCode).toBe(200);

    const withCliLogin = await app.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions/1.0.0`,
      headers: { authorization: `Bearer ${cliToken.json().accessToken}` },
    });
    expect(withCliLogin.statusCode).toBe(200);

    const anonymousFiles = await app.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions/1.0.0/files`,
    });
    expect(anonymousFiles.statusCode).toBe(404);

    const privateFiles = await app.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions/1.0.0/files`,
      headers: { cookie: sessionCookie },
    });
    expect(privateFiles.statusCode).toBe(200);
    expect(privateFiles.json()).toMatchObject({
      entry: "SKILL.md",
      files: expect.arrayContaining([expect.objectContaining({ path: "SKILL.md" })]),
    });

    const privateContent = await app.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent(packageName)}/versions/1.0.0/files/content?path=${encodeURIComponent("SKILL.md")}`,
      headers: { cookie: sessionCookie },
    });
    expect(privateContent.statusCode).toBe(200);
    expect(privateContent.json()).toMatchObject({
      path: "SKILL.md",
      binary: false,
      content: "Skill body\n",
    });

    const publicTarball = await createTarball("1.0.0", `@${org.slug}/public-skill`);
    const publicPackageName = `@${org.slug}/public-skill`;
    const publicPool = createPool(savedDatabaseUrl!);
    await reservePackageName(publicPool, {
      name: publicPackageName,
      orgId: org.id,
      ownerUserId: owner.id,
      visibility: "public",
    });
    await publicPool.end();
    const publicPayload = multipartPayload(publicTarball);
    const publicPublish = await app.inject({
      method: "POST",
      url: `/v1/packages/${encodeURIComponent(publicPackageName)}/versions`,
      headers: {
        "content-type": publicPayload.contentType,
        authorization: `Bearer ${token}`,
      },
      payload: publicPayload.body,
    });
    expect(publicPublish.statusCode).toBe(201);
    const publicRead = await app.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent(publicPackageName)}/versions/1.0.0`,
    });
    expect(publicRead.statusCode).toBe(200);
  });
});

describe("local safety in createApp", () => {
  it("rejects remote database URLs outside production", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "aipm-api-safety-"));
    tempDirs.push(dataDir);
    process.env.AIPM_DATA_DIR = dataDir;
    process.env.AIPM_METADATA_BACKEND = "file";
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgresql://<user>:<password>@prod.example.com:5432/aipm";
    await expect(createApp()).rejects.toThrow(/Remote DATABASE_URL/);
  });
});
