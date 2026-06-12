import { randomInt } from "node:crypto";
import type pg from "pg";
import {
  consumeAuthEmailChallenge,
  countAuthEventsSince,
  createAuthEmailChallenge,
  createEmailUser,
  createSession,
  getActiveAuthEmailChallenge,
  getGithubUserByContactEmail,
  getUserByPrimaryEmail,
  incrementAuthChallengeAttempts,
  recordAuthEvent,
  type AuthEmailChallengeRow,
  type UserRow,
} from "./db.js";
import type { EmailSender } from "./email.js";
import { sha256Hex } from "./user-auth.js";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
export const VERIFICATION_RESEND_INTERVAL_MS = 60 * 1000;
export const VERIFICATION_MAX_ATTEMPTS = 5;
export const MAX_EMAIL_LENGTH = 254;
export const REQUEST_CODE_EMAIL_LIMIT = 5;
export const REQUEST_CODE_IP_LIMIT = 20;
export const VERIFY_CODE_IP_LIMIT = 30;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
  "getnada.com",
  "sharklasers.com",
  "trashmail.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "temp-mail.org",
  "emailondeck.com",
  "mintemail.com",
  "mytemp.email",
  "mailnesia.com",
  "spamgourmet.com",
  "mailcatch.com",
  "tempail.com",
]);

export function newVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export function normalizeAuthEmail(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().normalize("NFKC").toLowerCase();
  if (!normalized || normalized.length > MAX_EMAIL_LENGTH) return null;
  return normalized;
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

export function getVerifiedUserEmail(
  user: Pick<UserRow, "primary_email" | "primary_email_verified_at" | "contact_email" | "contact_email_verified_at">,
): string | null {
  if (user.primary_email && user.primary_email_verified_at) return user.primary_email;
  if (user.contact_email && user.contact_email_verified_at) return user.contact_email;
  return null;
}

export function isDisposableEmail(email: string): boolean {
  return DISPOSABLE_EMAIL_DOMAINS.has(emailDomain(email));
}

type RateLimitBucket = { count: number; resetAt: number };

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function resetAuthRateLimits(): void {
  rateLimitBuckets.clear();
}

export function checkAuthRateLimit(key: string, limit: number, windowMs = RATE_LIMIT_WINDOW_MS, now = Date.now()): boolean {
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function retryAfterSeconds(key: string, now = Date.now()): number | undefined {
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) return undefined;
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

export type EmailAuthStore = {
  getUserByPrimaryEmail(email: string): Promise<UserRow | null>;
  getGithubUserByContactEmail(email: string): Promise<UserRow | null>;
  createEmailUser(email: string): Promise<UserRow>;
  getActiveAuthEmailChallenge(email: string): Promise<AuthEmailChallengeRow | null>;
  createAuthEmailChallenge(input: {
    email: string;
    codeHash: string;
    expiresAt: Date;
    requestIp?: string | null;
  }): Promise<AuthEmailChallengeRow>;
  incrementAuthChallengeAttempts(id: string): Promise<number>;
  consumeAuthEmailChallenge(id: string): Promise<boolean>;
  createSession(input: { id: string; userId: string; expiresAt: Date }): Promise<void>;
  recordAuthEvent(input: {
    eventType: string;
    email?: string | null;
    userId?: string | null;
    ip?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  countAuthEventsSince?(input: {
    eventType: string;
    email?: string | null;
    ip?: string | null;
    since: Date;
  }): Promise<number>;
};

export function createDbEmailAuthStore(pool: pg.Pool): EmailAuthStore {
  return {
    getUserByPrimaryEmail: (email) => getUserByPrimaryEmail(pool, email),
    getGithubUserByContactEmail: (email) => getGithubUserByContactEmail(pool, email),
    createEmailUser: (email) => createEmailUser(pool, { email }),
    getActiveAuthEmailChallenge: (email) => getActiveAuthEmailChallenge(pool, email),
    createAuthEmailChallenge: (input) => createAuthEmailChallenge(pool, input),
    incrementAuthChallengeAttempts: (id) => incrementAuthChallengeAttempts(pool, id),
    consumeAuthEmailChallenge: (id) => consumeAuthEmailChallenge(pool, id),
    createSession: (input) => createSession(pool, input),
    recordAuthEvent: (input) => recordAuthEvent(pool, input),
    countAuthEventsSince: (input) => countAuthEventsSince(pool, input),
  };
}

async function isDbRateLimited(
  store: EmailAuthStore,
  input: { eventType: string; email?: string | null; ip?: string | null; limit: number; now: number },
): Promise<boolean> {
  if (!store.countAuthEventsSince) return false;
  const since = new Date(input.now - RATE_LIMIT_WINDOW_MS);
  const count = await store.countAuthEventsSince({
    eventType: input.eventType,
    email: input.email ?? undefined,
    ip: input.ip ?? undefined,
    since,
  });
  return count >= input.limit;
}

export type RequestAuthCodeResult =
  | {
      ok: true;
      status: 201;
      body: {
        ok: true;
        email: string;
        expiresAt: string;
        emailSent: boolean;
        devCode?: string;
      };
    }
  | { ok: false; status: number; error: string; retryAfter?: number };

export type VerifyAuthCodeResult =
  | {
      ok: true;
      status: 200;
      body: {
        ok: true;
        isNewUser: boolean;
        user: {
          id: string;
          username: string;
          authProvider: "email";
          email: string;
        };
        sessionId: string;
        sessionExpiresAt: Date;
      };
    }
  | { ok: false; status: number; error: string; retryAfter?: number };

export async function requestAuthCode(
  store: EmailAuthStore,
  emailSender: Pick<EmailSender, "sendAuthCodeEmail" | "isEnabled">,
  input: { email?: string | null; requestIp?: string | null },
  options: { devAuth: boolean; now?: () => number },
): Promise<RequestAuthCodeResult> {
  const now = options.now?.() ?? Date.now();
  const email = normalizeAuthEmail(input.email);
  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, status: 400, error: "Enter a valid email address" };
  }
  if (isDisposableEmail(email)) {
    return { ok: false, status: 400, error: "Enter a valid email address" };
  }

  const emailKey = `request:email:${email}`;
  const ipKey = input.requestIp ? `request:ip:${input.requestIp}` : null;
  if (
    (await isDbRateLimited(store, {
      eventType: "auth.code_sent",
      email,
      limit: REQUEST_CODE_EMAIL_LIMIT,
      now,
    })) ||
    !checkAuthRateLimit(emailKey, REQUEST_CODE_EMAIL_LIMIT, RATE_LIMIT_WINDOW_MS, now)
  ) {
    return {
      ok: false,
      status: 429,
      error: "Too many code requests for this email. Try again later.",
      retryAfter: retryAfterSeconds(emailKey, now),
    };
  }
  if (
    ipKey &&
    ((await isDbRateLimited(store, {
      eventType: "auth.code_sent",
      ip: input.requestIp ?? null,
      limit: REQUEST_CODE_IP_LIMIT,
      now,
    })) ||
      !checkAuthRateLimit(ipKey, REQUEST_CODE_IP_LIMIT, RATE_LIMIT_WINDOW_MS, now))
  ) {
    return {
      ok: false,
      status: 429,
      error: "Too many code requests. Try again later.",
      retryAfter: retryAfterSeconds(ipKey, now),
    };
  }

  const existing = await store.getActiveAuthEmailChallenge(email);
  if (existing && now - existing.created_at.getTime() < VERIFICATION_RESEND_INTERVAL_MS) {
    return {
      ok: false,
      status: 429,
      error: "Please wait a minute before requesting another code",
      retryAfter: Math.max(
        1,
        Math.ceil((VERIFICATION_RESEND_INTERVAL_MS - (now - existing.created_at.getTime())) / 1000),
      ),
    };
  }

  const code = newVerificationCode();
  const expiresAt = new Date(now + VERIFICATION_CODE_TTL_MS);
  await store.createAuthEmailChallenge({
    email,
    codeHash: sha256Hex(code),
    expiresAt,
    requestIp: input.requestIp ?? null,
  });

  let emailSent = false;
  try {
    const emailResult = await emailSender.sendAuthCodeEmail({ to: email, code, expiresAt });
    emailSent = emailResult.sent;
  } catch {
    return { ok: false, status: 502, error: "Could not send the verification email. Try again later." };
  }

  await store.recordAuthEvent({
    eventType: "auth.code_sent",
    email,
    ip: input.requestIp ?? null,
    metadata: { emailSent },
  });

  const devCode = !emailSender.isEnabled && options.devAuth ? { devCode: code } : {};
  return {
    ok: true,
    status: 201,
    body: {
      ok: true,
      email,
      expiresAt: expiresAt.toISOString(),
      emailSent,
      ...devCode,
    },
  };
}

function constantTimeHashMatch(code: string, expectedHash: string): boolean {
  return sha256Hex(code) === expectedHash;
}

export async function verifyAuthCode(
  store: EmailAuthStore,
  input: { email?: string | null; code?: string | null; requestIp?: string | null },
  options: {
    now?: () => number;
    newSessionId?: () => string;
    sessionDays?: number;
  } = {},
): Promise<VerifyAuthCodeResult> {
  const now = options.now?.() ?? Date.now();
  const email = normalizeAuthEmail(input.email);
  const code = input.code?.trim();
  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, status: 400, error: "Enter a valid email address" };
  }
  if (!code) {
    return { ok: false, status: 400, error: "Enter the verification code" };
  }

  const ipKey = input.requestIp ? `verify:ip:${input.requestIp}` : null;
  if (ipKey) {
    await store.recordAuthEvent({
      eventType: "auth.verify_attempt",
      email,
      ip: input.requestIp ?? null,
    });
  }
  if (
    ipKey &&
    ((await isDbRateLimited(store, {
      eventType: "auth.verify_attempt",
      ip: input.requestIp ?? null,
      limit: VERIFY_CODE_IP_LIMIT,
      now,
    })) ||
      !checkAuthRateLimit(ipKey, VERIFY_CODE_IP_LIMIT, RATE_LIMIT_WINDOW_MS, now))
  ) {
    return {
      ok: false,
      status: 429,
      error: "Too many verification attempts. Try again later.",
      retryAfter: retryAfterSeconds(ipKey, now),
    };
  }

  const challenge = await store.getActiveAuthEmailChallenge(email);
  if (!challenge) {
    return { ok: false, status: 404, error: "No pending verification. Request a new code." };
  }
  if (challenge.expires_at.getTime() <= now) {
    return { ok: false, status: 410, error: "Code has expired. Request a new one." };
  }
  if (challenge.attempts >= VERIFICATION_MAX_ATTEMPTS) {
    return { ok: false, status: 429, error: "Too many attempts. Request a new code." };
  }
  if (!constantTimeHashMatch(code, challenge.code_hash)) {
    const attempts = await store.incrementAuthChallengeAttempts(challenge.id);
    await store.recordAuthEvent({
      eventType: "auth.failed",
      email,
      ip: input.requestIp ?? null,
      metadata: { reason: "incorrect_code", attempts },
    });
    const left = Math.max(0, VERIFICATION_MAX_ATTEMPTS - attempts);
    return {
      ok: false,
      status: 400,
      error: `Incorrect code. ${left} ${left === 1 ? "attempt" : "attempts"} left.`,
    };
  }

  const consumed = await store.consumeAuthEmailChallenge(challenge.id);
  if (!consumed) {
    return { ok: false, status: 404, error: "No pending verification. Request a new code." };
  }

  let user = await store.getUserByPrimaryEmail(email);
  let isNewUser = false;
  if (!user) {
    const githubConflict = await store.getGithubUserByContactEmail(email);
    if (githubConflict) {
      await store.recordAuthEvent({
        eventType: "auth.failed",
        email,
        ip: input.requestIp ?? null,
        metadata: { reason: "github_contact_conflict" },
      });
      return {
        ok: false,
        status: 409,
        error: "Sign in with GitHub or use a different email.",
      };
    }
    user = await store.createEmailUser(email);
    isNewUser = true;
  }

  const sessionDays = options.sessionDays ?? 30;
  const sessionId = options.newSessionId?.() ?? `session-${now}`;
  const sessionExpiresAt = new Date(now + sessionDays * 24 * 60 * 60 * 1000);
  await store.createSession({ id: sessionId, userId: user.id, expiresAt: sessionExpiresAt });
  await store.recordAuthEvent({
    eventType: isNewUser ? "auth.signup" : "auth.login",
    email,
    userId: user.id,
    ip: input.requestIp ?? null,
  });

  return {
    ok: true,
    status: 200,
    body: {
      ok: true,
      isNewUser,
      user: {
        id: user.id,
        username: user.username,
        authProvider: "email",
        email,
      },
      sessionId,
      sessionExpiresAt,
    },
  };
}

export function serializeEmailAuthUser(user: UserRow) {
  return {
    authProvider: user.auth_provider,
    email: user.primary_email,
    emailVerifiedAt: user.primary_email_verified_at,
  };
}
