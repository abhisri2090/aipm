import { afterEach, describe, expect, it } from "vitest";
import type { AuthEmailChallengeRow, UserRow } from "./db.js";
import {
  requestAuthCode,
  resetAuthRateLimits,
  resolveTestAuthPin,
  verifyAuthCode,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_RESEND_INTERVAL_MS,
  type EmailAuthStore,
} from "./email-auth.js";
import { sha256Hex } from "./user-auth.js";

function makeUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: "user-1",
    github_id: null,
    github_login: null,
    username: "person",
    name: null,
    avatar_url: null,
    verified: true,
    auth_provider: "email",
    primary_email: "person@example.com",
    primary_email_verified_at: new Date(),
    contact_email: "person@example.com",
    contact_email_verified_at: new Date(),
    contact_x: null,
    contact_github_url: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeStore(state: {
  challenge?: AuthEmailChallengeRow | null;
  user?: UserRow | null;
  githubContact?: UserRow | null;
}): EmailAuthStore {
  const challenges = new Map<string, AuthEmailChallengeRow>();
  if (state.challenge) challenges.set(state.challenge.email, { ...state.challenge });

  return {
    async getUserByPrimaryEmail() {
      return state.user ?? null;
    },
    async getGithubUserByContactEmail() {
      return state.githubContact ?? null;
    },
    async createEmailUser(email) {
      const user = makeUser({ primary_email: email, contact_email: email });
      state.user = user;
      return user;
    },
    async getActiveAuthEmailChallenge(email) {
      return challenges.get(email) ?? null;
    },
    async createAuthEmailChallenge(input) {
      const row: AuthEmailChallengeRow = {
        id: "challenge-1",
        email: input.email,
        code_hash: input.codeHash,
        attempts: 0,
        expires_at: input.expiresAt,
        consumed_at: null,
        request_ip: input.requestIp ?? null,
        created_at: new Date(),
      };
      challenges.set(input.email, row);
      return row;
    },
    async incrementAuthChallengeAttempts(id) {
      const row = [...challenges.values()].find((item) => item.id === id);
      if (!row) return 0;
      row.attempts += 1;
      return row.attempts;
    },
    async consumeAuthEmailChallenge(id) {
      const row = [...challenges.values()].find((item) => item.id === id);
      if (!row || row.consumed_at) return false;
      row.consumed_at = new Date();
      return true;
    },
    async createSession() {},
    async recordAuthEvent() {},
  };
}

const disabledSender = {
  isEnabled: false,
  async sendAuthCodeEmail() {
    return { sent: false, provider: "disabled" as const };
  },
};

afterEach(() => {
  resetAuthRateLimits();
});

describe("requestAuthCode", () => {
  it("rejects invalid email addresses", async () => {
    const result = await requestAuthCode(makeStore({}), disabledSender, { email: "not-an-email" }, { devAuth: false });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("stores a hashed code for valid requests", async () => {
    const store = makeStore({});
    const result = await requestAuthCode(store, disabledSender, { email: "person@example.com" }, { devAuth: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.emailSent).toBe(false);
    expect(result.body.devCode).toMatch(/^\d{6}$/);
    const challenge = await store.getActiveAuthEmailChallenge("person@example.com");
    expect(challenge?.code_hash).toBe(sha256Hex(result.body.devCode!));
  });

  it("enforces resend cooldown", async () => {
    const now = Date.now();
    const store = makeStore({
      challenge: {
        id: "challenge-1",
        email: "person@example.com",
        code_hash: "hash",
        attempts: 0,
        expires_at: new Date(now + VERIFICATION_CODE_TTL_MS),
        consumed_at: null,
        request_ip: null,
        created_at: new Date(now - 10_000),
      },
    });
    const result = await requestAuthCode(
      store,
      disabledSender,
      { email: "person@example.com" },
      { devAuth: false, now: () => now },
    );
    expect(result).toMatchObject({ ok: false, status: 429 });
  });
});

describe("verifyAuthCode", () => {
  it("rejects expired challenges", async () => {
    const now = Date.now();
    const store = makeStore({
      challenge: {
        id: "challenge-1",
        email: "person@example.com",
        code_hash: sha256Hex("123456"),
        attempts: 0,
        expires_at: new Date(now - 1_000),
        consumed_at: null,
        request_ip: null,
        created_at: new Date(now - VERIFICATION_RESEND_INTERVAL_MS),
      },
    });
    const result = await verifyAuthCode(
      store,
      { email: "person@example.com", code: "123456" },
      { now: () => now },
    );
    expect(result).toMatchObject({ ok: false, status: 410 });
  });

  it("increments attempts for wrong codes", async () => {
    const now = Date.now();
    const store = makeStore({
      challenge: {
        id: "challenge-1",
        email: "person@example.com",
        code_hash: sha256Hex("123456"),
        attempts: 0,
        expires_at: new Date(now + VERIFICATION_CODE_TTL_MS),
        consumed_at: null,
        request_ip: null,
        created_at: new Date(now),
      },
    });
    const result = await verifyAuthCode(
      store,
      { email: "person@example.com", code: "000000" },
      { now: () => now },
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    const challenge = await store.getActiveAuthEmailChallenge("person@example.com");
    expect(challenge?.attempts).toBe(1);
  });

  it("logs in existing users and signs up new users", async () => {
    const now = Date.now();
    const existing = makeUser();
    const existingStore = makeStore({
      user: existing,
      challenge: {
        id: "challenge-1",
        email: "person@example.com",
        code_hash: sha256Hex("654321"),
        attempts: 0,
        expires_at: new Date(now + VERIFICATION_CODE_TTL_MS),
        consumed_at: null,
        request_ip: null,
        created_at: new Date(now),
      },
    });
    const login = await verifyAuthCode(
      existingStore,
      { email: "person@example.com", code: "654321" },
      { now: () => now, newSessionId: () => "session-existing" },
    );
    expect(login.ok).toBe(true);
    if (!login.ok) return;
    expect(login.body.isNewUser).toBe(false);
    expect(login.body.user.id).toBe(existing.id);

    const signupStore = makeStore({
      challenge: {
        id: "challenge-2",
        email: "new@example.com",
        code_hash: sha256Hex("111222"),
        attempts: 0,
        expires_at: new Date(now + VERIFICATION_CODE_TTL_MS),
        consumed_at: null,
        request_ip: null,
        created_at: new Date(now),
      },
    });
    const signup = await verifyAuthCode(
      signupStore,
      { email: "new@example.com", code: "111222" },
      { now: () => now, newSessionId: () => "session-new" },
    );
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    expect(signup.body.isNewUser).toBe(true);
    expect(signup.body.user.authProvider).toBe("email");
  });
});

describe("resolveTestAuthPin", () => {
  it("returns the pin for an exact allowlisted email", () => {
    expect(
      resolveTestAuthPin("Test.User@Example.com", {
        AIPM_TEST_AUTH_EMAILS: "other@example.com, test.user@example.com",
        AIPM_TEST_AUTH_PIN: "246801",
      }),
    ).toBe("246801");
  });

  it("returns null when env is unset, pin is invalid, or email is not listed", () => {
    expect(resolveTestAuthPin("test.user@example.com", {})).toBeNull();
    expect(
      resolveTestAuthPin("test.user@example.com", {
        AIPM_TEST_AUTH_EMAILS: "test.user@example.com",
        AIPM_TEST_AUTH_PIN: "12",
      }),
    ).toBeNull();
    expect(
      resolveTestAuthPin("other@example.com", {
        AIPM_TEST_AUTH_EMAILS: "test.user@example.com",
        AIPM_TEST_AUTH_PIN: "246801",
      }),
    ).toBeNull();
  });
});

describe("requestAuthCode test pin", () => {
  it("hashes the test pin, skips email, and omits devCode", async () => {
    const store = makeStore({});
    let sent = 0;
    const sender = {
      isEnabled: true,
      async sendAuthCodeEmail() {
        sent += 1;
        return { sent: true, provider: "azure" as const };
      },
    };
    const result = await requestAuthCode(
      store,
      sender,
      { email: "test.user@example.com" },
      { devAuth: true, testAuthPin: "246801" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.emailSent).toBe(false);
    expect(result.body.devCode).toBeUndefined();
    expect(sent).toBe(0);
    const challenge = await store.getActiveAuthEmailChallenge("test.user@example.com");
    expect(challenge?.code_hash).toBe(sha256Hex("246801"));
  });

  it("still verifies the test pin through verifyAuthCode", async () => {
    const store = makeStore({});
    const requested = await requestAuthCode(
      store,
      disabledSender,
      { email: "test.user@example.com" },
      { devAuth: false, testAuthPin: "246801" },
    );
    expect(requested.ok).toBe(true);
    const verify = await verifyAuthCode(store, { email: "test.user@example.com", code: "246801" });
    expect(verify.ok).toBe(true);
    const failed = await verifyAuthCode(
      makeStore({
        challenge: {
          id: "challenge-1",
          email: "test.user@example.com",
          code_hash: sha256Hex("246801"),
          attempts: 0,
          expires_at: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
          consumed_at: null,
          request_ip: null,
          created_at: new Date(),
        },
      }),
      { email: "test.user@example.com", code: "000000" },
    );
    expect(failed).toMatchObject({ ok: false, status: 400 });
  });
});
