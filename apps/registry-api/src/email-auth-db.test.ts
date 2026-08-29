import {
  consumeAuthEmailChallenge,
  createAuthEmailChallenge,
  createEmailUser,
  createPool,
  ensureSchema,
  getActiveAuthEmailChallenge,
  getUserByPrimaryEmail,
  incrementAuthChallengeAttempts,
  recordAuthEvent,
} from "./db.js";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

describe.skipIf(!databaseUrl)("email auth db helpers", () => {
  it("creates email users and resolves them case-insensitively", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const suffix = unique();
    const email = `Person+${suffix}@Co.com`.toLowerCase();

    const user = await createEmailUser(pool, { email });
    expect(user.auth_provider).toBe("email");
    expect(user.primary_email).toBe(email);
    expect(user.primary_email_verified_at).toBeTruthy();
    expect(user.username).toMatch(/^person/);

    const found = await getUserByPrimaryEmail(pool, `person+${suffix}@co.com`);
    expect(found?.id).toBe(user.id);

    await pool.end();
  });

  it("manages auth email challenges and auth events", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const suffix = unique();
    const email = `auth-db-${suffix}@example.com`;
    const expiresAt = new Date(Date.now() + 60_000);

    const challenge = await createAuthEmailChallenge(pool, {
      email,
      codeHash: "hash-one",
      expiresAt,
      requestIp: "127.0.0.1",
    });
    expect(challenge.attempts).toBe(0);

    const active = await getActiveAuthEmailChallenge(pool, email);
    expect(active?.id).toBe(challenge.id);

    expect(await incrementAuthChallengeAttempts(pool, challenge.id)).toBe(1);
    expect(await consumeAuthEmailChallenge(pool, challenge.id)).toBe(true);
    expect(await consumeAuthEmailChallenge(pool, challenge.id)).toBe(false);
    expect(await getActiveAuthEmailChallenge(pool, email)).toBeNull();

    await recordAuthEvent(pool, {
      eventType: "auth.code_sent",
      email,
      ip: "127.0.0.1",
      metadata: { test: true },
    });
    const events = await pool.query<{ event_type: string; email: string | null }>(
      `SELECT event_type, email FROM auth_events WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
      [email],
    );
    expect(events.rows[0]).toMatchObject({ event_type: "auth.code_sent", email });

    await pool.end();
  });
});
