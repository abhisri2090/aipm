import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "util";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ADMIN_ALLOWED_USERNAMES_ENV,
  ADMIN_PASSWORD_SHA256_ENV,
} from "./admin-auth.js";
import { createApp } from "./index.js";
import {
  countPackageVersions,
  createOrg,
  createPool,
  ensureSchema,
  reservePackageName,
  upsertGithubUser,
} from "./db.js";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;
const adminPassword = "registry-admin";
const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const publishToken = "test-publish-token";
const tempDirs: string[] = [];
let app: FastifyInstance | null = null;

function tokenHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function cookieHeader(setCookie: string | string[] | undefined, name: string): string {
  const values = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return values
    .map((entry) => entry.split(";")[0]?.trim())
    .filter((entry) => entry?.startsWith(`${name}=`))
    .join("; ");
}

async function createTarball(version: string, name: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "aipm-admin-package-test-"));
  tempDirs.push(dir);
  await writeFile(join(dir, "SKILL.md"), "Skill body\n");
  await writeFile(
    join(dir, "aipm.manifest.json"),
    JSON.stringify({
      schemaVersion: "0.1",
      name,
      version,
      type: "skill",
      description: "Admin package test",
      entry: "SKILL.md",
      targets: ["cursor"],
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

async function publishPackage(name: string, version: string): Promise<void> {
  const tarball = await createTarball(version, name);
  const payload = multipartPayload(tarball);
  const response = await app!.inject({
    method: "POST",
    url: `/v1/packages/${encodeURIComponent(name)}/versions`,
    headers: {
      "content-type": payload.contentType,
      authorization: `Bearer ${publishToken}`,
    },
    payload: payload.body,
  });
  expect(response.statusCode).toBe(201);
}

describe.skipIf(!databaseUrl)("admin package management", () => {
  beforeEach(async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "aipm-admin-package-data-"));
    tempDirs.push(dataDir);
    process.env.AIPM_DATA_DIR = dataDir;
    process.env.AIPM_METADATA_BACKEND = "postgres";
    process.env.DATABASE_URL = databaseUrl;
    process.env.AIPM_DEV_AUTH = "1";
    process.env.AIPM_REQUIRE_PUBLISH_TOKEN = "true";
    process.env.AIPM_PUBLISH_TOKEN_SHA256 = tokenHash(publishToken);
    process.env[ADMIN_PASSWORD_SHA256_ENV] = tokenHash(adminPassword);
    process.env[ADMIN_ALLOWED_USERNAMES_ENV] = "dev-local";
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    app = await createApp();
  });

  afterEach(async () => {
    await app?.close();
    app = null;
    delete process.env.AIPM_DATA_DIR;
    delete process.env.AIPM_METADATA_BACKEND;
    delete process.env.AIPM_DEV_AUTH;
    delete process.env.AIPM_REQUIRE_PUBLISH_TOKEN;
    delete process.env.AIPM_PUBLISH_TOKEN_SHA256;
    delete process.env[ADMIN_PASSWORD_SHA256_ENV];
    delete process.env[ADMIN_ALLOWED_USERNAMES_ENV];
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("lists and deletes packages through admin routes", async () => {
    const suffix = unique();
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const owner = await upsertGithubUser(pool, {
      githubId: `admin-owner-${suffix}`,
      githubLogin: `admin-owner-${suffix}`,
    });
    const org = await createOrg(pool, {
      slug: `admin-org-${suffix}`,
      name: "Admin Org",
      ownerUserId: owner.id,
    });
    const packageName = `@${org.slug}/delete-me`;
    await reservePackageName(pool, {
      name: packageName,
      orgId: org.id,
      ownerUserId: owner.id,
    });
    await pool.end();

    await publishPackage(packageName, "1.0.0");

    const login = await app!.inject({ method: "GET", url: "/v1/auth/dev/login" });
    const sessionCookie = cookieHeader(login.headers["set-cookie"], "aipm_session");
    const adminLogin = await app!.inject({
      method: "POST",
      url: "/v1/admin/login",
      headers: { cookie: sessionCookie },
      payload: { password: adminPassword },
    });
    expect(adminLogin.statusCode).toBe(200);
    const adminCookie = cookieHeader(adminLogin.headers["set-cookie"], "aipm_admin_session");
    const authCookies = [sessionCookie, adminCookie].filter(Boolean).join("; ");

    const list = await app!.inject({
      method: "GET",
      url: `/v1/admin/packages?q=${encodeURIComponent(org.slug)}`,
      headers: { cookie: authCookies },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().packages.some((pkg: { name: string }) => pkg.name === packageName)).toBe(true);

    const deleted = await app!.inject({
      method: "DELETE",
      url: `/v1/admin/packages/${encodeURIComponent(packageName)}`,
      headers: { cookie: authCookies },
    });
    expect(deleted.statusCode).toBe(204);

    const poolAfter = createPool(databaseUrl!);
    expect(await countPackageVersions(poolAfter, packageName)).toBe(0);
    await poolAfter.end();
  });

  it("shows private packages only when includePrivate=true and the user has access", async () => {
    const suffix = unique();
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const owner = await upsertGithubUser(pool, {
      githubId: "dev-local",
      githubLogin: "dev-local",
    });
    const org = await createOrg(pool, {
      slug: `private-dev-${suffix}`,
      name: "Private Dev Org",
      ownerUserId: owner.id,
    });
    const packageName = `@${org.slug}/hidden-skill`;
    await reservePackageName(pool, {
      name: packageName,
      orgId: org.id,
      ownerUserId: owner.id,
      visibility: "private",
    });
    await pool.end();

    await publishPackage(packageName, "1.0.0");

    const login = await app!.inject({ method: "GET", url: "/v1/auth/dev/login" });
    const sessionCookie = cookieHeader(login.headers["set-cookie"], "aipm_session");

    const publicList = await app!.inject({
      method: "GET",
      url: `/v1/packages?q=${encodeURIComponent(org.slug)}`,
      headers: { cookie: sessionCookie },
    });
    expect(publicList.statusCode).toBe(200);
    expect(publicList.json().packages.some((pkg: { name: string }) => pkg.name === packageName)).toBe(false);

    const privateList = await app!.inject({
      method: "GET",
      url: `/v1/packages?q=${encodeURIComponent(org.slug)}&includePrivate=true`,
      headers: { cookie: sessionCookie },
    });
    expect(privateList.statusCode).toBe(200);
    expect(privateList.json().packages.some((pkg: { name: string }) => pkg.name === packageName)).toBe(true);
  });
});
