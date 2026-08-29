import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  ADMIN_IMPORT_TOKEN_SHA256_ENV,
  resolveAdminImportAuthConfig,
  verifyAdminImportAuth,
} from "./auth.js";

function requestWithAuth(value?: string) {
  return {
    headers: value ? { authorization: value } : {},
  } as Parameters<typeof verifyAdminImportAuth>[0];
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

describe("verifyAdminImportAuth", () => {
  const token = "admin-import-secret";

  afterEach(() => {
    delete process.env[ADMIN_IMPORT_TOKEN_SHA256_ENV];
  });

  it("requires admin token configuration", () => {
    expect(verifyAdminImportAuth(requestWithAuth("Bearer x"), {})).toMatchObject({
      ok: false,
      status: 500,
    });
  });

  it("requires a bearer token", () => {
    process.env[ADMIN_IMPORT_TOKEN_SHA256_ENV] = tokenHash(token);
    const config = resolveAdminImportAuthConfig();
    expect(verifyAdminImportAuth(requestWithAuth(), config)).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("rejects an invalid bearer token", () => {
    process.env[ADMIN_IMPORT_TOKEN_SHA256_ENV] = tokenHash(token);
    const config = resolveAdminImportAuthConfig();
    expect(verifyAdminImportAuth(requestWithAuth("Bearer wrong"), config)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("accepts the configured bearer token", () => {
    process.env[ADMIN_IMPORT_TOKEN_SHA256_ENV] = tokenHash(token);
    const config = resolveAdminImportAuthConfig();
    expect(verifyAdminImportAuth(requestWithAuth(`Bearer ${token}`), config)).toEqual({ ok: true });
  });
});
