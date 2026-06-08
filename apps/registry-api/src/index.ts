import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { isValidScopeName, parseScopeName } from "@aipm-registry/schemas";
import { resolvePublishAuthConfig, resolveAdminImportAuthConfig, verifyPublishAuth, verifyAdminImportAuth } from "./auth.js";
import {
  DuplicateVersionError,
  importSkillPackage,
  type ImportAuthorPayload,
  type ImportProvenancePayload,
} from "./admin-import.js";
import { importSkillFromGitHubUrl } from "./import-from-github.js";
import {
  createOrg,
  createPool,
  deletePackageProvenance,
  deletePackageReservation,
  getInternalStats,
  getLatestProvenance,
  getOwnedOrg,
  getOwnedPackageReservation,
  getProvenance,
  getProvenanceByPackageNames,
  getPublicPackagePublisher,
  listOrgPackageReservations,
  listPublicPackagePublishers,
  listUserImportedPackages,
  listUserOrgs,
  listPackageVersionsForName,
  reservePackageName,
  updateUserProfile,
  type PublicPackagePublisherRow,
} from "./db.js";
import {
  createScopedPublishToken,
  finishGithubLogin,
  getCurrentUser,
  isDevAuthEnabled,
  isGithubAuthConfigured,
  logout,
  requireCurrentUser,
  resolveUserAuthConfig,
  startDevLogin,
  startGithubLogin,
  verifyScopedPublishToken,
  type AccountAuth,
} from "./user-auth.js";
import {
  clearAdminLoginAttempts,
  finishAdminSession,
  getCurrentAdminUser,
  isAdminAuthConfigured,
  isAllowedAdminUsername,
  registerAdminLoginAttempt,
  requireCurrentAdminUser,
  resolveAdminAuthConfig,
  startAdminSession,
  verifyAdminPassword,
} from "./admin-auth.js";
import { createMetadataStore } from "./create-metadata-store.js";
import { blobKeyForPackage, createStorage } from "./storage.js";
import { extractManifestFromTarball } from "./publish.js";
import { ensureSchema } from "./db.js";
import { assertSafeLocalRuntime } from "./local-safety.js";

const PORT = Number(process.env.PORT ?? 8080);
const APP_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_PACKAGE_BYTES = 50 * 1024 * 1024;
const MAX_LIST_LIMIT = 100;
const DEFAULT_LIST_LIMIT = 50;
const HIDDEN_PUBLIC_PACKAGE_NAMES = new Set(["@team/sample-skill"]);

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

function isHiddenPublicPackage(name: string): boolean {
  return HIDDEN_PUBLIC_PACKAGE_NAMES.has(name);
}

const ORG_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function normalizeOrgSlug(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePackageNameForOrg(org: string, value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("@") ? normalized : `@${org}/${normalized}`;
}

function serializePublisher(row: PublicPackagePublisherRow | null) {
  if (!row) return null;
  return {
    org: {
      slug: row.org_slug,
      name: row.org_name,
    },
    user: {
      githubLogin: row.publisher_login,
      name: row.publisher_name,
      avatarUrl: row.publisher_avatar_url,
      verified: row.publisher_verified,
    },
  };
}

function serializeImportMeta(
  provenance: Awaited<ReturnType<typeof getLatestProvenance>>,
  latestVersion: string | null,
) {
  if (!provenance) {
    return {
      imported: false,
      sourceUrl: null,
      latestContentHash: null,
      latestVersion,
    };
  }
  return {
    imported: true,
    sourceUrl: provenance.source_url,
    latestContentHash: provenance.content_hash,
    latestVersion: latestVersion ?? provenance.version,
  };
}

async function createAccountAuth(): Promise<AccountAuth | null> {
  if (!process.env.DATABASE_URL) return null;
  const pool = createPool(process.env.DATABASE_URL);
  try {
    await ensureSchema(pool);
    return { pool, config: resolveUserAuthConfig() };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn(
      "Account services disabled: Postgres is unavailable. Dashboard and admin require Docker Postgres (`pnpm local:setup`).",
    );
    await pool.end().catch(() => undefined);
    return null;
  }
}

export async function createApp(): Promise<FastifyInstance> {
  assertSafeLocalRuntime(process.env);
  const dataDir = process.env.AIPM_DATA_DIR ?? join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  const storage = await createStorage(dataDir);
  const metadata = await createMetadataStore(dataDir);
  const publishAuth = resolvePublishAuthConfig();
  const adminImportAuth = resolveAdminImportAuthConfig();
  const accountAuth = await createAccountAuth();
  const adminAuthConfig = resolveAdminAuthConfig();

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

  app.get("/v1/auth/github/start", async (_request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    try {
      startGithubLogin(accountAuth, reply);
    } catch (error) {
      return reply.status(500).send({ error: publicError(error, "GitHub login is not configured") });
    }
  });

  app.get("/v1/auth/config", async () => ({
    devAuth: isDevAuthEnabled(process.env),
    githubAuth: Boolean(accountAuth && isGithubAuthConfigured(accountAuth.config)),
  }));

  app.get("/v1/auth/dev/login", async (_request, reply) => {
    if (!isDevAuthEnabled(process.env)) {
      return reply.status(404).send({ error: "Dev auth is not enabled" });
    }
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    await startDevLogin(accountAuth, reply);
  });

  app.get<{ Querystring: { code?: string; state?: string } }>(
    "/v1/auth/github/callback",
    async (request, reply) => {
      if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
      return finishGithubLogin(accountAuth, request, reply);
    },
  );

  app.post("/v1/auth/logout", async (request, reply) => logout(accountAuth, request, reply));

  app.get("/v1/admin/session", async (request, reply) => {
    if (!accountAuth || !isAdminAuthConfigured(adminAuthConfig)) {
      return reply.status(503).send({ error: "Admin access is not configured" });
    }
    const user = await getCurrentAdminUser(accountAuth, request);
    if (!user || !isAllowedAdminUsername(user.username, adminAuthConfig.allowedUsernames)) {
      return reply.status(401).send({ error: "Admin session required" });
    }
    return {
      username: user.username,
      githubLogin: user.github_login,
      name: user.name,
      avatarUrl: user.avatar_url,
    };
  });

  app.post<{ Body: { password?: string } }>("/v1/admin/login", async (request, reply) => {
    if (!accountAuth || !isAdminAuthConfigured(adminAuthConfig)) {
      return reply.status(503).send({ error: "Admin access is not configured" });
    }
    const attempt = registerAdminLoginAttempt(request);
    if (!attempt.allowed) {
      return reply.status(429).send({
        error: "Too many admin login attempts",
        retryAfterSeconds: attempt.retryAfterSeconds,
      });
    }
    const user = await getCurrentUser(accountAuth, request);
    if (!user) return reply.status(401).send({ error: "GitHub login required" });
    const password = request.body?.password?.trim();
    if (!password || !verifyAdminPassword(password, adminAuthConfig.passwordSha256)) {
      return reply.status(403).send({ error: "Admin access denied" });
    }
    if (!isAllowedAdminUsername(user.username, adminAuthConfig.allowedUsernames)) {
      return reply.status(403).send({ error: "Admin access denied" });
    }
    clearAdminLoginAttempts(request);
    await startAdminSession(accountAuth, user, reply);
    return {
      username: user.username,
      githubLogin: user.github_login,
      name: user.name,
      avatarUrl: user.avatar_url,
    };
  });

  app.post("/v1/admin/logout", async (request, reply) => finishAdminSession(accountAuth, request, reply));

  app.get("/v1/admin/stats", async (request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    const user = await requireCurrentAdminUser(accountAuth, adminAuthConfig, request, reply);
    if (!user) return;
    return getInternalStats(accountAuth.pool);
  });

  app.post<{ Body: { sourceUrl?: string } }>(
    "/v1/admin/import-from-url",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      if (!accountAuth) {
        return reply.status(503).send({ error: "Account services are not configured" });
      }
      const adminUser = await requireCurrentAdminUser(accountAuth, adminAuthConfig, request, reply);
      if (!adminUser) return;

      const sourceUrl = request.body?.sourceUrl?.trim();
      if (!sourceUrl) {
        return reply.status(400).send({ error: "Missing sourceUrl" });
      }

      try {
        const result = await importSkillFromGitHubUrl({
          pool: accountAuth.pool,
          metadata,
          storage,
          sourceUrl,
        });
        if (result.action === "skipped") {
          return reply.status(200).send(result);
        }
        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof DuplicateVersionError) {
          return reply.status(409).send({ error: error.message });
        }
        request.log.error(error);
        return reply.status(400).send({ error: publicError(error, "Failed to import skill") });
      }
    },
  );

  app.get("/v1/me", async (request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    const user = await getCurrentUser(accountAuth, request);
    if (!user) return reply.status(401).send({ error: "Login required" });
    return {
      id: user.id,
      username: user.username,
      githubLogin: user.github_login,
      name: user.name,
      avatarUrl: user.avatar_url,
      verified: user.verified,
    };
  });

  app.get("/v1/me/imports", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const imports = await listUserImportedPackages(accountAuth.pool, user.id);
    return {
      imports: imports.map((row) => ({
        packageName: row.package_name,
        version: row.version,
        sourceUrl: row.source_url,
        sourceCommitSha: row.source_commit_sha,
        sourceLicense: row.source_license,
        contentHash: row.content_hash,
        importedAt: row.imported_at,
      })),
    };
  });

  app.patch<{ Body: { name?: string | null; avatarUrl?: string | null } }>("/v1/me", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const name = request.body?.name?.trim() || null;
    const avatarUrl = request.body?.avatarUrl?.trim() || null;
    if (name && name.length > 80) return reply.status(400).send({ error: "Name must be 80 characters or fewer" });
    if (avatarUrl) {
      try {
        const parsed = new URL(avatarUrl);
        if (parsed.protocol !== "https:") return reply.status(400).send({ error: "Avatar URL must use https" });
      } catch {
        return reply.status(400).send({ error: "Avatar URL must be a valid URL" });
      }
    }
    const updated = await updateUserProfile(accountAuth.pool, user.id, { name, avatarUrl });
    return {
      id: updated.id,
      githubLogin: updated.github_login,
      name: updated.name,
      avatarUrl: updated.avatar_url,
    };
  });

  app.get("/v1/orgs", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const orgs = await listUserOrgs(accountAuth.pool, user.id);
    return {
      orgs: orgs.map((org) => ({
        slug: org.slug,
        name: org.name,
        createdAt: org.created_at,
      })),
    };
  });

  app.post<{ Body: { slug?: string; name?: string } }>("/v1/orgs", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const slug = normalizeOrgSlug(request.body?.slug ?? "");
    const name = request.body?.name?.trim() || slug;
    if (!ORG_SLUG_REGEX.test(slug)) {
      return reply.status(400).send({ error: "Invalid org slug; use lowercase letters, numbers, and hyphens" });
    }
    try {
      const org = await createOrg(accountAuth.pool, { slug, name, ownerUserId: user.id });
      return reply.status(201).send({ slug: org.slug, name: org.name, createdAt: org.created_at });
    } catch (error) {
      const pgErr = error as { code?: string };
      if (pgErr.code === "23505") return reply.status(409).send({ error: "Org slug is already taken" });
      throw error;
    }
  });

  app.get<{ Params: { org: string } }>("/v1/orgs/:org", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOwnedOrg(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    return { slug: org.slug, name: org.name, createdAt: org.created_at };
  });

  app.get<{ Params: { org: string } }>("/v1/orgs/:org/packages", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOwnedOrg(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    const packages = await listOrgPackageReservations(accountAuth.pool, org.id);
    return {
      packages: packages.map((pkg) => ({
        name: pkg.name,
        createdAt: pkg.created_at,
      })),
    };
  });

  app.post<{ Params: { org: string }; Body: { name?: string } }>(
    "/v1/orgs/:org/packages",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const orgSlug = normalizeOrgSlug(request.params.org);
      const org = await getOwnedOrg(accountAuth.pool, orgSlug, user.id);
      if (!org) return reply.status(404).send({ error: "Org not found" });
      const name = normalizePackageNameForOrg(orgSlug, request.body?.name ?? "");
      if (!isValidScopeName(name)) {
        return reply.status(400).send({ error: "Invalid package name; use @org/name" });
      }
      const parsed = parseScopeName(name);
      if (parsed.scope !== orgSlug) {
        return reply.status(400).send({ error: `Package name must use @${orgSlug}/...` });
      }
      try {
        const pkg = await reservePackageName(accountAuth.pool, {
          name,
          orgId: org.id,
          ownerUserId: user.id,
        });
        return reply.status(201).send({ name: pkg.name, createdAt: pkg.created_at });
      } catch (error) {
        const pgErr = error as { code?: string };
        if (pgErr.code === "23505") return reply.status(409).send({ error: "Package name is already reserved" });
        throw error;
      }
    },
  );

  app.post<{ Params: { name: string } }>(
    "/v1/packages/:name/publish-tokens",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const name = decodePackageName(request.params.name);
      const reservation = await getOwnedPackageReservation(accountAuth.pool, name, user.id);
      if (!reservation) return reply.status(404).send({ error: "Reserved package not found" });
      const token = await createScopedPublishToken(accountAuth, { packageName: name, userId: user.id });
      return {
        token: token.token,
        expiresAt: token.expiresAt,
      };
    },
  );

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
      const name = decodePackageName(request.params.name);
      if (!isValidScopeName(name)) {
        return reply.status(400).send({ error: "Invalid package name; use @scope/name" });
      }

      const adminAuth = verifyPublishAuth(request, publishAuth);
      if (!adminAuth.ok) {
        const scopedAuth = await verifyScopedPublishToken(accountAuth, request, name);
        if (!scopedAuth) return reply.status(adminAuth.status).send({ error: adminAuth.error });
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

  app.post("/v1/admin/import", async (request, reply) => {
    if (!accountAuth) {
      return reply.status(503).send({ error: "Account services are not configured" });
    }
    const auth = verifyAdminImportAuth(request, adminImportAuth);
    if (!auth.ok) return reply.status(auth.status).send({ error: auth.error });

    const parts = request.parts();
    let tarball: Buffer | null = null;
    let author: ImportAuthorPayload | null = null;
    let provenance: ImportProvenancePayload | null = null;

    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "tarball") {
        tarball = await part.toBuffer();
      } else if (part.type === "field") {
        const value = String(part.value);
        if (part.fieldname === "author") author = JSON.parse(value) as ImportAuthorPayload;
        if (part.fieldname === "provenance") provenance = JSON.parse(value) as ImportProvenancePayload;
      }
    }

    if (!tarball) return reply.status(400).send({ error: "Missing tarball (field: tarball)" });
    if (!author?.githubId || !author.githubLogin) {
      return reply.status(400).send({ error: "Missing author payload" });
    }
    if (!provenance?.sourceUrl || !provenance.commitSha || !provenance.contentHash) {
      return reply.status(400).send({ error: "Missing provenance payload" });
    }

    try {
      const result = await importSkillPackage({
        pool: accountAuth.pool,
        metadata,
        storage,
        tarball,
        author,
        provenance,
      });
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof DuplicateVersionError) {
        return reply.status(409).send({ error: error.message });
      }
      request.log.error(error);
      return reply.status(400).send({ error: publicError(error, "Failed to import package") });
    }
  });

  app.get<{ Params: { name: string } }>("/v1/packages/:name/import-meta", async (request, reply) => {
    const name = decodePackageName(request.params.name);
    if (!accountAuth) {
      return reply.status(503).send({ error: "Account services are not configured" });
    }
    const provenance = await getLatestProvenance(accountAuth.pool, name);
    const versions = await listPackageVersionsForName(accountAuth.pool, name);
    return serializeImportMeta(provenance, versions[0]?.version ?? null);
  });

  app.delete<{ Params: { name: string } }>("/v1/packages/:name", async (request, reply) => {
    const name = decodePackageName(request.params.name);
    if (!isValidScopeName(name)) {
      return reply.status(400).send({ error: "Invalid package name; use @scope/name" });
    }

    const adminAuth = verifyAdminImportAuth(request, adminImportAuth);
    let allowed = adminAuth.ok;

    if (!allowed && accountAuth) {
      const user = await getCurrentUser(accountAuth, request);
      if (user) {
        const reservation = await getOwnedPackageReservation(accountAuth.pool, name, user.id);
        allowed = Boolean(reservation);
      }
    }

    if (!allowed) {
      if (!adminAuth.ok && adminImportAuth.tokenHash) {
        return reply.status(adminAuth.status).send({ error: adminAuth.error });
      }
      return reply.status(403).send({ error: "Not allowed to delete this package" });
    }

    const deletedVersions = await metadata.deletePackage(name);
    for (const version of deletedVersions) {
      await storage.delete(version.blob_path).catch(() => undefined);
    }
    if (accountAuth) {
      await deletePackageProvenance(accountAuth.pool, name);
      await deletePackageReservation(accountAuth.pool, name);
    }
    return reply.status(204).send();
  });

  app.get<{ Params: { name: string; version: string } }>(
    "/v1/packages/:name/versions/:version",
    async (request, reply) => {
      const name = decodePackageName(request.params.name);
      const row = await metadata.get(name, request.params.version);
      if (!row) return reply.status(404).send({ error: "Not found" });
      const publisher = accountAuth
        ? await getPublicPackagePublisher(accountAuth.pool, row.name)
        : null;
      const provenance =
        accountAuth && publisher
          ? await getProvenance(accountAuth.pool, row.name, row.version)
          : null;
      return {
        name: row.name,
        version: row.version,
        manifest: row.manifest,
        integrity: row.integrity,
        sizeBytes: Number(row.size_bytes),
        createdAt: row.created_at,
        publisher: serializePublisher(publisher),
        import: provenance
          ? {
              imported: true,
              sourceUrl: provenance.source_url,
              sourceCommitSha: provenance.source_commit_sha,
              sourceLicense: provenance.source_license,
              contentHash: provenance.content_hash,
            }
          : { imported: false, sourceUrl: null },
      };
    },
  );

  app.get<{ Querystring: { q?: string; limit?: string; cursor?: string; includeDemo?: string } }>(
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
      const includeDemo = request.query.includeDemo === "true";
      const rows = await metadata.list(request.query.q, {
        limit: includeDemo ? limit + 1 : MAX_LIST_LIMIT,
        cursor: request.query.cursor,
      });
      const visibleRows = includeDemo
        ? rows
        : rows.filter((row) => !isHiddenPublicPackage(row.name));
      const page = visibleRows.slice(0, limit);
      const nextCursor =
        visibleRows.length > limit ? page[page.length - 1]?.created_at.toISOString() : null;
      const publishers = accountAuth
        ? await listPublicPackagePublishers(accountAuth.pool, [...new Set(page.map((row) => row.name))])
        : [];
      const publisherByName = new Map(publishers.map((publisher) => [publisher.package_name, publisher]));
      const provenanceByName = accountAuth
        ? await getProvenanceByPackageNames(accountAuth.pool, [...publisherByName.keys()])
        : new Map();
      return {
        packages: page.map((row) => {
          const provenance = provenanceByName.get(row.name);
          return {
            name: row.name,
            version: row.version,
            description: row.manifest.description,
            type: row.manifest.type,
            targets: row.manifest.targets,
            license: row.manifest.license ?? null,
            integrity: row.integrity,
            sizeBytes: Number(row.size_bytes),
            createdAt: row.created_at,
            publisher: serializePublisher(publisherByName.get(row.name) ?? null),
            import: provenance
              ? { imported: true, sourceUrl: provenance.source_url }
              : { imported: false, sourceUrl: null },
          };
        }),
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
