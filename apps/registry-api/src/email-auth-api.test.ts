import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./index.js";

const savedDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = savedDatabaseUrl;
const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

let app: FastifyInstance | null = null;

beforeEach(async () => {
  if (!databaseUrl) return;
  process.env.DATABASE_URL = databaseUrl;
  process.env.AIPM_DEV_AUTH = "1";
  process.env.NODE_ENV = "development";
  delete process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING;
  delete process.env.AIPM_EMAIL_SENDER_ADDRESS;
  app = await createApp();
});

afterEach(async () => {
  await app?.close();
  app = null;
  if (savedDatabaseUrl !== undefined) process.env.DATABASE_URL = savedDatabaseUrl;
  else delete process.env.DATABASE_URL;
  delete process.env.AIPM_DEV_AUTH;
  delete process.env.NODE_ENV;
  delete process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING;
  delete process.env.AIPM_EMAIL_SENDER_ADDRESS;
  delete process.env.AIPM_TEST_AUTH_EMAILS;
  delete process.env.AIPM_TEST_AUTH_PIN;
});

describe.skipIf(!databaseUrl)("email auth API routes", () => {
  it("returns generic success on request-code and completes verify flow", async () => {
    const email = `api-${unique()}@example.com`;
    const request = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/request-code",
      payload: { email },
    });
    expect(request.statusCode).toBe(201);
    const requestBody = request.json() as { ok: boolean; devCode?: string; emailSent: boolean };
    expect(requestBody).toMatchObject({ ok: true, emailSent: false });
    expect(requestBody.devCode).toMatch(/^\d{6}$/);

    const verify = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/verify-code",
      payload: { email, code: requestBody.devCode },
    });
    expect(verify.statusCode).toBe(200);
    const verifyBody = verify.json() as { isNewUser: boolean; user: { authProvider: string } };
    expect(verifyBody.isNewUser).toBe(true);
    expect(verifyBody.user.authProvider).toBe("email");

    const sessionCookie = verify.cookies.find((cookie) => cookie.name === "aipm_session");
    expect(sessionCookie?.value).toBeTruthy();

    const me = await app!.inject({
      method: "GET",
      url: "/v1/me",
      headers: { cookie: `aipm_session=${sessionCookie!.value}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({
      authProvider: "email",
      email,
      emailVerifiedAt: expect.any(String),
    });
  });

  it("exposes emailAuth in auth config when Azure email credentials are present", async () => {
    process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING =
      "endpoint=https://example.communication.azure.com/;accesskey=fake";
    process.env.AIPM_EMAIL_SENDER_ADDRESS = "noreply@example.com";
    await app?.close();
    app = await createApp();

    const config = await app!.inject({ method: "GET", url: "/v1/auth/config" });
    expect(config.statusCode).toBe(200);
    expect(config.json()).toMatchObject({ emailAuth: true });
  });

  it("keeps GitHub auth routes available", async () => {
    const github = await app!.inject({ method: "GET", url: "/v1/auth/github/start" });
    expect([500, 503]).toContain(github.statusCode);
  });

  it("accepts the configured test pin for allowlisted emails without returning it", async () => {
    const email = `pin-${unique()}@example.com`;
    process.env.AIPM_TEST_AUTH_EMAILS = email;
    process.env.AIPM_TEST_AUTH_PIN = "246801";
    await app?.close();
    app = await createApp();

    const request = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/request-code",
      payload: { email },
    });
    expect(request.statusCode).toBe(201);
    const requestBody = request.json() as { ok: boolean; devCode?: string; emailSent: boolean };
    expect(requestBody).toMatchObject({ ok: true, emailSent: false });
    expect(requestBody.devCode).toBeUndefined();

    const verify = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/verify-code",
      payload: { email, code: "246801" },
    });
    expect(verify.statusCode).toBe(200);
    expect(verify.cookies.find((cookie) => cookie.name === "aipm_session")?.value).toBeTruthy();
  });

  it("does not accept the test pin for emails outside the allowlist", async () => {
    const email = `other-${unique()}@example.com`;
    process.env.AIPM_TEST_AUTH_EMAILS = "allowlisted@example.com";
    process.env.AIPM_TEST_AUTH_PIN = "246801";
    await app?.close();
    app = await createApp();

    const request = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/request-code",
      payload: { email },
    });
    expect(request.statusCode).toBe(201);
    const requestBody = request.json() as { devCode?: string };
    const verify = await app!.inject({
      method: "POST",
      url: "/v1/auth/email/verify-code",
      payload: { email, code: "246801" },
    });
    expect(verify.statusCode).toBe(400);
    expect(requestBody.devCode).not.toBe("246801");
  });
});
