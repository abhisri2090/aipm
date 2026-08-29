import { randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createAdminSession,
  deleteAdminSession,
  ensureUserUsername,
  getUserByAdminSession,
  type UserRow,
} from "./db.js";
import { clearAuthCookie, parseRequestCookies, setAuthCookie, sha256Hex, type AccountAuth } from "./user-auth.js";

/** Runtime env names use underscores because systemd/bash cannot load hyphenated keys. */
export const ADMIN_PASSWORD_SHA256_ENV = "AIPM_ADMIN_PASSWORD_SHA256";
export const ADMIN_ALLOWED_USERNAMES_ENV = "AIPM_ADMIN_ALLOWED_USERNAMES";
export const ADMIN_SESSION_COOKIE = "aipm_admin_session";
const ADMIN_SESSION_HOURS = 12;
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export type AdminAuthConfig = {
  passwordSha256?: string;
  allowedUsernames: string[];
};

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function constantTimeMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function parseAllowedUsernames(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return [...new Set(value.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean))];
}

export function resolveAdminAuthConfig(env: NodeJS.ProcessEnv = process.env): AdminAuthConfig {
  return {
    passwordSha256: env[ADMIN_PASSWORD_SHA256_ENV]?.trim().toLowerCase() || undefined,
    allowedUsernames: parseAllowedUsernames(env[ADMIN_ALLOWED_USERNAMES_ENV]),
  };
}

export function isAllowedAdminUsername(aipmUsername: string, allowedUsernames: string[]): boolean {
  if (allowedUsernames.length === 0) return false;
  return allowedUsernames.includes(aipmUsername.trim().toLowerCase());
}

export function verifyAdminPassword(password: string, configuredHash: string | undefined): boolean {
  if (!configuredHash) return false;
  const provided = password.trim();
  if (!provided) return false;
  return constantTimeMatch(sha256Hex(provided), configuredHash);
}

export function isAdminAuthConfigured(config: AdminAuthConfig): boolean {
  return Boolean(config.passwordSha256) && config.allowedUsernames.length > 0;
}

function loginAttemptKey(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || request.ip;
  }
  return request.ip;
}

export function registerAdminLoginAttempt(request: FastifyRequest): { allowed: boolean; retryAfterSeconds?: number } {
  const key = loginAttemptKey(request);
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true };
  }
  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  loginAttempts.set(key, current);
  return { allowed: true };
}

export function clearAdminLoginAttempts(request: FastifyRequest): void {
  loginAttempts.delete(loginAttemptKey(request));
}

export async function getCurrentAdminUser(
  auth: AccountAuth,
  request: FastifyRequest,
): Promise<UserRow | null> {
  const sessionId = parseRequestCookies(request)[ADMIN_SESSION_COOKIE];
  if (!sessionId) return null;
  const user = await getUserByAdminSession(auth.pool, sessionId);
  if (!user) return null;
  return ensureUserUsername(auth.pool, user);
}

export async function requireCurrentAdminUser(
  auth: AccountAuth | null,
  adminConfig: AdminAuthConfig,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<UserRow | null> {
  if (!auth || !isAdminAuthConfigured(adminConfig)) {
    reply.status(503).send({ error: "Admin access is not configured" });
    return null;
  }
  const user = await getCurrentAdminUser(auth, request);
  if (!user) {
    reply.status(401).send({ error: "Admin session required" });
    return null;
  }
  if (!isAllowedAdminUsername(user.username, adminConfig.allowedUsernames)) {
    reply.status(403).send({ error: "Admin access denied" });
    return null;
  }
  return user;
}

export async function startAdminSession(
  auth: AccountAuth,
  user: UserRow,
  reply: FastifyReply,
): Promise<void> {
  const sessionId = randomToken(32);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000);
  await createAdminSession(auth.pool, { id: sessionId, userId: user.id, expiresAt });
  setAuthCookie(reply, auth.config, ADMIN_SESSION_COOKIE, sessionId, ADMIN_SESSION_HOURS * 60 * 60);
}

export async function finishAdminSession(
  auth: AccountAuth | null,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (auth) {
    const sessionId = parseRequestCookies(request)[ADMIN_SESSION_COOKIE];
    if (sessionId) await deleteAdminSession(auth.pool, sessionId);
  }
  if (auth) clearAuthCookie(reply, auth.config, ADMIN_SESSION_COOKIE);
  reply.send({ ok: true });
}
