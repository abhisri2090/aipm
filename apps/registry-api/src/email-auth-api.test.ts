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
  delete process.env.AIPM_EMAIL_PROVIDER;
  app = await createApp();
});

afterEach(async () => {
  await app?.close();
  app = null;
  if (savedDatabaseUrl !== undefined) process.env.DATABASE_URL = savedDatabaseUrl;
  else delete process.env.DATABASE_URL;
  delete process.env.AIPM_DEV_AUTH;
  delete process.env.NODE_ENV;
  delete process.env.AIPM_EMAIL_PROVIDER;
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

  it("exposes emailAuth in auth config when Azure email is configured", async () => {
    process.env.AIPM_EMAIL_PROVIDER = "azure";
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
});
