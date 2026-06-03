import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createScopedPublishToken, sha256Hex, verifyScopedPublishToken } from "./user-auth.js";
import type { AccountAuth } from "./user-auth.js";

function tokenHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function requestWithToken(token?: string) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as Parameters<typeof verifyScopedPublishToken>[1];
}

type QueryFake = (sql: string, values?: unknown[]) => Promise<{ rows: unknown[] }>;

function fakeAuth(query: QueryFake): AccountAuth {
  return {
    config: {
      apiUrl: "https://api.aipm-registry.com",
      publicSiteUrl: "https://aipm-registry.com",
      secureCookies: true,
    },
    pool: { query } as unknown as AccountAuth["pool"],
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("scoped publish tokens", () => {
  it("creates a 5-minute package token and stores only its hash", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T06:00:00.000Z"));
    const calls: unknown[][] = [];
    const auth = fakeAuth(vi.fn(async (_sql: string, values?: unknown[]) => {
      calls.push(values ?? []);
      return { rows: [{ id: "token-row" }] };
    }));

    const token = await createScopedPublishToken(auth, {
      packageName: "@team/review-helper",
      userId: "user-1",
    });

    expect(token.token).toMatch(/^aipm_/);
    expect(token.expiresAt.toISOString()).toBe("2026-06-03T06:05:00.000Z");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      "@team/review-helper",
      "user-1",
      sha256Hex(token.token),
      token.expiresAt,
    ]);
    expect(JSON.stringify(calls[0])).not.toContain(token.token);
  });

  it("accepts a bearer token only for the matching reserved package", async () => {
    const token = "aipm_test_token";
    const auth = fakeAuth(vi.fn(async (_sql: string, values?: unknown[]) => {
      const [hash, packageName] = values ?? [];
      return {
        rows:
          hash === tokenHash(token) && packageName === "@team/review-helper"
            ? [{ id: "token-row" }]
            : [],
      };
    }));

    await expect(verifyScopedPublishToken(auth, requestWithToken(token), "@team/review-helper")).resolves.toBe(true);
    await expect(verifyScopedPublishToken(auth, requestWithToken(token), "@team/other-skill")).resolves.toBe(false);
    await expect(verifyScopedPublishToken(auth, requestWithToken(), "@team/review-helper")).resolves.toBe(false);
    await expect(verifyScopedPublishToken(null, requestWithToken(token), "@team/review-helper")).resolves.toBe(false);
  });
});
