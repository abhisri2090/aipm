import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./index.js";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];
let app: FastifyInstance | null = null;
const token = "test-publish-token";

function tokenHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function createTarball(version: string, name = "@team/api-skill"): Promise<Buffer> {
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
  app = await createApp();
});

afterEach(async () => {
  await app?.close();
  app = null;
  delete process.env.AIPM_DATA_DIR;
  delete process.env.AIPM_METADATA_BACKEND;
  delete process.env.AIPM_REQUIRE_PUBLISH_TOKEN;
  delete process.env.AIPM_PUBLISH_TOKEN_SHA256;
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
      packages: [{ name: "@team/api-skill", version: "1.0.1", publisher: null }],
    });

    const detail = await app!.inject({
      method: "GET",
      url: `/v1/packages/${encodeURIComponent("@team/api-skill")}/versions/1.0.1`,
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({ publisher: null });
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
});
