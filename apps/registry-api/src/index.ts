import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { isValidScopeName } from "@aipm/schemas";
import { blobKeyForPackage, createFilesystemStorage } from "./storage.js";
import { createPool, ensureSchema, getPackageVersion, insertPackageVersion } from "./db.js";
import { extractManifestFromTarball } from "./publish.js";

const PORT = Number(process.env.PORT ?? 8080);
const DATA_DIR = process.env.AIPM_DATA_DIR ?? join(process.cwd(), "data");
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://aipm:aipm@localhost:5432/aipm";

function decodePackageName(encoded: string): string {
  return decodeURIComponent(encoded);
}

async function main(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const storage = createFilesystemStorage(join(DATA_DIR, "packages"));
  const pool = createPool(DATABASE_URL);

  try {
    await ensureSchema(pool);
  } catch (err) {
    console.warn("Database not available; some routes will fail:", (err as Error).message);
  }

  const app = Fastify({ logger: true });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

  app.get("/health", async () => ({ status: "ok" }));

  app.post<{ Params: { name: string } }>(
    "/v1/packages/:name/versions",
    async (request, reply) => {
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
      try {
        await insertPackageVersion(pool, {
          name,
          version: manifest.version,
          manifest,
          integrity,
          blob_path: blobPath,
          size_bytes: tarball.length,
        });
      } catch (e: unknown) {
        const pgErr = e as { code?: string };
        if (pgErr.code === "23505") {
          return reply.status(409).send({ error: "Version already published" });
        }
        throw e;
      }

      await storage.put(blobPath, tarball);
      return reply.status(201).send({ name, version: manifest.version, integrity });
    },
  );

  app.get<{ Params: { name: string; version: string } }>(
    "/v1/packages/:name/versions/:version",
    async (request, reply) => {
      const name = decodePackageName(request.params.name);
      const row = await getPackageVersion(pool, name, request.params.version);
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

  app.get<{ Params: { name: string; version: string } }>(
    "/v1/packages/:name/versions/:version/tarball",
    async (request, reply) => {
      const name = decodePackageName(request.params.name);
      const row = await getPackageVersion(pool, name, request.params.version);
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

  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Registry API listening on http://localhost:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
