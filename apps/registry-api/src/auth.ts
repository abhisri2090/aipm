import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";

export interface PublishAuthConfig {
  required: boolean;
  tokenHash?: string;
}

export interface AdminImportAuthConfig {
  tokenHash?: string;
}

export const ADMIN_IMPORT_TOKEN_SHA256_ENV = "AIPM_ADMIN_TOKEN_SHA256";

export type PublishAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 500; error: string };

export type AdminImportAuthResult = PublishAuthResult;

export function resolvePublishAuthConfig(
  env: NodeJS.ProcessEnv = process.env,
): PublishAuthConfig {
  return {
    required: env.AIPM_REQUIRE_PUBLISH_TOKEN === "true",
    tokenHash: env.AIPM_PUBLISH_TOKEN_SHA256,
  };
}

export function resolveAdminImportAuthConfig(
  env: NodeJS.ProcessEnv = process.env,
): AdminImportAuthConfig {
  return {
    tokenHash: env[ADMIN_IMPORT_TOKEN_SHA256_ENV]?.trim().toLowerCase() || undefined,
  };
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function readBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function verifyPublishAuth(
  request: FastifyRequest,
  config: PublishAuthConfig,
): PublishAuthResult {
  if (!config.required) return { ok: true };
  if (!config.tokenHash) {
    return { ok: false, status: 500, error: "Publish token is not configured" };
  }

  const token = readBearerToken(request);
  if (!token) return { ok: false, status: 401, error: "Publish token required" };

  const expected = Buffer.from(config.tokenHash, "hex");
  const actual = Buffer.from(sha256Hex(token), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, status: 403, error: "Invalid publish token" };
  }

  return { ok: true };
}

export function verifyAdminImportAuth(
  request: FastifyRequest,
  config: AdminImportAuthConfig,
): AdminImportAuthResult {
  if (!config.tokenHash) {
    return { ok: false, status: 500, error: "Admin import token is not configured" };
  }

  const token = readBearerToken(request);
  if (!token) return { ok: false, status: 401, error: "Admin import token required" };

  const expected = Buffer.from(config.tokenHash, "hex");
  const actual = Buffer.from(sha256Hex(token), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, status: 403, error: "Invalid admin import token" };
  }

  return { ok: true };
}
