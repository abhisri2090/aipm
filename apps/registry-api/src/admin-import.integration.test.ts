import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "util";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./index.js";
import { createPool, ensureSchema, getLatestContentHash } from "./db.js";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;
const adminToken = "admin-import-secret";
const tempDirs: string[] = [];
let app: FastifyInstance | null = null;
let pool: ReturnType<typeof createPool> | null = null;

function tokenHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function createTarball(
  version: string,
  name = "@mattpocock/grill-me",
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "aipm-import-test-"));
  tempDirs.push(dir);
  await writeFile(join(dir, "SKILL.md"), "---\ndescription: Grill me\n---\n# Grill me\n");
  await writeFile(
    join(dir, "aipm.manifest.json"),
    JSON.stringify({
      schemaVersion: "0.1",
      name,
      version,
      type: "skill",
      description: "Grill me",
      entry: "SKILL.md",
      targets: ["*"],
    }),
  );
  const { stdout } = await execFileAsync("tar", ["-czf", "-", "-C", dir, "."], {
    encoding: "buffer",
  });
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

function multipartImportPayload(
  tarball: Buffer,
  author: Record<string, unknown>,
  provenance: Record<string, unknown>,
): { body: Buffer; contentType: string } {
  const boundary = `aipm-import-${Date.now()}`;
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="author"\r\n\r\n${JSON.stringify(author)}\r\n`,
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="provenance"\r\n\r\n${JSON.stringify(provenance)}\r\n`,
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="tarball"; filename="package.tgz"\r\nContent-Type: application/gzip\r\n\r\n`,
      ),
      tarball,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  };
}

describe.skipIf(!databaseUrl)("admin import API", () => {
  beforeEach(async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "aipm-import-api-data-"));
    tempDirs.push(dataDir);
    process.env.AIPM_DATA_DIR = dataDir;
    process.env.AIPM_METADATA_BACKEND = "postgres";
    process.env.DATABASE_URL = databaseUrl;
    process.env.AIPM_ADMIN_TOKEN_SHA256 = tokenHash(adminToken);
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    app = await createApp();
  });

  afterEach(async () => {
    await app?.close();
    app = null;
    await pool?.end();
    pool = null;
    delete process.env.AIPM_DATA_DIR;
    delete process.env.AIPM_METADATA_BACKEND;
    delete process.env.AIPM_ADMIN_TOKEN_SHA256;
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("rejects unauthenticated admin import", async () => {
    const tarball = await createTarball("1.0.0");
    const payload = multipartImportPayload(
      tarball,
      { githubId: "1", githubLogin: "mattpocock" },
      { sourceUrl: "https://example.com", commitSha: "abc", contentHash: "hash1" },
    );
    const response = await app!.inject({
      method: "POST",
      url: "/v1/admin/import",
      headers: { "content-type": payload.contentType },
      payload: payload.body,
    });
    expect(response.statusCode).toBe(401);
  });

  it("creates unverified user, reservation, version, provenance, and notification", async () => {
    const tarball = await createTarball("1.0.0");
    const payload = multipartImportPayload(
      tarball,
      {
        githubId: "999001",
        githubLogin: "mattpocock",
        name: "Matt Pocock",
        email: "matt@example.com",
        xHandle: "mattpocock",
        githubUrl: "https://github.com/mattpocock",
      },
      {
        sourceUrl: "https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me",
        commitSha: "abc123",
        license: "Apache-2.0",
        contentHash: "hash-v1",
      },
    );
    const response = await app!.inject({
      method: "POST",
      url: "/v1/admin/import",
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${adminToken}`,
      },
      payload: payload.body,
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      name: "@mattpocock/grill-me",
      version: "1.0.0",
    });

    const list = await app!.inject({ method: "GET", url: "/v1/packages?q=grill-me" });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toMatchObject({
      packages: [
        {
          name: "@mattpocock/grill-me",
          import: { imported: true },
          publisher: { user: { verified: false } },
        },
      ],
    });

    expect(await getLatestContentHash(pool!, "@mattpocock/grill-me")).toBe("hash-v1");

    const duplicate = await app!.inject({
      method: "POST",
      url: "/v1/admin/import",
      headers: {
        "content-type": payload.contentType,
        authorization: `Bearer ${adminToken}`,
      },
      payload: payload.body,
    });
    expect(duplicate.statusCode).toBe(409);
  });
});
