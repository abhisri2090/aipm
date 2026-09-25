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
  createOrg,
  createPool,
  ensureSchema,
  reservePackageName,
  upsertGithubUser,
} from "./db.js";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;
const publishToken = "test-publish-token";
const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const tempDirs: string[] = [];
let app: FastifyInstance | null = null;

function tokenHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function createTarball(version: string, name: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "aipm-publisher-count-"));
  tempDirs.push(dir);
  await writeFile(join(dir, "SKILL.md"), "---\nname: skill\ndescription: \"Publisher count test\"\n---\n\n# Skill\n");
  await writeFile(
    join(dir, "aipm.manifest.json"),
    JSON.stringify({
      schemaVersion: "0.1",
      name,
      version,
      type: "skill",
      description: "Publisher count test",
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

describe.skipIf(!databaseUrl)("GET /v1/publishers published-package counts", () => {
  beforeEach(async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "aipm-publisher-list-"));
    tempDirs.push(dataDir);
    process.env.AIPM_DATA_DIR = dataDir;
    process.env.AIPM_METADATA_BACKEND = "postgres";
    process.env.DATABASE_URL = databaseUrl;
    process.env.AIPM_DEV_AUTH = "1";
    process.env.AIPM_REQUIRE_PUBLISH_TOKEN = "true";
    process.env.AIPM_PUBLISH_TOKEN_SHA256 = tokenHash(publishToken);
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
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("excludes reservation-only publishers and counts only packages with versions", async () => {
    const suffix = unique();
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const owner = await upsertGithubUser(pool, {
      githubId: `pub-owner-${suffix}`,
      githubLogin: `pub-owner-${suffix}`,
    });
    const reservedOnly = await createOrg(pool, {
      slug: `reserved-only-${suffix}`,
      name: "Reserved Only",
      ownerUserId: owner.id,
    });
    await reservePackageName(pool, {
      name: `@${reservedOnly.slug}/placeholder`,
      orgId: reservedOnly.id,
      ownerUserId: owner.id,
    });

    const published = await createOrg(pool, {
      slug: `published-org-${suffix}`,
      name: "Published Org",
      ownerUserId: owner.id,
    });
    const packageName = `@${published.slug}/real-skill`;
    await reservePackageName(pool, {
      name: packageName,
      orgId: published.id,
      ownerUserId: owner.id,
    });
    await pool.end();

    const tarball = await createTarball("1.0.0", packageName);
    const payload = multipartPayload(tarball);
    const publish = await app!.inject({
      method: "POST",
      url: `/v1/skills/${encodeURIComponent(packageName)}/versions`,
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${publishToken}`,
      },
      payload: payload.body,
    });
    expect(publish.statusCode).toBe(201);

    const list = await app!.inject({
      method: "GET",
      url: `/v1/publishers?q=${encodeURIComponent(suffix)}&limit=50`,
    });
    expect(list.statusCode).toBe(200);
    const publishers = list.json().publishers as Array<{ slug: string; packageCount: number }>;
    expect(publishers.some((row) => row.slug === reservedOnly.slug)).toBe(false);
    expect(publishers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: published.slug, packageCount: 1 }),
      ]),
    );
  });
});
