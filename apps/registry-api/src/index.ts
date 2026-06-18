import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
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
  addOrgMember,
  confirmEmailVerification,
  consumeCliAuthorizationCode,
  createCliAccessToken,
  createCliAuthorizationCode,
  createCliRefreshToken,
  countPackageVersions,
  countPublishedVersionsForOrg,
  createEmailVerification,
  createInstallToken,
  createOrg,
  createOrgAuditEvent,
  createOrgInvite,
  createPool,
  deletePackageProvenance,
  deletePackageReservation,
  acceptOrgInvite,
  deprecatePackage,
  getActiveEmailVerification,
  getActiveCliAccessTokenByHash,
  getActiveCliRefreshTokenByHash,
  getActiveInstallTokenByHash,
  getDeprecatedPackageNames,
  getInstallTokenById,
  getInternalStats,
  getLatestProvenance,
  getOrgBySlug,
  getOrgBySlugForMember,
  getOrgIdForPackage,
  getOrgInviteById,
  getOrgMembership,
  getPackageReservationByName,
  getPackageReservationForUser,
  getPackageInstallCountMap,
  getPackageVisibilityMap,
  getPendingInviteByTokenHash,
  getProvenance,
  getProvenanceByPackageNames,
  getPublicPackagePublisher,
  getUserById,
  incrementEmailVerificationAttempts,
  incrementPackageInstallCount,
  listAccessiblePrivatePackageNames,
  listJoinableOrgsByDomain,
  listOrgAuditEvents,
  listOrgIdsForUser,
  listOrgInstallTokens,
  listOrgInvites,
  listOrgMembers,
  listOrgPackageReservations,
  listPackageMembers,
  listPublicPackagePublishers,
  listUserImportedPackages,
  listUserOrgs,
  listPackageVersionsForName,
  reservePackageName,
  removeOrgMember,
  removePackageMaintainer,
  resendOrgInvite,
  revokeInstallToken,
  revokeCliRefreshTokenByHash,
  revokeOrgInvite,
  setPackageMaintainer,
  softDeleteOrg,
  touchInstallToken,
  touchCliRefreshToken,
  transferOrgOwnership,
  undeprecatePackage,
  updateOrgSettings,
  updatePackageVisibility,
  updateUserProfile,
  updateOrgMemberRole,
  yankPackageVersion,
  type OrgRole,
  type PackageVisibility,
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
  SESSION_COOKIE,
  setAuthCookie,
  startDevLogin,
  startGithubLogin,
  verifyScopedPublishToken,
  sha256Hex,
  type AccountAuth,
} from "./user-auth.js";
import {
  createDbEmailAuthStore,
  emailDomain,
  EMAIL_REGEX,
  getVerifiedUserEmail,
  newVerificationCode,
  requestAuthCode,
  verifyAuthCode,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_INTERVAL_MS,
} from "./email-auth.js";
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
import { createEmailSender, resolveEmailConfig, type InviteEmailResult } from "./email.js";
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

type ParsedQueryValue<T> = { ok: true; value: T } | { ok: false; error: string };

function decodePackageName(encoded: string): string {
  return decodeURIComponent(encoded);
}

function parseListLimit(value: unknown): ParsedQueryValue<number> {
  if (value === undefined) return { ok: true, value: DEFAULT_LIST_LIMIT };
  const raw = String(value).trim();
  if (!/^\d+$/.test(raw)) {
    return { ok: false, error: "Invalid limit; use an integer from 1 to 100" };
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_LIST_LIMIT) {
    return { ok: false, error: "Invalid limit; use an integer from 1 to 100" };
  }
  return { ok: true, value: parsed };
}

function parseListCursor(value: unknown): ParsedQueryValue<string | undefined> {
  if (value === undefined) return { ok: true, value: undefined };
  const raw = String(value).trim();
  if (!raw) return { ok: false, error: "Invalid cursor; use an ISO timestamp returned as nextCursor" };
  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, error: "Invalid cursor; use an ISO timestamp returned as nextCursor" };
  }
  return { ok: true, value: new Date(timestamp).toISOString() };
}

function publicError(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === "production") return fallback;
  return error instanceof Error ? error.message : fallback;
}

function isHiddenPublicPackage(name: string): boolean {
  return HIDDEN_PUBLIC_PACKAGE_NAMES.has(name);
}

const ORG_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const INVITE_ROLES = new Set<Exclude<OrgRole, "owner">>(["admin", "member", "viewer"]);
const PACKAGE_VISIBILITIES = new Set<PackageVisibility>(["public", "private"]);
const YANK_WINDOW_MS = 72 * 60 * 60 * 1000;
const CLI_AUTH_CODE_TTL_MS = 5 * 60 * 1000;
const CLI_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const CLI_REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const CLI_CODE_CHALLENGE_REGEX = /^[A-Za-z0-9_-]{43,128}$/;

function normalizeOrgSlug(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePackageNameForOrg(org: string, value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("@") ? normalized : `@${org}/${normalized}`;
}

function canManageOrg(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

function canManagePackages(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

function canGeneratePackageToken(access: { org_role: OrgRole | null; package_role: "maintainer" | null }): boolean {
  return access.org_role === "owner" || access.org_role === "admin" || Boolean(access.package_role);
}

function canCreateInstallToken(role: OrgRole): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

function parsePackageVisibility(value: unknown): PackageVisibility {
  const visibility = String(value ?? "public") as PackageVisibility;
  if (!PACKAGE_VISIBILITIES.has(visibility)) throw new Error("Invalid visibility");
  return visibility;
}

function newInstallToken(): string {
  return `aipm_read_${randomBytes(32).toString("base64url")}`;
}

function newCliCode(): string {
  return `aipm_cli_code_${randomBytes(32).toString("base64url")}`;
}

function newCliAccessToken(): string {
  return `aipm_cli_access_${randomBytes(32).toString("base64url")}`;
}

function newCliRefreshToken(): string {
  return `aipm_cli_refresh_${randomBytes(32).toString("base64url")}`;
}

function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

function validateCliRedirectUri(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isLoopback = hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1" || hostname === "[::1]";
    if (url.protocol !== "http:" || !isLoopback || !url.port) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function issueCliTokenPair(
  accountAuth: AccountAuth,
  input: { userId: string; refreshTokenId?: string; name?: string | null },
): Promise<{
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  refreshTokenId: string;
}> {
  let refreshTokenId = input.refreshTokenId;
  let refreshToken: string | undefined;
  let refreshTokenExpiresAt: Date | undefined;
  if (!refreshTokenId) {
    refreshToken = newCliRefreshToken();
    refreshTokenExpiresAt = new Date(Date.now() + CLI_REFRESH_TOKEN_TTL_MS);
    const refreshRow = await createCliRefreshToken(accountAuth.pool, {
      userId: input.userId,
      tokenHash: sha256Hex(refreshToken),
      name: input.name ?? "AIPM CLI",
      expiresAt: refreshTokenExpiresAt,
    });
    refreshTokenId = refreshRow.id;
  }
  const accessToken = newCliAccessToken();
  const accessTokenExpiresAt = new Date(Date.now() + CLI_ACCESS_TOKEN_TTL_MS);
  await createCliAccessToken(accountAuth.pool, {
    userId: input.userId,
    refreshTokenId,
    tokenHash: sha256Hex(accessToken),
    expiresAt: accessTokenExpiresAt,
  });
  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
    refreshTokenId,
  };
}

type ReadAccess = {
  userId: string | null;
  orgIds: string[];
  installTokenId: string | null;
};

async function resolveReadAccess(
  accountAuth: AccountAuth | null,
  request: FastifyRequest,
): Promise<ReadAccess> {
  if (!accountAuth) return { userId: null, orgIds: [], installTokenId: null };
  const user = await getCurrentUser(accountAuth, request);
  if (user) {
    const orgIds = await listOrgIdsForUser(accountAuth.pool, user.id);
    return { userId: user.id, orgIds, installTokenId: null };
  }
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer aipm_read_")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const row = await getActiveInstallTokenByHash(accountAuth.pool, sha256Hex(token));
    if (row) {
      void touchInstallToken(accountAuth.pool, row.id);
      const orgIds = await listOrgIdsForUser(accountAuth.pool, row.user_id);
      return { userId: row.user_id, orgIds, installTokenId: row.id };
    }
  }
  if (authHeader?.startsWith("Bearer aipm_cli_access_")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const row = await getActiveCliAccessTokenByHash(accountAuth.pool, sha256Hex(token));
    if (row) {
      const orgIds = await listOrgIdsForUser(accountAuth.pool, row.user_id);
      return { userId: row.user_id, orgIds, installTokenId: null };
    }
  }
  return { userId: null, orgIds: [], installTokenId: null };
}

async function canViewPackage(
  accountAuth: AccountAuth | null,
  name: string,
  access: ReadAccess,
): Promise<boolean> {
  if (!accountAuth) return true;
  const visibilityMap = await getPackageVisibilityMap(accountAuth.pool, [name]);
  const visibility = visibilityMap.get(name) ?? "public";
  if (visibility === "public") return true;
  if (!access.userId) return false;
  const orgId = await getOrgIdForPackage(accountAuth.pool, name);
  return orgId ? access.orgIds.includes(orgId) : false;
}

function validateHttpsUrl(value: string | null, field: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") throw new Error(`${field} must use https`);
    return value;
  } catch {
    throw new Error(`${field} must be a valid URL`);
  }
}

function normalizeGithubLogin(value?: string | null): string | null {
  return value?.trim().replace(/^@/, "").toLowerCase() || null;
}

function normalizeEmail(value?: string | null): string | null {
  return value?.trim().toLowerCase() || null;
}

function parseInviteRole(value: unknown): Exclude<OrgRole, "owner"> {
  const role = String(value ?? "viewer") as Exclude<OrgRole, "owner">;
  if (!INVITE_ROLES.has(role)) throw new Error("Invalid role");
  return role;
}

function parseMemberRole(value: unknown): Exclude<OrgRole, "owner"> {
  return parseInviteRole(value);
}

function newInviteToken(): string {
  return `aipm_inv_${randomBytes(32).toString("base64url")}`;
}

const DOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const AUTO_JOIN_BLOCKED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
]);
function parseAutoJoinDomain(value: string | null): string | null {
  if (!value) return null;
  const domain = value.trim().toLowerCase().replace(/^@/, "");
  if (!DOMAIN_REGEX.test(domain)) throw new Error("Enter a valid domain such as company.com");
  if (AUTO_JOIN_BLOCKED_DOMAINS.has(domain)) throw new Error("Public email domains cannot be used for auto-join");
  return domain;
}

function requestIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || request.ip;
  }
  return request.ip;
}

function inviteUrl(token: string): string {
  const siteUrl = (process.env.AIPM_PUBLIC_SITE_URL ?? "https://aipm-registry.com").replace(/\/$/, "");
  return `${siteUrl}/dashboard?invite=${encodeURIComponent(token)}`;
}

function serializeOrg(org: {
  slug: string;
  name: string;
  owner_user_id?: string;
  created_at: Date;
  role?: OrgRole;
  default_package_visibility?: PackageVisibility;
  description?: string | null;
  website_url?: string | null;
  avatar_url?: string | null;
  default_member_role?: Exclude<OrgRole, "owner">;
  invite_ttl_hours?: number;
  auto_join_domain?: string | null;
}) {
  return {
    slug: org.slug,
    name: org.name,
    ownerUserId: org.owner_user_id,
    role: org.role,
    createdAt: org.created_at,
    defaultPackageVisibility: org.default_package_visibility ?? "public",
    description: org.description ?? null,
    websiteUrl: org.website_url ?? null,
    avatarUrl: org.avatar_url ?? null,
    defaultMemberRole: org.default_member_role ?? "member",
    inviteTtlHours: org.invite_ttl_hours ?? 168,
    autoJoinDomain: org.auto_join_domain ?? null,
  };
}

function serializeOrgMember(member: {
  user_id: string;
  role: OrgRole;
  created_at: Date;
  updated_at: Date;
  github_login: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  contact_email?: string | null;
}) {
  return {
    userId: member.user_id,
    role: member.role,
    joinedAt: member.created_at,
    updatedAt: member.updated_at,
    githubLogin: member.github_login,
    username: member.username,
    name: member.name,
    avatarUrl: member.avatar_url,
    contactEmail: member.contact_email ?? null,
  };
}

function serializeInvite(invite: {
  id: string;
  invited_email: string | null;
  invited_github_login: string | null;
  role: OrgRole;
  status: string;
  expires_at: Date;
  invited_by_username: string;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: invite.id,
    email: invite.invited_email,
    githubLogin: invite.invited_github_login,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expires_at,
    invitedBy: invite.invited_by_username,
    createdAt: invite.created_at,
    updatedAt: invite.updated_at,
  };
}

function serializePackageMember(member: {
  user_id: string;
  role: "maintainer";
  created_at: Date;
  updated_at: Date;
  github_login: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
}) {
  return {
    userId: member.user_id,
    role: member.role,
    addedAt: member.created_at,
    updatedAt: member.updated_at,
    githubLogin: member.github_login,
    username: member.username,
    name: member.name,
    avatarUrl: member.avatar_url,
  };
}

function serializeAuditEvent(event: {
  id: string;
  event_type: string;
  actor_username: string | null;
  target_username: string | null;
  target_user_id: string | null;
  package_name: string | null;
  invite_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}) {
  return {
    id: event.id,
    type: event.event_type,
    actor: event.actor_username,
    target: event.target_username,
    targetUserId: event.target_user_id,
    packageName: event.package_name,
    inviteId: event.invite_id,
    metadata: event.metadata,
    createdAt: event.created_at,
  };
}

async function sendInviteEmailWithAudit(
  input: {
    emailSender: ReturnType<typeof createEmailSender>;
    accountAuth: AccountAuth;
    orgId: string;
    actorUserId: string;
    inviteId: string;
    to: string | null;
    orgName: string;
    orgSlug: string;
    role: string;
    inviteUrl: string;
    invitedBy: string;
    expiresAt: Date;
    log: { error(error: unknown): void };
  },
): Promise<InviteEmailResult> {
  if (!input.to || !input.emailSender.isEnabled) {
    return { sent: false, provider: "disabled" };
  }
  try {
    const result = await input.emailSender.sendInviteEmail({
      to: input.to,
      orgName: input.orgName,
      orgSlug: input.orgSlug,
      role: input.role,
      inviteUrl: input.inviteUrl,
      invitedBy: input.invitedBy,
      expiresAt: input.expiresAt,
    });
    await createOrgAuditEvent(input.accountAuth.pool, {
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      inviteId: input.inviteId,
      eventType: "invite.email_sent",
      metadata: { provider: result.provider },
    });
    return result;
  } catch (error) {
    input.log.error(error);
    await createOrgAuditEvent(input.accountAuth.pool, {
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      inviteId: input.inviteId,
      eventType: "invite.email_failed",
      metadata: { provider: "azure" },
    });
    return { sent: false, provider: "azure" };
  }
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
  const emailSender = createEmailSender(resolveEmailConfig());

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
    emailAuth: emailSender.isEnabled,
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

  app.post<{ Body: { email?: string } }>("/v1/auth/email/request-code", async (request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    const store = createDbEmailAuthStore(accountAuth.pool);
    const result = await requestAuthCode(
      store,
      emailSender,
      { email: request.body?.email, requestIp: requestIp(request) },
      { devAuth: isDevAuthEnabled(process.env) },
    );
    if (!result.ok) {
      if (result.retryAfter) reply.header("Retry-After", String(result.retryAfter));
      return reply.status(result.status).send({ error: result.error });
    }
    return reply.status(result.status).send(result.body);
  });

  app.post<{ Body: { email?: string; code?: string } }>("/v1/auth/email/verify-code", async (request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    const store = createDbEmailAuthStore(accountAuth.pool);
    const result = await verifyAuthCode(
      store,
      { email: request.body?.email, code: request.body?.code, requestIp: requestIp(request) },
      { newSessionId: () => randomBytes(32).toString("base64url") },
    );
    if (!result.ok) {
      if (result.retryAfter) reply.header("Retry-After", String(result.retryAfter));
      return reply.status(result.status).send({ error: result.error });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sessionId, sessionExpiresAt, ...body } = result.body;
    setAuthCookie(reply, accountAuth.config, SESSION_COOKIE, sessionId, 30 * 24 * 60 * 60);
    return reply.status(result.status).send(body);
  });

  app.post<{
    Body: {
      redirectUri?: string;
      state?: string;
      codeChallenge?: string;
      deviceName?: string;
    };
  }>("/v1/cli-auth/authorize", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const redirectUri = validateCliRedirectUri(request.body?.redirectUri);
    if (!redirectUri) return reply.status(400).send({ error: "Invalid CLI redirect URI" });
    const state = request.body?.state?.trim();
    if (!state || state.length > 256) return reply.status(400).send({ error: "Invalid CLI state" });
    const codeChallenge = request.body?.codeChallenge?.trim();
    if (!codeChallenge || !CLI_CODE_CHALLENGE_REGEX.test(codeChallenge)) {
      return reply.status(400).send({ error: "Invalid PKCE code challenge" });
    }

    const code = newCliCode();
    await createCliAuthorizationCode(accountAuth.pool, {
      userId: user.id,
      codeHash: sha256Hex(code),
      codeChallenge,
      redirectUri,
      expiresAt: new Date(Date.now() + CLI_AUTH_CODE_TTL_MS),
    });
    const callback = new URL(redirectUri);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", state);
    if (request.body?.deviceName?.trim()) callback.searchParams.set("device", request.body.deviceName.trim().slice(0, 80));
    return { redirectTo: callback.toString() };
  });

  app.post<{
    Body: {
      code?: string;
      codeVerifier?: string;
      redirectUri?: string;
      deviceName?: string;
    };
  }>("/v1/cli-auth/token", async (request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    const code = request.body?.code?.trim();
    const codeVerifier = request.body?.codeVerifier?.trim();
    const redirectUri = validateCliRedirectUri(request.body?.redirectUri);
    if (!code || !code.startsWith("aipm_cli_code_")) return reply.status(400).send({ error: "Invalid CLI authorization code" });
    if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128) {
      return reply.status(400).send({ error: "Invalid PKCE code verifier" });
    }
    if (!redirectUri) return reply.status(400).send({ error: "Invalid CLI redirect URI" });
    const row = await consumeCliAuthorizationCode(accountAuth.pool, sha256Hex(code));
    if (!row) return reply.status(400).send({ error: "CLI authorization code expired or already used" });
    if (row.redirect_uri !== redirectUri) return reply.status(400).send({ error: "CLI redirect URI mismatch" });
    if (row.code_challenge !== pkceChallenge(codeVerifier)) {
      return reply.status(400).send({ error: "Invalid PKCE code verifier" });
    }
    const issued = await issueCliTokenPair(accountAuth, {
      userId: row.user_id,
      name: request.body?.deviceName?.trim().slice(0, 80) || "AIPM CLI",
    });
    const user = await getUserById(accountAuth.pool, row.user_id);
    return {
      tokenType: "Bearer",
      accessToken: issued.accessToken,
      accessTokenExpiresAt: issued.accessTokenExpiresAt,
      refreshToken: issued.refreshToken,
      refreshTokenExpiresAt: issued.refreshTokenExpiresAt,
      userId: row.user_id,
      user: user
        ? {
            username: user.username,
            githubLogin: user.github_login,
            name: user.name,
            avatarUrl: user.avatar_url,
            email: user.primary_email ?? user.contact_email ?? null,
          }
        : null,
    };
  });

  app.post<{ Body: { refreshToken?: string } }>("/v1/cli-auth/refresh", async (request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    const refreshToken = request.body?.refreshToken?.trim() || bearerToken(request);
    if (!refreshToken || !refreshToken.startsWith("aipm_cli_refresh_")) {
      return reply.status(401).send({ error: "CLI refresh token required" });
    }
    const row = await getActiveCliRefreshTokenByHash(accountAuth.pool, sha256Hex(refreshToken));
    if (!row) return reply.status(401).send({ error: "CLI session expired or revoked" });
    await touchCliRefreshToken(accountAuth.pool, row.id);
    const issued = await issueCliTokenPair(accountAuth, {
      userId: row.user_id,
      refreshTokenId: row.id,
    });
    return {
      tokenType: "Bearer",
      accessToken: issued.accessToken,
      accessTokenExpiresAt: issued.accessTokenExpiresAt,
    };
  });

  app.get("/v1/cli-auth/me", async (request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    const token = bearerToken(request);
    if (!token || !token.startsWith("aipm_cli_access_")) return reply.status(401).send({ error: "CLI login required" });
    const access = await getActiveCliAccessTokenByHash(accountAuth.pool, sha256Hex(token));
    if (!access) return reply.status(401).send({ error: "CLI session expired" });
    const user = await getUserById(accountAuth.pool, access.user_id);
    const orgs = await listUserOrgs(accountAuth.pool, access.user_id);
    return {
      userId: access.user_id,
      user: user
        ? {
            userId: user.id,
            username: user.username,
            githubLogin: user.github_login,
            name: user.name,
            avatarUrl: user.avatar_url,
            email: user.primary_email ?? user.contact_email ?? null,
          }
        : null,
      orgs: orgs.map((org) => ({ slug: org.slug, name: org.name, role: org.role })),
    };
  });

  app.post<{ Body: { refreshToken?: string } }>("/v1/cli-auth/logout", async (request, reply) => {
    if (!accountAuth) return reply.status(503).send({ error: "Account services are not configured" });
    const refreshToken = request.body?.refreshToken?.trim() || bearerToken(request);
    if (refreshToken?.startsWith("aipm_cli_refresh_")) {
      await revokeCliRefreshTokenByHash(accountAuth.pool, sha256Hex(refreshToken));
    }
    return { ok: true };
  });

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
      authProvider: user.auth_provider,
      email: user.primary_email,
      emailVerifiedAt: user.primary_email_verified_at,
      contactEmail: user.contact_email,
      contactEmailVerifiedAt: user.contact_email_verified_at,
    };
  });

  app.post<{ Body: { email?: string } }>("/v1/me/email/verify-request", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    if (user.auth_provider === "email") {
      return reply.status(400).send({ error: "Your login email is already verified." });
    }
    const email = normalizeEmail(request.body?.email);
    if (!email || !EMAIL_REGEX.test(email)) return reply.status(400).send({ error: "Enter a valid email address" });
    const existing = await getActiveEmailVerification(accountAuth.pool, user.id);
    if (existing && Date.now() - existing.created_at.getTime() < VERIFICATION_RESEND_INTERVAL_MS) {
      return reply.status(429).send({ error: "Please wait a minute before requesting another code" });
    }
    const code = newVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
    await createEmailVerification(accountAuth.pool, {
      userId: user.id,
      email,
      codeHash: sha256Hex(code),
      expiresAt,
    });
    let emailResult: InviteEmailResult = { sent: false, provider: "disabled" };
    try {
      emailResult = await emailSender.sendVerificationEmail({ to: email, code, expiresAt });
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ error: "Could not send the verification email. Try again later." });
    }
    const devCode = !emailSender.isEnabled && isDevAuthEnabled(process.env) ? { devCode: code } : {};
    return reply.status(201).send({ email, expiresAt, emailSent: emailResult.sent, ...devCode });
  });

  app.post<{ Body: { code?: string } }>("/v1/me/email/verify", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const code = request.body?.code?.trim();
    if (!code) return reply.status(400).send({ error: "Enter the verification code" });
    const verification = await getActiveEmailVerification(accountAuth.pool, user.id);
    if (!verification) return reply.status(404).send({ error: "No pending verification. Request a new code." });
    if (verification.expires_at.getTime() <= Date.now()) {
      return reply.status(410).send({ error: "Code has expired. Request a new one." });
    }
    if (verification.attempts >= VERIFICATION_MAX_ATTEMPTS) {
      return reply.status(429).send({ error: "Too many attempts. Request a new code." });
    }
    if (sha256Hex(code) !== verification.code_hash) {
      const attempts = await incrementEmailVerificationAttempts(accountAuth.pool, verification.id);
      const left = Math.max(0, VERIFICATION_MAX_ATTEMPTS - attempts);
      return reply.status(400).send({ error: `Incorrect code. ${left} ${left === 1 ? "attempt" : "attempts"} left.` });
    }
    const updated = await confirmEmailVerification(accountAuth.pool, {
      verificationId: verification.id,
      userId: user.id,
      email: verification.email,
    });
    return {
      contactEmail: updated.contact_email,
      contactEmailVerifiedAt: updated.contact_email_verified_at,
    };
  });

  app.get("/v1/me/joinable-orgs", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const verifiedEmail = getVerifiedUserEmail(user);
    if (!verifiedEmail) return { orgs: [] };
    const orgs = await listJoinableOrgsByDomain(accountAuth.pool, user.id, emailDomain(verifiedEmail));
    return { orgs: orgs.map(serializeOrg) };
  });

  app.post<{ Params: { org: string } }>("/v1/orgs/:org/join", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlug(accountAuth.pool, normalizeOrgSlug(request.params.org));
    if (!org || !org.auto_join_domain) return reply.status(404).send({ error: "Org not found or auto-join is not enabled" });
    const verifiedEmail = getVerifiedUserEmail(user);
    if (!verifiedEmail) {
      return reply.status(403).send({ error: "Verify your email before joining" });
    }
    if (emailDomain(verifiedEmail) !== org.auto_join_domain) {
      return reply.status(403).send({ error: `Auto-join requires a verified @${org.auto_join_domain} email` });
    }
    const role = org.default_member_role ?? "member";
    const joined = await addOrgMember(accountAuth.pool, { orgId: org.id, userId: user.id, role });
    if (!joined) return reply.status(409).send({ error: "You are already a member of this org" });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      targetUserId: user.id,
      eventType: "member.auto_joined",
      metadata: { role, domain: org.auto_join_domain },
    });
    return reply.status(201).send({ ...serializeOrg(org), role });
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
      orgs: orgs.map(serializeOrg),
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
      return reply.status(201).send({ ...serializeOrg(org), role: "owner" });
    } catch (error) {
      const pgErr = error as { code?: string };
      if (pgErr.code === "23505") return reply.status(409).send({ error: "Org slug is already taken" });
      throw error;
    }
  });

  app.get<{ Params: { org: string } }>("/v1/orgs/:org", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    return serializeOrg(org);
  });

  app.patch<{
    Params: { org: string };
    Body: {
      name?: string;
      defaultPackageVisibility?: string;
      description?: string | null;
      websiteUrl?: string | null;
      avatarUrl?: string | null;
      defaultMemberRole?: string;
      inviteTtlHours?: number;
      autoJoinDomain?: string | null;
    };
  }>("/v1/orgs/:org", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (!canManageOrg(org.role)) return reply.status(403).send({ error: "Only org owners and admins can change settings" });

    const settings: Parameters<typeof updateOrgSettings>[2] = {};
    if (request.body?.name !== undefined) {
      const name = request.body.name.trim();
      if (!name) return reply.status(400).send({ error: "Name is required" });
      if (name.length > 80) return reply.status(400).send({ error: "Name must be 80 characters or fewer" });
      settings.name = name;
    }
    if (request.body?.defaultPackageVisibility !== undefined) {
      try {
        settings.defaultPackageVisibility = parsePackageVisibility(request.body.defaultPackageVisibility);
      } catch {
        return reply.status(400).send({ error: "Invalid default package visibility" });
      }
    }
    if (request.body?.description !== undefined) {
      const description = request.body.description?.trim() || null;
      if (description && description.length > 500) {
        return reply.status(400).send({ error: "Description must be 500 characters or fewer" });
      }
      settings.description = description;
    }
    if (request.body?.websiteUrl !== undefined) {
      try {
        settings.websiteUrl = validateHttpsUrl(request.body.websiteUrl?.trim() || null, "Website URL");
      } catch (error) {
        return reply.status(400).send({ error: error instanceof Error ? error.message : "Invalid website URL" });
      }
    }
    if (request.body?.avatarUrl !== undefined) {
      try {
        settings.avatarUrl = validateHttpsUrl(request.body.avatarUrl?.trim() || null, "Avatar URL");
      } catch (error) {
        return reply.status(400).send({ error: error instanceof Error ? error.message : "Invalid avatar URL" });
      }
    }
    if (request.body?.defaultMemberRole !== undefined) {
      try {
        settings.defaultMemberRole = parseInviteRole(request.body.defaultMemberRole);
      } catch {
        return reply.status(400).send({ error: "Invalid default member role" });
      }
    }
    if (request.body?.inviteTtlHours !== undefined) {
      const ttl = Number(request.body.inviteTtlHours);
      if (!Number.isInteger(ttl) || ttl < 1 || ttl > 720) {
        return reply.status(400).send({ error: "Invite TTL must be between 1 and 720 hours" });
      }
      settings.inviteTtlHours = ttl;
    }
    if (request.body?.autoJoinDomain !== undefined) {
      try {
        settings.autoJoinDomain = parseAutoJoinDomain(request.body.autoJoinDomain?.trim() || null);
      } catch (error) {
        return reply.status(400).send({ error: error instanceof Error ? error.message : "Invalid auto-join domain" });
      }
    }

    const updated = await updateOrgSettings(accountAuth.pool, org.id, settings);
    if (!updated) return reply.status(404).send({ error: "Org not found" });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      eventType: "org.settings_changed",
      metadata: settings as Record<string, unknown>,
    });
    return { ...serializeOrg(updated), role: org.role };
  });

  app.delete<{ Params: { org: string } }>("/v1/orgs/:org", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (org.role !== "owner") return reply.status(403).send({ error: "Only the owner can delete this org" });
    const publishedCount = await countPublishedVersionsForOrg(accountAuth.pool, org.id);
    if (publishedCount > 0) {
      return reply.status(409).send({
        error: "Cannot delete org while published packages exist. Remove all published versions first.",
      });
    }
    const deleted = await softDeleteOrg(accountAuth.pool, org.id);
    if (!deleted) return reply.status(404).send({ error: "Org not found" });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      eventType: "org.deleted",
    });
    return reply.status(204).send();
  });

  app.get<{ Params: { org: string } }>("/v1/orgs/:org/packages", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    const packages = await listOrgPackageReservations(accountAuth.pool, org.id);
    const versionCounts = await Promise.all(
      packages.map(async (pkg) => ({
        name: pkg.name,
        count: await countPackageVersions(accountAuth.pool, pkg.name),
      })),
    );
    const versionCountByName = new Map(versionCounts.map((row) => [row.name, row.count]));
    return {
      packages: packages.map((pkg) => ({
        name: pkg.name,
        createdAt: pkg.created_at,
        visibility: pkg.visibility,
        deprecatedAt: pkg.deprecated_at,
        deprecationMessage: pkg.deprecation_message,
        publishedVersionCount: versionCountByName.get(pkg.name) ?? 0,
        installCount: Number(pkg.install_count),
      })),
    };
  });

  app.delete<{ Params: { org: string; name: string } }>("/v1/orgs/:org/packages/:name", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const orgSlug = normalizeOrgSlug(request.params.org);
    const org = await getOrgBySlugForMember(accountAuth.pool, orgSlug, user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (!canManagePackages(org.role)) {
      return reply.status(403).send({ error: "Only org owners and admins can unreserve packages" });
    }
    const name = decodePackageName(request.params.name);
    const reservation = await getPackageReservationByName(accountAuth.pool, name);
    if (!reservation || reservation.org_id !== org.id) {
      return reply.status(404).send({ error: "Package not found in this org" });
    }
    const publishedCount = await countPackageVersions(accountAuth.pool, name);
    if (publishedCount > 0) {
      return reply.status(409).send({ error: "Cannot unreserve a package with published versions" });
    }
    await deletePackageReservation(accountAuth.pool, name);
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      packageName: name,
      eventType: "package.unreserved",
    });
    return reply.status(204).send();
  });

  app.post<{ Params: { org: string }; Body: { name?: string; visibility?: string } }>(
    "/v1/orgs/:org/packages",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const orgSlug = normalizeOrgSlug(request.params.org);
      const org = await getOrgBySlugForMember(accountAuth.pool, orgSlug, user.id);
      if (!org) return reply.status(404).send({ error: "Org not found" });
      if (!canManagePackages(org.role)) return reply.status(403).send({ error: "Only org owners and admins can reserve packages" });
      const name = normalizePackageNameForOrg(orgSlug, request.body?.name ?? "");
      if (!isValidScopeName(name)) {
        return reply.status(400).send({ error: "Invalid package name; use @org/name" });
      }
      const parsed = parseScopeName(name);
      if (parsed.scope !== orgSlug) {
        return reply.status(400).send({ error: `Package name must use @${orgSlug}/...` });
      }
      let visibility: PackageVisibility | undefined;
      if (request.body?.visibility !== undefined) {
        try {
          visibility = parsePackageVisibility(request.body.visibility);
        } catch {
          return reply.status(400).send({ error: "Invalid package visibility" });
        }
      }
      try {
        const pkg = await reservePackageName(accountAuth.pool, {
          name,
          orgId: org.id,
          ownerUserId: user.id,
          visibility,
        });
        return reply.status(201).send({
          name: pkg.name,
          createdAt: pkg.created_at,
          visibility: pkg.visibility,
        });
      } catch (error) {
        const pgErr = error as { code?: string };
        if (pgErr.code === "23505") return reply.status(409).send({ error: "Package name is already reserved" });
        throw error;
      }
    },
  );

  app.get<{ Params: { org: string } }>("/v1/orgs/:org/members", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    const members = await listOrgMembers(accountAuth.pool, org.id);
    return { members: members.map(serializeOrgMember) };
  });

  app.patch<{ Params: { org: string; userId: string }; Body: { role?: string } }>(
    "/v1/orgs/:org/members/:userId",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
      if (!org) return reply.status(404).send({ error: "Org not found" });
      if (!canManageOrg(org.role)) return reply.status(403).send({ error: "Only org owners and admins can change roles" });
      let role: Exclude<OrgRole, "owner">;
      try {
        role = parseMemberRole(request.body?.role);
      } catch {
        return reply.status(400).send({ error: "Invalid role" });
      }
      if (request.params.userId === user.id && org.role === "admin") {
        return reply.status(403).send({ error: "Admins cannot change their own role" });
      }
      const target = await getOrgMembership(accountAuth.pool, org.id, request.params.userId);
      if (!target) return reply.status(404).send({ error: "Member not found" });
      if (target.role === "owner") return reply.status(403).send({ error: "Owner role cannot be changed here" });
      const updated = await updateOrgMemberRole(accountAuth.pool, {
        orgId: org.id,
        userId: request.params.userId,
        role,
      });
      if (!updated) return reply.status(404).send({ error: "Member not found" });
      await createOrgAuditEvent(accountAuth.pool, {
        orgId: org.id,
        actorUserId: user.id,
        targetUserId: request.params.userId,
        eventType: "member.role_changed",
        metadata: { role },
      });
      return serializeOrgMember(updated);
    },
  );

  app.delete<{ Params: { org: string; userId: string } }>("/v1/orgs/:org/members/:userId", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (!canManageOrg(org.role)) return reply.status(403).send({ error: "Only org owners and admins can remove members" });
    const target = await getOrgMembership(accountAuth.pool, org.id, request.params.userId);
    if (!target) return reply.status(404).send({ error: "Member not found" });
    if (target.role === "owner") return reply.status(403).send({ error: "Owner cannot be removed" });
    const removed = await removeOrgMember(accountAuth.pool, org.id, request.params.userId);
    if (!removed) return reply.status(404).send({ error: "Member not found" });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      targetUserId: request.params.userId,
      eventType: "member.removed",
    });
    return reply.status(204).send();
  });

  app.post<{ Params: { org: string }; Body: { userId?: string } }>("/v1/orgs/:org/transfer-ownership", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (org.role !== "owner") return reply.status(403).send({ error: "Only the owner can transfer ownership" });
    const targetUserId = request.body?.userId?.trim();
    if (!targetUserId) return reply.status(400).send({ error: "Missing target user id" });
    const target = await getOrgMembership(accountAuth.pool, org.id, targetUserId);
    if (!target) return reply.status(404).send({ error: "Target user must already be an org member" });
    await transferOrgOwnership(accountAuth.pool, { orgId: org.id, fromUserId: user.id, toUserId: targetUserId });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      targetUserId,
      eventType: "org.ownership_transferred",
    });
    return { ok: true };
  });

  app.post<{ Params: { org: string } }>("/v1/orgs/:org/leave", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (org.role === "owner") return reply.status(403).send({ error: "Transfer ownership before leaving this org" });
    await removeOrgMember(accountAuth.pool, org.id, user.id);
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      targetUserId: user.id,
      eventType: "member.left",
    });
    return { ok: true };
  });

  app.get<{ Params: { org: string } }>("/v1/orgs/:org/invites", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (!canManageOrg(org.role)) return reply.status(403).send({ error: "Only org owners and admins can view invites" });
    const invites = await listOrgInvites(accountAuth.pool, org.id);
    return { invites: invites.map(serializeInvite) };
  });

  app.post<{ Params: { org: string }; Body: { email?: string | null; githubLogin?: string | null; role?: string } }>(
    "/v1/orgs/:org/invites",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
      if (!org) return reply.status(404).send({ error: "Org not found" });
      if (!canManageOrg(org.role)) return reply.status(403).send({ error: "Only org owners and admins can invite teammates" });
      const email = normalizeEmail(request.body?.email);
      const githubLogin = normalizeGithubLogin(request.body?.githubLogin);
      if (!email && !githubLogin) return reply.status(400).send({ error: "Invite needs an email or GitHub username" });
      let role: Exclude<OrgRole, "owner">;
      try {
        role = parseInviteRole(request.body?.role);
      } catch {
        return reply.status(400).send({ error: "Invalid role" });
      }
      const token = newInviteToken();
      const invite = await createOrgInvite(accountAuth.pool, {
        orgId: org.id,
        invitedEmail: email,
        invitedGithubLogin: githubLogin,
        role,
        tokenHash: sha256Hex(token),
        expiresAt: new Date(Date.now() + org.invite_ttl_hours * 60 * 60 * 1000),
        invitedByUserId: user.id,
      });
      await createOrgAuditEvent(accountAuth.pool, {
        orgId: org.id,
        actorUserId: user.id,
        inviteId: invite.id,
        eventType: "invite.sent",
        metadata: { email: Boolean(email), githubLogin, role },
      });
      const url = inviteUrl(token);
      const emailResult = await sendInviteEmailWithAudit({
        emailSender,
        accountAuth,
        orgId: org.id,
        actorUserId: user.id,
        inviteId: invite.id,
        to: email,
        orgName: org.name,
        orgSlug: org.slug,
        role,
        inviteUrl: url,
        invitedBy: user.username,
        expiresAt: invite.expires_at,
        log: request.log,
      });
      return reply.status(201).send({ ...serializeInvite(invite), inviteUrl: url, email: emailResult });
    },
  );

  app.post<{ Params: { org: string; inviteId: string } }>("/v1/orgs/:org/invites/:inviteId/resend", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (!canManageOrg(org.role)) return reply.status(403).send({ error: "Only org owners and admins can resend invites" });
    const existing = await getOrgInviteById(accountAuth.pool, org.id, request.params.inviteId);
    if (!existing || existing.status !== "pending") return reply.status(404).send({ error: "Pending invite not found" });
    const token = newInviteToken();
    const expiresAt = new Date(Date.now() + org.invite_ttl_hours * 60 * 60 * 1000);
    const ok = await resendOrgInvite(
      accountAuth.pool,
      org.id,
      request.params.inviteId,
      sha256Hex(token),
      expiresAt,
    );
    if (!ok) return reply.status(404).send({ error: "Pending invite not found" });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      inviteId: request.params.inviteId,
      eventType: "invite.resent",
    });
    const url = inviteUrl(token);
    const emailResult = await sendInviteEmailWithAudit({
      emailSender,
      accountAuth,
      orgId: org.id,
      actorUserId: user.id,
      inviteId: request.params.inviteId,
      to: existing.invited_email,
      orgName: org.name,
      orgSlug: org.slug,
      role: existing.role,
      inviteUrl: url,
      invitedBy: user.username,
      expiresAt,
      log: request.log,
    });
    return { inviteUrl: url, expiresAt, email: emailResult };
  });

  app.delete<{ Params: { org: string; inviteId: string } }>("/v1/orgs/:org/invites/:inviteId", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (!canManageOrg(org.role)) return reply.status(403).send({ error: "Only org owners and admins can revoke invites" });
    const revoked = await revokeOrgInvite(accountAuth.pool, org.id, request.params.inviteId);
    if (!revoked) return reply.status(404).send({ error: "Pending invite not found" });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: org.id,
      actorUserId: user.id,
      inviteId: request.params.inviteId,
      eventType: "invite.revoked",
    });
    return reply.status(204).send();
  });

  app.post<{ Params: { token: string } }>("/v1/org-invites/:token/accept", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const invite = await getPendingInviteByTokenHash(accountAuth.pool, sha256Hex(request.params.token));
    if (!invite) return reply.status(404).send({ error: "Invite not found or already used" });
    if (invite.expires_at.getTime() <= Date.now()) return reply.status(410).send({ error: "Invite has expired" });
    if (invite.invited_github_login && invite.invited_github_login !== user.github_login?.toLowerCase()) {
      return reply.status(403).send({ error: "This invite is for a different GitHub account" });
    }
    const verifiedEmail = getVerifiedUserEmail(user)?.toLowerCase() ?? null;
    if (invite.invited_email && invite.invited_email !== verifiedEmail) {
      return reply.status(403).send({ error: "This invite is for a different email address" });
    }
    await acceptOrgInvite(accountAuth.pool, invite, user.id);
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: invite.org_id,
      actorUserId: user.id,
      targetUserId: user.id,
      inviteId: invite.id,
      eventType: "invite.accepted",
      metadata: { role: invite.role },
    });
    return { ok: true };
  });

  app.get<{ Params: { org: string } }>("/v1/orgs/:org/audit-events", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (!canManageOrg(org.role)) return reply.status(403).send({ error: "Only org owners and admins can view audit events" });
    const events = await listOrgAuditEvents(accountAuth.pool, org.id);
    return { events: events.map(serializeAuditEvent) };
  });

  app.get<{ Params: { org: string } }>("/v1/orgs/:org/install-tokens", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
    if (!org) return reply.status(404).send({ error: "Org not found" });
    if (org.role === "viewer") return reply.status(403).send({ error: "Viewers cannot manage install tokens" });
    const tokens = await listOrgInstallTokens(accountAuth.pool, org.id, user.id, org.role);
    return {
      tokens: tokens.map((token) => ({
        id: token.id,
        name: token.name,
        userId: token.user_id,
        githubLogin: token.github_login ?? null,
        username: token.username ?? null,
        expiresAt: token.expires_at,
        lastUsedAt: token.last_used_at,
        createdAt: token.created_at,
      })),
    };
  });

  app.post<{ Params: { org: string }; Body: { name?: string; expiresInDays?: number | null } }>(
    "/v1/orgs/:org/install-tokens",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
      if (!org) return reply.status(404).send({ error: "Org not found" });
      if (!canCreateInstallToken(org.role)) {
        return reply.status(403).send({ error: "Only owners, admins, and members can create install tokens" });
      }
      const name = request.body?.name?.trim();
      if (!name) return reply.status(400).send({ error: "Token name is required" });
      const expiresInDays = request.body?.expiresInDays;
      const expiresAt =
        expiresInDays == null
          ? null
          : new Date(Date.now() + Math.min(Math.max(expiresInDays, 1), 365) * 24 * 60 * 60 * 1000);
      const token = newInstallToken();
      const created = await createInstallToken(accountAuth.pool, {
        orgId: org.id,
        userId: user.id,
        name,
        tokenHash: sha256Hex(token),
        expiresAt,
      });
      await createOrgAuditEvent(accountAuth.pool, {
        orgId: org.id,
        actorUserId: user.id,
        eventType: "install_token.created",
        metadata: { tokenId: created.id, name },
      });
      return reply.status(201).send({
        id: created.id,
        name: created.name,
        token,
        expiresAt: created.expires_at,
        createdAt: created.created_at,
      });
    },
  );

  app.delete<{ Params: { org: string; tokenId: string } }>(
    "/v1/orgs/:org/install-tokens/:tokenId",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const org = await getOrgBySlugForMember(accountAuth.pool, normalizeOrgSlug(request.params.org), user.id);
      if (!org) return reply.status(404).send({ error: "Org not found" });
      const existing = await getInstallTokenById(accountAuth.pool, org.id, request.params.tokenId);
      if (!existing || existing.revoked_at) return reply.status(404).send({ error: "Install token not found" });
      if (existing.user_id !== user.id && !canManageOrg(org.role)) {
        return reply.status(403).send({ error: "Not allowed to revoke this install token" });
      }
      const revoked = await revokeInstallToken(accountAuth.pool, org.id, request.params.tokenId);
      if (!revoked) return reply.status(404).send({ error: "Install token not found" });
      await createOrgAuditEvent(accountAuth.pool, {
        orgId: org.id,
        actorUserId: user.id,
        eventType: "install_token.revoked",
        metadata: { tokenId: request.params.tokenId },
      });
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { name: string } }>("/v1/packages/:name/members", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const name = decodePackageName(request.params.name);
    const access = await getPackageReservationForUser(accountAuth.pool, name, user.id);
    if (!access?.org_role) return reply.status(404).send({ error: "Reserved package not found" });
    const members = await listPackageMembers(accountAuth.pool, name);
    return { members: members.map(serializePackageMember), access: { orgRole: access.org_role, packageRole: access.package_role } };
  });

  app.put<{ Params: { name: string; userId: string } }>("/v1/packages/:name/members/:userId", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const name = decodePackageName(request.params.name);
    const access = await getPackageReservationForUser(accountAuth.pool, name, user.id);
    if (!access?.org_role) return reply.status(404).send({ error: "Reserved package not found" });
    if (!canManageOrg(access.org_role)) return reply.status(403).send({ error: "Only org owners and admins can assign package maintainers" });
    const target = await getOrgMembership(accountAuth.pool, access.org_id, request.params.userId);
    if (!target) return reply.status(404).send({ error: "User must be an org member before package assignment" });
    await setPackageMaintainer(accountAuth.pool, { packageName: name, userId: request.params.userId, createdByUserId: user.id });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: access.org_id,
      actorUserId: user.id,
      targetUserId: request.params.userId,
      packageName: name,
      eventType: "package.maintainer_added",
    });
    return { ok: true };
  });

  app.delete<{ Params: { name: string; userId: string } }>("/v1/packages/:name/members/:userId", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const name = decodePackageName(request.params.name);
    const access = await getPackageReservationForUser(accountAuth.pool, name, user.id);
    if (!access?.org_role) return reply.status(404).send({ error: "Reserved package not found" });
    if (!canManageOrg(access.org_role)) return reply.status(403).send({ error: "Only org owners and admins can remove package maintainers" });
    const removed = await removePackageMaintainer(accountAuth.pool, name, request.params.userId);
    if (!removed) return reply.status(404).send({ error: "Package maintainer not found" });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: access.org_id,
      actorUserId: user.id,
      targetUserId: request.params.userId,
      packageName: name,
      eventType: "package.maintainer_removed",
    });
    return reply.status(204).send();
  });

  app.patch<{ Params: { name: string }; Body: { visibility?: string } }>(
    "/v1/packages/:name",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const name = decodePackageName(request.params.name);
      const access = await getPackageReservationForUser(accountAuth.pool, name, user.id);
      if (!access?.org_role) return reply.status(404).send({ error: "Reserved package not found" });
      if (!canManageOrg(access.org_role)) {
        return reply.status(403).send({ error: "Only org owners and admins can change package visibility" });
      }
      let visibility: PackageVisibility;
      try {
        visibility = parsePackageVisibility(request.body?.visibility);
      } catch {
        return reply.status(400).send({ error: "Invalid package visibility" });
      }
      const previous = access.visibility;
      const updated = await updatePackageVisibility(accountAuth.pool, name, visibility);
      if (!updated) return reply.status(404).send({ error: "Reserved package not found" });
      await createOrgAuditEvent(accountAuth.pool, {
        orgId: access.org_id,
        actorUserId: user.id,
        packageName: name,
        eventType: "package.visibility_changed",
        metadata: { from: previous, to: visibility },
      });
      return {
        name: updated.name,
        visibility: updated.visibility,
        createdAt: updated.created_at,
      };
    },
  );

  app.post<{ Params: { name: string }; Body: { message?: string | null } }>(
    "/v1/packages/:name/deprecate",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const name = decodePackageName(request.params.name);
      const access = await getPackageReservationForUser(accountAuth.pool, name, user.id);
      if (!access?.org_role) return reply.status(404).send({ error: "Reserved package not found" });
      if (!canManageOrg(access.org_role)) {
        return reply.status(403).send({ error: "Only org owners and admins can deprecate packages" });
      }
      const message = request.body?.message?.trim() || null;
      const updated = await deprecatePackage(accountAuth.pool, name, message);
      if (!updated) return reply.status(404).send({ error: "Reserved package not found" });
      await createOrgAuditEvent(accountAuth.pool, {
        orgId: access.org_id,
        actorUserId: user.id,
        packageName: name,
        eventType: "package.deprecated",
        metadata: { message },
      });
      return {
        name: updated.name,
        deprecatedAt: updated.deprecated_at,
        deprecationMessage: updated.deprecation_message,
      };
    },
  );

  app.delete<{ Params: { name: string } }>("/v1/packages/:name/deprecate", async (request, reply) => {
    const user = await requireCurrentUser(accountAuth, request, reply);
    if (!user || !accountAuth) return;
    const name = decodePackageName(request.params.name);
    const access = await getPackageReservationForUser(accountAuth.pool, name, user.id);
    if (!access?.org_role) return reply.status(404).send({ error: "Reserved package not found" });
    if (!canManageOrg(access.org_role)) {
      return reply.status(403).send({ error: "Only org owners and admins can undeprecate packages" });
    }
    const updated = await undeprecatePackage(accountAuth.pool, name);
    if (!updated) return reply.status(404).send({ error: "Reserved package not found" });
    await createOrgAuditEvent(accountAuth.pool, {
      orgId: access.org_id,
      actorUserId: user.id,
      packageName: name,
      eventType: "package.undeprecated",
    });
    return { name: updated.name, deprecatedAt: null, deprecationMessage: null };
  });

  app.post<{ Params: { name: string; version: string } }>(
    "/v1/packages/:name/versions/:version/yank",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const name = decodePackageName(request.params.name);
      const access = await getPackageReservationForUser(accountAuth.pool, name, user.id);
      if (!access?.org_role) return reply.status(404).send({ error: "Reserved package not found" });
      if (!canManageOrg(access.org_role)) {
        return reply.status(403).send({ error: "Only org owners and admins can yank versions" });
      }
      const row = await metadata.get(name, request.params.version);
      if (!row) return reply.status(404).send({ error: "Version not found" });
      if (Date.now() - row.created_at.getTime() > YANK_WINDOW_MS) {
        return reply.status(403).send({ error: "Versions can only be yanked within 72 hours of publish" });
      }
      const yanked = await yankPackageVersion(accountAuth.pool, name, request.params.version);
      if (!yanked) return reply.status(404).send({ error: "Version not found" });
      await createOrgAuditEvent(accountAuth.pool, {
        orgId: access.org_id,
        actorUserId: user.id,
        packageName: name,
        eventType: "package.version_yanked",
        metadata: { version: request.params.version },
      });
      return {
        name: yanked.name,
        version: yanked.version,
        yankedAt: yanked.yanked_at,
      };
    },
  );

  app.post<{ Params: { name: string } }>(
    "/v1/packages/:name/publish-tokens",
    async (request, reply) => {
      const user = await requireCurrentUser(accountAuth, request, reply);
      if (!user || !accountAuth) return;
      const name = decodePackageName(request.params.name);
      const reservation = await getPackageReservationForUser(accountAuth.pool, name, user.id);
      if (!reservation?.org_role) return reply.status(404).send({ error: "Reserved package not found" });
      if (!canGeneratePackageToken(reservation)) {
        return reply.status(403).send({ error: "You need org admin access or package maintainer access to generate a token" });
      }
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
      } else if (accountAuth) {
        const reservation = await getPackageReservationByName(accountAuth.pool, name);
        if (!reservation) {
          return reply.status(403).send({ error: "Package name must be reserved before publishing" });
        }
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
        const reservation = await getPackageReservationForUser(accountAuth.pool, name, user.id);
        allowed = reservation?.org_role === "owner" || reservation?.org_role === "admin";
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
      const readAccess = await resolveReadAccess(accountAuth, request);
      if (!(await canViewPackage(accountAuth, name, readAccess))) {
        return reply.status(404).send({ error: "Not found" });
      }
      const row = await metadata.get(name, request.params.version);
      if (!row) return reply.status(404).send({ error: "Not found" });
      const publisher = accountAuth
        ? await getPublicPackagePublisher(accountAuth.pool, row.name)
        : null;
      const provenance =
        accountAuth && publisher
          ? await getProvenance(accountAuth.pool, row.name, row.version)
          : null;
      const reservation = accountAuth ? await getPackageReservationByName(accountAuth.pool, name) : null;
      return {
        name: row.name,
        version: row.version,
        manifest: row.manifest,
        integrity: row.integrity,
        sizeBytes: Number(row.size_bytes),
        createdAt: row.created_at,
        yanked: Boolean(row.yanked_at),
        yankedAt: row.yanked_at ?? null,
        visibility: reservation?.visibility ?? "public",
        deprecated: reservation?.deprecated_at
          ? {
              at: reservation.deprecated_at,
              message: reservation.deprecation_message,
            }
          : null,
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
        installCount: reservation ? Number(reservation.install_count) : 0,
      };
    },
  );

  app.post<{ Params: { name: string } }>(
    "/v1/packages/:name/installs",
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      if (!accountAuth) {
        return reply.status(503).send({ error: "Account services are not configured" });
      }
      const name = decodePackageName(request.params.name);
      const readAccess = await resolveReadAccess(accountAuth, request);
      if (!(await canViewPackage(accountAuth, name, readAccess))) {
        return reply.status(404).send({ error: "Not found" });
      }
      const versionCount = await countPackageVersions(accountAuth.pool, name);
      if (versionCount === 0) {
        return reply.status(404).send({ error: "Not found" });
      }
      const installCount = await incrementPackageInstallCount(accountAuth.pool, name);
      if (installCount === null) {
        return reply.status(404).send({ error: "Not found" });
      }
      return { installCount };
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
    async (request, reply) => {
      const parsedLimit = parseListLimit(request.query.limit);
      if (!parsedLimit.ok) return reply.status(400).send({ error: parsedLimit.error });
      const parsedCursor = parseListCursor(request.query.cursor);
      if (!parsedCursor.ok) return reply.status(400).send({ error: parsedCursor.error });

      const limit = parsedLimit.value;
      const includeDemo = request.query.includeDemo === "true";
      const query = request.query.q?.trim() ?? "";
      const readAccess = await resolveReadAccess(accountAuth, request);
      const rows = await metadata.list(query, {
        limit: includeDemo ? limit + 1 : MAX_LIST_LIMIT,
        cursor: parsedCursor.value,
      });
      let visibleRows = includeDemo ? rows : rows.filter((row) => !isHiddenPublicPackage(row.name));
      visibleRows = visibleRows.filter((row) => !row.yanked_at);

      if (accountAuth) {
        const names = [...new Set(visibleRows.map((row) => row.name))];
        const visibilityMap = await getPackageVisibilityMap(accountAuth.pool, names);
        const accessiblePrivate = readAccess.userId
          ? await listAccessiblePrivatePackageNames(accountAuth.pool, readAccess.userId, names)
          : new Set<string>();
        const deprecatedMap = await getDeprecatedPackageNames(accountAuth.pool, names);
        const exactNameQuery = query.startsWith("@") ? query.toLowerCase() : null;
        visibleRows = visibleRows.filter((row) => {
          const visibility = visibilityMap.get(row.name) ?? "public";
          if (visibility === "private" && !accessiblePrivate.has(row.name)) return false;
          if (deprecatedMap.has(row.name) && row.name.toLowerCase() !== exactNameQuery) return false;
          return true;
        });
      }

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
      const installCountByName = accountAuth
        ? await getPackageInstallCountMap(accountAuth.pool, [...new Set(page.map((row) => row.name))])
        : new Map<string, number>();
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
            usage: row.manifest.usage ?? null,
            tags: row.manifest.tags ?? [],
            categories: row.manifest.categories ?? [],
            sourceUrl: row.manifest.sourceUrl ?? null,
            integrity: row.integrity,
            sizeBytes: Number(row.size_bytes),
            createdAt: row.created_at,
            installCount: installCountByName.get(row.name) ?? 0,
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
      const readAccess = await resolveReadAccess(accountAuth, request);
      if (!(await canViewPackage(accountAuth, name, readAccess))) {
        return reply.status(404).send({ error: "Not found" });
      }
      const row = await metadata.get(name, request.params.version);
      if (!row || row.yanked_at) return reply.status(404).send({ error: "Not found" });
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
