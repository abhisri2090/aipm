import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type pg from "pg";
import {
  createPublishToken,
  createSession,
  deleteSession,
  getActiveCliAccessTokenByHash,
  getUserById,
  getUserByPrimaryEmail,
  getUserBySession,
  getValidPublishToken,
  ensureUserUsername,
  linkGithubToUser,
  upsertGithubUser,
  GithubAlreadyLinkedError,
  GithubEmailConflictError,
  UserAlreadyHasGithubError,
  type UserRow,
} from "./db.js";

const SESSION_COOKIE = "aipm_session";
const OAUTH_STATE_COOKIE = "aipm_oauth_state";
const GITHUB_TOKEN_COOKIE = "aipm_github_token";
const SESSION_DAYS = 30;
const TOKEN_TTL_MS = 5 * 60 * 1000;
const GITHUB_TOKEN_TTL_SECONDS = 600;
const DEV_AUTH_ENV = "AIPM_DEV_AUTH";
const DEV_GITHUB_ID = "dev-local";
const DEV_GITHUB_LOGIN = "dev-local";
const DEV_DISPLAY_NAME = "Local Contributor";
const GITHUB_OAUTH_SCOPES = "read:user user:email public_repo";

export { SESSION_COOKIE, GITHUB_TOKEN_COOKIE };

export interface UserAuthConfig {
  githubClientId?: string;
  githubClientSecret?: string;
  sessionSecret?: string;
  publicSiteUrl: string;
  apiUrl: string;
  cookieDomain?: string;
  secureCookies: boolean;
}

export type AccountAuth = {
  pool: pg.Pool;
  config: UserAuthConfig;
};

type GithubUser = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

type GithubEmail = {
  email: string;
  primary?: boolean;
  verified?: boolean;
};

type OauthIntent = "login" | "connect";

export function resolveUserAuthConfig(env: NodeJS.ProcessEnv = process.env): UserAuthConfig {
  const publicSiteUrl = env.AIPM_PUBLIC_SITE_URL ?? "https://www.aipm-registry.com";
  const apiUrl = env.AIPM_API_URL ?? "https://api.aipm-registry.com";
  const isProduction = env.NODE_ENV === "production";
  const cookieDomain = env.AIPM_COOKIE_DOMAIN?.trim();
  return {
    githubClientId: env.GITHUB_CLIENT_ID,
    githubClientSecret: env.GITHUB_CLIENT_SECRET,
    sessionSecret: env.AIPM_SESSION_SECRET,
    publicSiteUrl,
    apiUrl,
    cookieDomain: cookieDomain || (isProduction ? ".aipm-registry.com" : undefined),
    secureCookies: isProduction,
  };
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function parseRequestCookies(request: FastifyRequest): Record<string, string> {
  const header = request.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator === -1) return [part, ""];
        return [decodeURIComponent(part.slice(0, separator)), decodeURIComponent(part.slice(separator + 1))];
      }),
  );
}

function cookieOptions(config: UserAuthConfig, maxAgeSeconds?: number): string {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (config.secureCookies) parts.push("Secure");
  if (config.cookieDomain) parts.push(`Domain=${config.cookieDomain}`);
  if (maxAgeSeconds !== undefined) parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts.join("; ");
}

export function setAuthCookie(
  reply: FastifyReply,
  config: UserAuthConfig,
  name: string,
  value: string,
  maxAgeSeconds?: number,
): void {
  const nextCookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${cookieOptions(config, maxAgeSeconds)}`;
  const existing = reply.getHeader("Set-Cookie");
  if (!existing) {
    reply.header("Set-Cookie", nextCookie);
    return;
  }
  const cookies = Array.isArray(existing) ? existing : [String(existing)];
  reply.header("Set-Cookie", [...cookies, nextCookie]);
}

export function clearAuthCookie(reply: FastifyReply, config: UserAuthConfig, name: string): void {
  setAuthCookie(reply, config, name, "", 0);
}

function constantTimeMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function readBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function encodeOauthState(intent: OauthIntent, nonce: string): string {
  return `${intent}.${nonce}`;
}

export function parseOauthState(state: string): { intent: OauthIntent; nonce: string } | null {
  const separator = state.indexOf(".");
  if (separator === -1) return null;
  const intent = state.slice(0, separator);
  const nonce = state.slice(separator + 1);
  if ((intent !== "login" && intent !== "connect") || !nonce) return null;
  return { intent, nonce };
}

export async function getCurrentUser(auth: AccountAuth, request: FastifyRequest): Promise<UserRow | null> {
  const sessionId = parseRequestCookies(request)[SESSION_COOKIE];
  if (sessionId) {
    const user = await getUserBySession(auth.pool, sessionId);
    if (user) return ensureUserUsername(auth.pool, user);
  }

  const token = readBearerToken(request);
  if (!token?.startsWith("aipm_cli_access_")) return null;
  const access = await getActiveCliAccessTokenByHash(auth.pool, sha256Hex(token));
  if (!access) return null;
  const user = await getUserById(auth.pool, access.user_id);
  return user ? ensureUserUsername(auth.pool, user) : null;
}

export async function requireCurrentUser(
  auth: AccountAuth | null,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<UserRow | null> {
  if (!auth) {
    reply.status(503).send({ error: "Account services are not configured" });
    return null;
  }
  const user = await getCurrentUser(auth, request);
  if (!user) {
    reply.status(401).send({ error: "Login required" });
    return null;
  }
  return user;
}

export function isDevAuthEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV !== "production" && env[DEV_AUTH_ENV] === "1";
}

export function isGithubAuthConfigured(config: UserAuthConfig): boolean {
  return Boolean(config.githubClientId && config.githubClientSecret && config.sessionSecret);
}

export function readGithubAccessToken(request: FastifyRequest): string | undefined {
  const value = parseRequestCookies(request)[GITHUB_TOKEN_COOKIE]?.trim();
  return value || undefined;
}

export async function startDevLogin(auth: AccountAuth, reply: FastifyReply): Promise<void> {
  if (!isDevAuthEnabled()) {
    throw new Error("Dev auth is not enabled");
  }

  const user = await upsertGithubUser(auth.pool, {
    githubId: DEV_GITHUB_ID,
    githubLogin: DEV_GITHUB_LOGIN,
    name: DEV_DISPLAY_NAME,
    avatarUrl: null,
    verified: true,
  });

  const sessionId = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await createSession(auth.pool, { id: sessionId, userId: user.id, expiresAt });
  setAuthCookie(reply, auth.config, SESSION_COOKIE, sessionId, SESSION_DAYS * 24 * 60 * 60);
  reply.redirect(`${auth.config.publicSiteUrl}/dashboard`);
}

export function githubStartUrl(config: UserAuthConfig, state: string): string {
  if (!config.githubClientId || !config.githubClientSecret || !config.sessionSecret) {
    throw new Error("GitHub auth is not configured");
  }
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: `${config.apiUrl}/v1/auth/github/callback`,
    scope: GITHUB_OAUTH_SCOPES,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export function startGithubLogin(auth: AccountAuth, reply: FastifyReply): void {
  const state = encodeOauthState("login", randomToken(24));
  setAuthCookie(reply, auth.config, OAUTH_STATE_COOKIE, state, 600);
  reply.redirect(githubStartUrl(auth.config, state));
}

export async function startGithubConnect(
  auth: AccountAuth,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await getCurrentUser(auth, request);
  if (!user) {
    reply.redirect(`${auth.config.publicSiteUrl}/login`);
    return;
  }
  if (user.github_id) {
    reply.redirect(`${auth.config.publicSiteUrl}/dashboard/packages?github=already_linked`);
    return;
  }
  const state = encodeOauthState("connect", randomToken(24));
  setAuthCookie(reply, auth.config, OAUTH_STATE_COOKIE, state, 600);
  reply.redirect(githubStartUrl(auth.config, state));
}

async function exchangeGithubCode(
  auth: AccountAuth,
  code: string,
): Promise<{ accessToken: string } | { error: string }> {
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      client_id: auth.config.githubClientId,
      client_secret: auth.config.githubClientSecret,
      code,
      redirect_uri: `${auth.config.apiUrl}/v1/auth/github/callback`,
    }),
  });
  const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    return { error: tokenData.error ?? "GitHub token exchange failed" };
  }
  return { accessToken: tokenData.access_token };
}

async function fetchGithubProfile(accessToken: string): Promise<{
  githubUser: GithubUser;
  contactEmail: string | null;
}> {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "user-agent": "aipm-registry",
      Accept: "application/vnd.github+json",
    },
  });
  if (!userResponse.ok) throw new Error("GitHub user lookup failed");
  const githubUser = (await userResponse.json()) as GithubUser;

  let contactEmail: string | null = githubUser.email?.trim() || null;
  const emailsResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "user-agent": "aipm-registry",
      Accept: "application/vnd.github+json",
    },
  });
  if (emailsResponse.ok) {
    const emails = (await emailsResponse.json()) as GithubEmail[];
    const primary = emails.find((row) => row.primary && row.email)?.email?.trim();
    const any = emails.find((row) => row.email)?.email?.trim();
    contactEmail = primary || any || contactEmail;
  }

  return { githubUser, contactEmail };
}

function redirectAuthError(auth: AccountAuth, reply: FastifyReply, path: string, message: string): void {
  const url = new URL(path, auth.config.publicSiteUrl);
  url.searchParams.set("error", message);
  reply.redirect(url.toString());
}

export async function finishGithubLogin(
  auth: AccountAuth,
  request: FastifyRequest<{ Querystring: { code?: string; state?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const expectedState = parseRequestCookies(request)[OAUTH_STATE_COOKIE];
  if (!request.query.code || !request.query.state || !expectedState || !constantTimeMatch(request.query.state, expectedState)) {
    return reply.status(400).send({ error: "Invalid GitHub login state" });
  }

  const parsedState = parseOauthState(request.query.state);
  if (!parsedState) {
    return reply.status(400).send({ error: "Invalid GitHub login state" });
  }

  const exchanged = await exchangeGithubCode(auth, request.query.code);
  if ("error" in exchanged) {
    return reply.status(400).send({ error: exchanged.error });
  }

  let githubUser: GithubUser;
  let contactEmail: string | null;
  try {
    ({ githubUser, contactEmail } = await fetchGithubProfile(exchanged.accessToken));
  } catch {
    return reply.status(400).send({ error: "GitHub user lookup failed" });
  }

  clearAuthCookie(reply, auth.config, OAUTH_STATE_COOKIE);
  setAuthCookie(reply, auth.config, GITHUB_TOKEN_COOKIE, exchanged.accessToken, GITHUB_TOKEN_TTL_SECONDS);

  if (parsedState.intent === "connect") {
    const sessionUser = await getCurrentUser(auth, request);
    if (!sessionUser) {
      redirectAuthError(auth, reply, "/login", "Sign in before connecting GitHub.");
      return;
    }
    try {
      await linkGithubToUser(auth.pool, {
        userId: sessionUser.id,
        githubId: String(githubUser.id),
        githubLogin: githubUser.login,
        name: githubUser.name ?? null,
        avatarUrl: githubUser.avatar_url ?? null,
        contactEmail,
      });
      reply.redirect(`${auth.config.publicSiteUrl}/dashboard/packages?github=connected`);
      return;
    } catch (error) {
      if (error instanceof GithubAlreadyLinkedError) {
        redirectAuthError(
          auth,
          reply,
          "/dashboard/packages",
          "This GitHub account is already used on AIPM. Sign in with GitHub to import.",
        );
        return;
      }
      if (error instanceof UserAlreadyHasGithubError) {
        redirectAuthError(auth, reply, "/dashboard/packages", error.message);
        return;
      }
      if (error instanceof GithubEmailConflictError) {
        redirectAuthError(auth, reply, "/dashboard/packages", error.message);
        return;
      }
      throw error;
    }
  }

  if (contactEmail) {
    const emailUser = await getUserByPrimaryEmail(auth.pool, contactEmail);
    if (emailUser && emailUser.auth_provider === "email") {
      clearAuthCookie(reply, auth.config, GITHUB_TOKEN_COOKIE);
      redirectAuthError(
        auth,
        reply,
        "/login",
        "You already have an AIPM account with this email. Sign in with email.",
      );
      return;
    }
  }

  const user = await upsertGithubUser(auth.pool, {
    githubId: String(githubUser.id),
    githubLogin: githubUser.login,
    name: githubUser.name ?? null,
    avatarUrl: githubUser.avatar_url ?? null,
    verified: true,
    contact: contactEmail
      ? {
          email: contactEmail,
          githubUrl: `https://github.com/${githubUser.login}`,
        }
      : { githubUrl: `https://github.com/${githubUser.login}` },
  });

  const sessionId = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await createSession(auth.pool, { id: sessionId, userId: user.id, expiresAt });
  setAuthCookie(reply, auth.config, SESSION_COOKIE, sessionId, SESSION_DAYS * 24 * 60 * 60);
  reply.redirect(`${auth.config.publicSiteUrl}/dashboard`);
}

export async function logout(auth: AccountAuth | null, request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (auth) {
    const sessionId = parseRequestCookies(request)[SESSION_COOKIE];
    if (sessionId) await deleteSession(auth.pool, sessionId);
    clearAuthCookie(reply, auth.config, SESSION_COOKIE);
    clearAuthCookie(reply, auth.config, GITHUB_TOKEN_COOKIE);
  }
  reply.send({ ok: true });
}

export async function createScopedPublishToken(
  auth: AccountAuth,
  input: { packageName: string; userId: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = `aipm_${randomToken(32)}`;
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await createPublishToken(auth.pool, {
    packageName: input.packageName,
    userId: input.userId,
    tokenHash: sha256Hex(token),
    expiresAt,
  });
  return { token, expiresAt };
}

export async function verifyScopedPublishToken(
  auth: AccountAuth | null,
  request: FastifyRequest,
  packageName: string,
): Promise<boolean> {
  if (!auth) return false;
  const token = readBearerToken(request);
  if (!token) return false;
  const row = await getValidPublishToken(auth.pool, sha256Hex(token), packageName);
  return Boolean(row);
}
