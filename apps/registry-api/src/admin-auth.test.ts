import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  ADMIN_ALLOWED_USERNAMES_ENV,
  ADMIN_PASSWORD_SHA256_ENV,
  isAllowedAdminUsername,
  parseAllowedUsernames,
  resolveAdminAuthConfig,
  verifyAdminPassword,
} from "./admin-auth.js";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

afterEach(() => {
  delete process.env[ADMIN_PASSWORD_SHA256_ENV];
  delete process.env[ADMIN_ALLOWED_USERNAMES_ENV];
});

describe("admin auth config", () => {
  it("parses allowed usernames from a comma-separated list", () => {
    process.env[ADMIN_ALLOWED_USERNAMES_ENV] = " Alice, bob , ALICE ";
    expect(parseAllowedUsernames(process.env[ADMIN_ALLOWED_USERNAMES_ENV])).toEqual(["alice", "bob"]);
  });

  it("verifies the configured password hash", () => {
    const password = "registry-admin";
    process.env[ADMIN_PASSWORD_SHA256_ENV] = sha256Hex(password);
    const config = resolveAdminAuthConfig();
    expect(verifyAdminPassword(password, config.passwordSha256)).toBe(true);
    expect(verifyAdminPassword("wrong", config.passwordSha256)).toBe(false);
  });

  it("checks aipm usernames case-insensitively", () => {
    expect(isAllowedAdminUsername("Maintainer", ["maintainer", "ops"])).toBe(true);
    expect(isAllowedAdminUsername("guest", ["maintainer", "ops"])).toBe(false);
  });
});
