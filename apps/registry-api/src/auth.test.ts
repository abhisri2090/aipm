import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPublishAuth, type PublishAuthConfig } from "./auth.js";

function requestWithAuth(value?: string) {
  return {
    headers: value ? { authorization: value } : {},
  } as Parameters<typeof verifyPublishAuth>[0];
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

describe("verifyPublishAuth", () => {
  const config: PublishAuthConfig = {
    required: true,
    tokenHash: tokenHash("secret"),
  };

  it("allows publishing when auth is disabled", () => {
    expect(verifyPublishAuth(requestWithAuth(), { required: false })).toEqual({ ok: true });
  });

  it("requires a bearer token when publish auth is enabled", () => {
    expect(verifyPublishAuth(requestWithAuth(), config)).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("rejects an invalid bearer token", () => {
    expect(verifyPublishAuth(requestWithAuth("Bearer wrong"), config)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("accepts the configured bearer token", () => {
    expect(verifyPublishAuth(requestWithAuth("Bearer secret"), config)).toEqual({ ok: true });
  });
});
