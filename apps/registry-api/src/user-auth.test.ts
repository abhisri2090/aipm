import { afterEach, describe, expect, it } from "vitest";
import { resolveUserAuthConfig } from "./user-auth.js";

afterEach(() => {
  delete process.env.NODE_ENV;
  delete process.env.AIPM_COOKIE_DOMAIN;
  delete process.env.AIPM_API_URL;
  delete process.env.AIPM_PUBLIC_SITE_URL;
});

describe("resolveUserAuthConfig", () => {
  it("omits cookie domain outside production", () => {
    process.env.NODE_ENV = "development";
    process.env.AIPM_API_URL = "http://localhost:3000";
    process.env.AIPM_PUBLIC_SITE_URL = "http://localhost:3000";
    expect(resolveUserAuthConfig().cookieDomain).toBeUndefined();
    expect(resolveUserAuthConfig().secureCookies).toBe(false);
  });

  it("uses the shared registry cookie domain in production", () => {
    process.env.NODE_ENV = "production";
    expect(resolveUserAuthConfig().cookieDomain).toBe(".aipm-registry.com");
    expect(resolveUserAuthConfig().secureCookies).toBe(true);
  });

  it("honors an explicit cookie domain override", () => {
    process.env.AIPM_COOKIE_DOMAIN = ".example.test";
    expect(resolveUserAuthConfig().cookieDomain).toBe(".example.test");
  });
});
