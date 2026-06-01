import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { isValidScopeName } from "@aipm/schemas";
import { resolvePublishAuthConfig, verifyPublishAuth } from "./auth.js";
import { createMetadataStore } from "./create-metadata-store.js";
import { DuplicateVersionError } from "./metadata-store.js";
import { blobKeyForPackage, createStorage } from "./storage.js";
import { extractManifestFromTarball } from "./publish.js";

const PORT = Number(process.env.PORT ?? 8080);
const APP_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_PACKAGE_BYTES = 50 * 1024 * 1024;
const MAX_LIST_LIMIT = 100;
const DEFAULT_LIST_LIMIT = 50;

function decodePackageName(encoded: string): string {
  return decodeURIComponent(encoded);
}

function normalizeListLimit(value: unknown): number {
  const parsed = Number(value ?? DEFAULT_LIST_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIST_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIST_LIMIT);
}

function publicError(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === "production") return fallback;
  return error instanceof Error ? error.message : fallback;
}

export async function createApp(): Promise<FastifyInstance> {
  const dataDir = process.env.AIPM_DATA_DIR ?? join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  const storage = await createStorage(dataDir);
  const metadata = await createMetadataStore(dataDir);
  const publishAuth = resolvePublishAuthConfig();

  const app = Fastify({
    logger: true,
    bodyLimit: MAX_PACKAGE_BYTES,
    genReqId: (request) =>
      request.headers["x-request-id"]?.toString() ??
      randomUUID(),
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });
  await app.register(multipart, { limits: { fileSize: MAX_PACKAGE_BYTES } });

  app.get("/health", async () => ({
    status: "ok",
  }));

  app.get("/ready", async (_request, reply) => {
    try {
      await metadata.health();
      await storage.health();
      return {
        status: "ok",
        metadata: metadata.backend,
        storage: storage.backend,
      };
    } catch (error) {
      return reply.status(503).send({
        status: "error",
        error: publicError(error, "Registry dependencies are not ready"),
      });
    }
  });

  app.post<{ Params: { name: string } }>(
    "/v1/packages/:name/versions",
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const auth = verifyPublishAuth(request, publishAuth);
      if (!auth.ok) return reply.status(auth.status).send({ error: auth.error });

      const name = decodePackageName(request.params.name);
      if (!isValidScopeName(name)) {
        return reply.status(400).send({ error: "Invalid package name; use @scope/name" });
      }

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "Missing tarball (field: tarball)" });
      }

      const tarball = await data.toBuffer();
      let manifest;
      let integrity: string;
      try {
        ({ manifest, integrity } = await extractManifestFromTarball(tarball));
      } catch (e) {
        return reply.status(400).send({ error: (e as Error).message });
      }

      if (manifest.name !== name) {
        return reply
          .status(400)
          .send({ error: `Manifest name ${manifest.name} does not match URL ${name}` });
      }

      const blobPath = blobKeyForPackage(name, manifest.version);
      const tempBlobPath = `${blobPath}.tmp-${randomUUID()}`;
      let tempWritten = false;
      try {
        await storage.put(tempBlobPath, tarball);
        tempWritten = true;
        await metadata.insert({
          name,
          version: manifest.version,
          manifest,
          integrity,
          blob_path: blobPath,
          size_bytes: tarball.length,
        });
        await storage.copy(tempBlobPath, blobPath);
      } catch (e) {
        if (e instanceof DuplicateVersionError) {
          return reply.status(409).send({ error: e.message });
        }
        request.log.error(e);
        return reply.status(500).send({
          error: publicError(e, "Failed to publish package"),
        });
      } finally {
        if (tempWritten) await storage.delete(tempBlobPath).catch(() => undefined);
      }

      return reply.status(201).send({ name, version: manifest.version, integrity });
    },
  );

  app.get<{ Params: { name: string; version: string } }>(
    "/v1/packages/:name/versions/:version",
    async (request, reply) => {
      const name = decodePackageName(request.params.name);
      const row = await metadata.get(name, request.params.version);
      if (!row) return reply.status(404).send({ error: "Not found" });
      return {
        name: row.name,
        version: row.version,
        manifest: row.manifest,
        integrity: row.integrity,
        sizeBytes: Number(row.size_bytes),
        createdAt: row.created_at,
      };
    },
  );

  app.get<{ Querystring: { q?: string; limit?: string; cursor?: string } }>(
    "/v1/packages",
    {
      config: {
        rateLimit: {
          max: 240,
          timeWindow: "1 minute",
        },
      },
    },
    async (request) => {
      const limit = normalizeListLimit(request.query.limit);
      const rows = await metadata.list(request.query.q, {
        limit: limit + 1,
        cursor: request.query.cursor,
      });
      const page = rows.slice(0, limit);
      const nextCursor =
        rows.length > limit ? page[page.length - 1]?.created_at.toISOString() : null;
      return {
        packages: page.map((row) => ({
          name: row.name,
          version: row.version,
          description: row.manifest.description,
          type: row.manifest.type,
          targets: row.manifest.targets,
          license: row.manifest.license ?? null,
          integrity: row.integrity,
          sizeBytes: Number(row.size_bytes),
          createdAt: row.created_at,
        })),
        nextCursor,
      };
    },
  );

  app.get<{ Params: { name: string; version: string } }>(
    "/v1/packages/:name/versions/:version/tarball",
    async (request, reply) => {
      const name = decodePackageName(request.params.name);
      const row = await metadata.get(name, request.params.version);
      if (!row) return reply.status(404).send({ error: "Not found" });
      const buf = await storage.get(row.blob_path);
      return reply
        .header("content-type", "application/gzip")
        .header(
          "content-disposition",
          `attachment; filename="${name.replace("@", "").replace("/", "-")}-${row.version}.tgz"`,
        )
        .send(buf);
    },
  );

  await app.register(fastifyStatic, {
    root: join(APP_ROOT, "public"),
    prefix: "/",
  });

  return app;
}

async function main(): Promise<void> {
  const app = await createApp();
  await app.listen({ port: PORT, host: process.env.HOST ?? "0.0.0.0" });
  console.log(`Registry API listening on http://localhost:${PORT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
