import { afterEach, describe, expect, it } from "vitest";
import { isDevAuthEnabled, isGithubAuthConfigured, resolveUserAuthConfig } from "./user-auth.js";

afterEach(() => {
  delete process.env.NODE_ENV;
  delete process.env.AIPM_DEV_AUTH;
  delete process.env.AIPM_COOKIE_DOMAIN;
  delete process.env.AIPM_API_URL;
  delete process.env.AIPM_PUBLIC_SITE_URL;
  delete process.env.GITHUB_CLIENT_ID;
  delete process.env.GITHUB_CLIENT_SECRET;
  delete process.env.AIPM_SESSION_SECRET;
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

describe("dev auth helpers", () => {
  it("enables dev auth only outside production when explicitly set", () => {
    process.env.NODE_ENV = "development";
    process.env.AIPM_DEV_AUTH = "1";
    expect(isDevAuthEnabled()).toBe(true);

    process.env.NODE_ENV = "production";
    expect(isDevAuthEnabled()).toBe(false);

    process.env.NODE_ENV = "development";
    delete process.env.AIPM_DEV_AUTH;
    expect(isDevAuthEnabled()).toBe(false);
  });

  it("detects configured GitHub auth", () => {
    expect(isGithubAuthConfigured(resolveUserAuthConfig())).toBe(false);

    process.env.GITHUB_CLIENT_ID = "client";
    process.env.GITHUB_CLIENT_SECRET = "secret";
    process.env.AIPM_SESSION_SECRET = "session";
    expect(isGithubAuthConfigured(resolveUserAuthConfig())).toBe(true);
  });
});

describe("oauth state helpers", () => {
  it("encodes and parses intent", async () => {
    const { encodeOauthState, parseOauthState } = await import("./user-auth.js");
    expect(parseOauthState(encodeOauthState("connect", "nonce1"))).toEqual({
      intent: "connect",
      nonce: "nonce1",
    });
  });
});
