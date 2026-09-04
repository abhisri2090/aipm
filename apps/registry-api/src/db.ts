import pg from "pg";
import type { PackageManifest } from "@aipm-registry/schemas";
import { nextUsernameCandidate, normalizeUsernameCandidate } from "./aipm-username.js";

const { Pool } = pg;

export interface PackageVersionRow {
  id: string;
  name: string;
  version: string;
  manifest: PackageManifest;
  integrity: string;
  blob_path: string;
  size_bytes: number;
  created_at: Date;
  yanked_at: Date | null;
}

export type AuthProvider = "github" | "email";

export interface UserRow {
  id: string;
  github_id: string | null;
  github_login: string | null;
  username: string;
  name: string | null;
  avatar_url: string | null;
  verified: boolean;
  auth_provider: AuthProvider;
  primary_email: string | null;
  primary_email_verified_at: Date | null;
  contact_email: string | null;
  contact_email_verified_at: Date | null;
  contact_x: string | null;
  contact_github_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AuthEmailChallengeRow {
  id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: Date;
  consumed_at: Date | null;
  request_ip: string | null;
  created_at: Date;
}

export interface AuthEventRow {
  id: string;
  event_type: string;
  email: string | null;
  user_id: string | null;
  ip: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

const USER_ROW_FIELDS =
  "id, github_id, github_login, username, name, avatar_url, verified, auth_provider, primary_email, primary_email_verified_at, contact_email, contact_email_verified_at, contact_x, contact_github_url, created_at, updated_at";
const USER_ROW_SELECT = `users.${USER_ROW_FIELDS.replace(/, /g, ", users.")}`;
const ORG_ROW_FIELDS =
  "id, slug, name, owner_user_id, created_at, default_package_visibility, description, website_url, avatar_url, default_member_role, invite_ttl_hours, auto_join_domain, deleted_at";
const PACKAGE_RESERVATION_FIELDS =
  "id, name, org_id, owner_user_id, created_at, visibility, deprecated_at, deprecation_message, install_count";
const PACKAGE_VERSION_FIELDS =
  "id, name, version, manifest, integrity, blob_path, size_bytes, created_at, yanked_at";

export type OrgRole = "owner" | "admin" | "member" | "viewer";
export type PackageVisibility = "public" | "private";

export type CliAuthorizationCodeRow = {
  id: string;
  user_id: string;
  code_hash: string;
  code_challenge: string;
  redirect_uri: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
};

export type CliRefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  name: string | null;
  expires_at: Date;
  revoked_at: Date | null;
  last_used_at: Date | null;
  created_at: Date;
};

export type CliAccessTokenRow = {
  id: string;
  user_id: string;
  refresh_token_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
};

export interface OrgRow {
  id: string;
  slug: string;
  name: string;
  owner_user_id: string;
  created_at: Date;
  default_package_visibility: PackageVisibility;
  description: string | null;
  website_url: string | null;
  avatar_url: string | null;
  default_member_role: Exclude<OrgRole, "owner">;
  invite_ttl_hours: number;
  auto_join_domain: string | null;
  deleted_at: Date | null;
}

export interface EmailVerificationRow {
  id: string;
  user_id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: Date;
  verified_at: Date | null;
  created_at: Date;
}

export interface OrgMembershipRow {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: Date;
  updated_at: Date;
  github_login: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  contact_email: string | null;
}

export interface OrgInviteRow {
  id: string;
  org_id: string;
  invited_email: string | null;
  invited_github_login: string | null;
  role: OrgRole;
  token_hash: string;
  status: "pending" | "accepted" | "revoked";
  expires_at: Date;
  invited_by_user_id: string;
  accepted_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
  invited_by_username: string;
}

export interface PackageMembershipRow {
  package_name: string;
  user_id: string;
  role: "maintainer";
  created_at: Date;
  updated_at: Date;
  github_login: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
}

export interface OrgAuditEventRow {
  id: string;
  org_id: string;
  actor_user_id: string | null;
  event_type: string;
  target_user_id: string | null;
  package_name: string | null;
  invite_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  actor_username: string | null;
  target_username: string | null;
}

export interface PackageReservationRow {
  id: string;
  name: string;
  org_id: string;
  owner_user_id: string;
  created_at: Date;
  visibility: PackageVisibility;
  deprecated_at: Date | null;
  deprecation_message: string | null;
  install_count: number;
}

export interface InstallTokenRow {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  token_hash: string;
  expires_at: Date | null;
  last_used_at: Date | null;
  created_at: Date;
  revoked_at: Date | null;
  github_login?: string;
  username?: string;
}

export interface PublishTokenRow {
  id: string;
  package_name: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface PublicPackagePublisherRow {
  package_name: string;
  org_slug: string;
  org_name: string;
  publisher_login: string;
  publisher_name: string | null;
  publisher_avatar_url: string | null;
  publisher_verified: boolean;
}

export interface PackageProvenanceRow {
  name: string;
  version: string;
  source_url: string;
  source_commit_sha: string;
  source_license: string | null;
  content_hash: string;
  imported_at: Date;
}

export interface ImportNotificationRow {
  id: string;
  user_id: string;
  package_name: string;
  status: string;
  created_at: Date;
  sent_at: Date | null;
}

export interface UserImportedPackageRow {
  package_name: string;
  source_url: string;
  source_commit_sha: string;
  source_license: string | null;
  content_hash: string;
  version: string;
  imported_at: Date;
}

export type UpsertGithubUserInput = {
  githubId: string;
  githubLogin: string;
  name?: string | null;
  avatarUrl?: string | null;
  verified?: boolean;
  contact?: {
    email?: string | null;
    xHandle?: string | null;
    githubUrl?: string | null;
  };
};

export function createPool(connectionString: string): pg.Pool {
  return new Pool({ connectionString });
}

export async function ensureSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS package_versions (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      manifest JSONB NOT NULL,
      integrity TEXT NOT NULL,
      blob_path TEXT NOT NULL,
      size_bytes BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (name, version)
    );
    CREATE INDEX IF NOT EXISTS idx_package_versions_name ON package_versions (name);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      github_id TEXT NOT NULL UNIQUE,
      github_login TEXT NOT NULL,
      username TEXT,
      name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions (user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions (expires_at);

    CREATE TABLE IF NOT EXISTS orgs (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS org_memberships (
      org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (org_id, user_id)
    );
    ALTER TABLE org_memberships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE org_memberships DROP CONSTRAINT IF EXISTS org_memberships_role_check;
    ALTER TABLE org_memberships ADD CONSTRAINT org_memberships_role_check CHECK (role IN ('owner', 'admin', 'member', 'viewer'));
    CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON org_memberships (user_id);

    CREATE TABLE IF NOT EXISTS package_reservations (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      name TEXT NOT NULL UNIQUE,
      org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
      owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_package_reservations_org_id ON package_reservations (org_id);

    CREATE TABLE IF NOT EXISTS publish_tokens (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      package_name TEXT NOT NULL REFERENCES package_reservations(name) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE publish_tokens ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_publish_tokens_hash ON publish_tokens (token_hash);
    CREATE INDEX IF NOT EXISTS idx_publish_tokens_expires_at ON publish_tokens (expires_at);

    CREATE TABLE IF NOT EXISTS org_invites (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
      invited_email TEXT,
      invited_github_login TEXT,
      role TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMPTZ NOT NULL,
      invited_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      accepted_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (invited_email IS NOT NULL OR invited_github_login IS NOT NULL),
      CHECK (role IN ('admin', 'member', 'viewer')),
      CHECK (status IN ('pending', 'accepted', 'revoked'))
    );
    CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON org_invites (org_id);
    CREATE INDEX IF NOT EXISTS idx_org_invites_token_hash ON org_invites (token_hash);

    CREATE TABLE IF NOT EXISTS package_memberships (
      package_name TEXT NOT NULL REFERENCES package_reservations(name) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'maintainer',
      created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (package_name, user_id),
      CHECK (role IN ('maintainer'))
    );
    CREATE INDEX IF NOT EXISTS idx_package_memberships_user_id ON package_memberships (user_id);

    CREATE TABLE IF NOT EXISTS org_audit_events (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
      actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      package_name TEXT REFERENCES package_reservations(name) ON DELETE SET NULL,
      invite_id TEXT REFERENCES org_invites(id) ON DELETE SET NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_org_audit_events_org_id ON org_audit_events (org_id, created_at DESC);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_x TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_github_url TEXT;

    CREATE TABLE IF NOT EXISTS import_notifications (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      package_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_import_notifications_user_id ON import_notifications (user_id);
    CREATE INDEX IF NOT EXISTS idx_import_notifications_status ON import_notifications (status);

    CREATE TABLE IF NOT EXISTS package_provenance (
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_commit_sha TEXT NOT NULL,
      source_license TEXT,
      content_hash TEXT NOT NULL,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (name, version)
    );
    CREATE INDEX IF NOT EXISTS idx_package_provenance_name ON package_provenance (name);

    ALTER TABLE orgs ADD COLUMN IF NOT EXISTS default_package_visibility TEXT NOT NULL DEFAULT 'public';
    ALTER TABLE orgs DROP CONSTRAINT IF EXISTS orgs_default_package_visibility_check;
    ALTER TABLE orgs ADD CONSTRAINT orgs_default_package_visibility_check CHECK (default_package_visibility IN ('public', 'private'));
    ALTER TABLE orgs ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE orgs ADD COLUMN IF NOT EXISTS website_url TEXT;
    ALTER TABLE orgs ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE orgs ADD COLUMN IF NOT EXISTS default_member_role TEXT NOT NULL DEFAULT 'member';
    ALTER TABLE orgs DROP CONSTRAINT IF EXISTS orgs_default_member_role_check;
    ALTER TABLE orgs ADD CONSTRAINT orgs_default_member_role_check CHECK (default_member_role IN ('admin', 'member', 'viewer'));
    ALTER TABLE orgs ADD COLUMN IF NOT EXISTS invite_ttl_hours INT NOT NULL DEFAULT 168;
    ALTER TABLE orgs DROP CONSTRAINT IF EXISTS orgs_invite_ttl_hours_check;
    ALTER TABLE orgs ADD CONSTRAINT orgs_invite_ttl_hours_check CHECK (invite_ttl_hours >= 1 AND invite_ttl_hours <= 720);
    ALTER TABLE orgs ADD COLUMN IF NOT EXISTS auto_join_domain TEXT;
    ALTER TABLE orgs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email_verified_at TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications (user_id);

    ALTER TABLE package_reservations ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
    ALTER TABLE package_reservations DROP CONSTRAINT IF EXISTS package_reservations_visibility_check;
    ALTER TABLE package_reservations ADD CONSTRAINT package_reservations_visibility_check CHECK (visibility IN ('public', 'private'));
    ALTER TABLE package_reservations ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ;
    ALTER TABLE package_reservations ADD COLUMN IF NOT EXISTS deprecation_message TEXT;
    ALTER TABLE package_reservations ADD COLUMN IF NOT EXISTS install_count BIGINT NOT NULL DEFAULT 0;

    ALTER TABLE package_versions ADD COLUMN IF NOT EXISTS yanked_at TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS install_tokens (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ,
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_install_tokens_hash ON install_tokens (token_hash);
    CREATE INDEX IF NOT EXISTS idx_install_tokens_org_id ON install_tokens (org_id);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'github';
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_provider_check;
    ALTER TABLE users ADD CONSTRAINT users_auth_provider_check CHECK (auth_provider IN ('github', 'email'));
    ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_email TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_email_verified_at TIMESTAMPTZ;
    ALTER TABLE users ALTER COLUMN github_id DROP NOT NULL;
    ALTER TABLE users ALTER COLUMN github_login DROP NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_primary_email
      ON users (lower(primary_email)) WHERE primary_email IS NOT NULL;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_identity_check;
    ALTER TABLE users ADD CONSTRAINT users_identity_check CHECK (
      github_id IS NOT NULL OR primary_email IS NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_email_challenges (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      request_ip TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_auth_email_challenges_email
      ON auth_email_challenges (lower(email), created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_auth_email_challenges_expires
      ON auth_email_challenges (expires_at);

    CREATE TABLE IF NOT EXISTS auth_events (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      event_type TEXT NOT NULL,
      email TEXT,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      ip TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events (created_at DESC);

    CREATE TABLE IF NOT EXISTS cli_authorization_codes (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL UNIQUE,
      code_challenge TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cli_authorization_codes_hash ON cli_authorization_codes (code_hash);
    CREATE INDEX IF NOT EXISTS idx_cli_authorization_codes_expires_at ON cli_authorization_codes (expires_at);

    CREATE TABLE IF NOT EXISTS cli_refresh_tokens (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      name TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cli_refresh_tokens_hash ON cli_refresh_tokens (token_hash);
    CREATE INDEX IF NOT EXISTS idx_cli_refresh_tokens_user_id ON cli_refresh_tokens (user_id);

    CREATE TABLE IF NOT EXISTS cli_access_tokens (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_id TEXT NOT NULL REFERENCES cli_refresh_tokens(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cli_access_tokens_hash ON cli_access_tokens (token_hash);
    CREATE INDEX IF NOT EXISTS idx_cli_access_tokens_expires_at ON cli_access_tokens (expires_at);
  `);
  await backfillPackageMaintainers(pool);
  await backfillMissingUsernames(pool);
}

export async function allocateUsername(pool: pg.Pool, githubLogin: string): Promise<string> {
  const base = normalizeUsernameCandidate(githubLogin);
  for (let attempt = 1; attempt <= 200; attempt += 1) {
    const candidate = nextUsernameCandidate(base, attempt);
    const existing = await pool.query(`SELECT 1 FROM users WHERE username = $1`, [candidate]);
    if ((existing.rowCount ?? 0) === 0) return candidate;
  }
  throw new Error("Unable to allocate a unique AIPM username");
}

function usernameBaseForUser(user: Pick<UserRow, "github_login" | "primary_email">): string {
  if (user.github_login) return user.github_login;
  if (user.primary_email) return user.primary_email.split("@")[0]!;
  return "user-member";
}

export async function backfillMissingUsernames(pool: pg.Pool): Promise<void> {
  const missing = await pool.query<Pick<UserRow, "id" | "github_login" | "primary_email">>(
    `SELECT id, github_login, primary_email FROM users WHERE username IS NULL`,
  );
  for (const row of missing.rows) {
    const username = await allocateUsername(pool, usernameBaseForUser(row));
    await pool.query(`UPDATE users SET username = $2, updated_at = NOW() WHERE id = $1`, [row.id, username]);
  }
}

export async function backfillPackageMaintainers(pool: pg.Pool): Promise<void> {
  await pool.query(`
    INSERT INTO package_memberships (package_name, user_id, role, created_by_user_id)
    SELECT name, owner_user_id, 'maintainer', owner_user_id
    FROM package_reservations
    ON CONFLICT (package_name, user_id) DO NOTHING
  `);
}

export async function ensureUserUsername(pool: pg.Pool, user: UserRow): Promise<UserRow> {
  if (user.username) return user;
  const username = await allocateUsername(pool, usernameBaseForUser(user));
  const result = await pool.query<UserRow>(
    `UPDATE users
     SET username = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING ${USER_ROW_FIELDS}`,
    [user.id, username],
  );
  return result.rows[0]!;
}

export async function insertPackageVersion(
  pool: pg.Pool,
  row: Omit<PackageVersionRow, "id" | "created_at" | "yanked_at">,
): Promise<void> {
  await pool.query(
    `INSERT INTO package_versions (name, version, manifest, integrity, blob_path, size_bytes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      row.name,
      row.version,
      JSON.stringify(row.manifest),
      row.integrity,
      row.blob_path,
      row.size_bytes,
    ],
  );
}

export async function getPackageVersion(
  pool: pg.Pool,
  name: string,
  version: string,
): Promise<PackageVersionRow | null> {
  const result = await pool.query<PackageVersionRow>(
    `SELECT ${PACKAGE_VERSION_FIELDS}
     FROM package_versions WHERE name = $1 AND version = $2`,
    [name, version],
  );
  return result.rows[0] ?? null;
}

export async function listPackageVersions(
  pool: pg.Pool,
  query = "",
  options: { limit?: number; cursor?: string } = {},
): Promise<PackageVersionRow[]> {
  const normalizedQuery = query.trim();
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 101);
  const values: Array<string | number> = [];
  const filters: string[] = [];
  if (normalizedQuery) {
    values.push(`%${normalizedQuery}%`);
    filters.push(`
      (name ILIKE $1
        OR version ILIKE $1
        OR manifest->>'description' ILIKE $1
        OR manifest->>'type' ILIKE $1
        OR manifest->>'usage' ILIKE $1
        OR manifest->>'sourceUrl' ILIKE $1
        OR manifest->>'releaseNotes' ILIKE $1
        OR (manifest->'targets')::text ILIKE $1
        OR (manifest->'tags')::text ILIKE $1
        OR (manifest->'categories')::text ILIKE $1
        OR (manifest->'examples')::text ILIKE $1)
    `);
  }

  if (options.cursor) {
    values.push(options.cursor);
    filters.push(`created_at < $${values.length}`);
  }

  values.push(limit);
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await pool.query<PackageVersionRow>(
    `SELECT ${PACKAGE_VERSION_FIELDS}
     FROM (
       SELECT DISTINCT ON (name) ${PACKAGE_VERSION_FIELDS}
       FROM package_versions
       WHERE yanked_at IS NULL
       ORDER BY name, created_at DESC
     ) latest
     ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values,
  );

  return result.rows;
}

export async function checkDatabase(pool: pg.Pool): Promise<void> {
  await pool.query("SELECT 1");
}

export async function upsertGithubUser(pool: pg.Pool, user: UpsertGithubUserInput): Promise<UserRow> {
  const contactEmail = user.contact?.email ?? null;
  const contactX = user.contact?.xHandle ?? null;
  const contactGithubUrl = user.contact?.githubUrl ?? null;
  const existing = await pool.query<UserRow>(
    `SELECT ${USER_ROW_FIELDS} FROM users WHERE github_id = $1`,
    [user.githubId],
  );
  if (existing.rows[0]) {
    const verifiedClause =
      user.verified === true
        ? "verified = true,"
        : user.verified === false
          ? "verified = users.verified,"
          : "";
    const result = await pool.query<UserRow>(
      `UPDATE users
       SET github_login = $2,
           name = COALESCE(users.name, $3),
           avatar_url = COALESCE(users.avatar_url, $4),
           ${verifiedClause}
           contact_email = COALESCE(users.contact_email, $5),
           contact_x = COALESCE(users.contact_x, $6),
           contact_github_url = COALESCE(users.contact_github_url, $7),
           updated_at = NOW()
       WHERE github_id = $1
       RETURNING ${USER_ROW_FIELDS}`,
      [
        user.githubId,
        user.githubLogin,
        user.name ?? null,
        user.avatarUrl ?? null,
        contactEmail,
        contactX,
        contactGithubUrl,
      ],
    );
    return ensureUserUsername(pool, result.rows[0]!);
  }

  const username = await allocateUsername(pool, user.githubLogin);
  const verified = user.verified ?? true;
  const result = await pool.query<UserRow>(
    `INSERT INTO users (github_id, github_login, username, name, avatar_url, verified, contact_email, contact_x, contact_github_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${USER_ROW_FIELDS}`,
    [
      user.githubId,
      user.githubLogin,
      username,
      user.name ?? null,
      user.avatarUrl ?? null,
      verified,
      contactEmail,
      contactX,
      contactGithubUrl,
    ],
  );
  return result.rows[0]!;
}

export async function updateUserProfile(
  pool: pg.Pool,
  userId: string,
  profile: { name?: string | null; avatarUrl?: string | null },
): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    `UPDATE users
     SET name = $2,
         avatar_url = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${USER_ROW_FIELDS}`,
    [userId, profile.name ?? null, profile.avatarUrl ?? null],
  );
  return result.rows[0]!;
}

export async function createSession(
  pool: pg.Pool,
  session: { id: string; userId: string; expiresAt: Date },
): Promise<void> {
  await pool.query(`INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`, [
    session.id,
    session.userId,
    session.expiresAt,
  ]);
}

export async function deleteSession(pool: pg.Pool, sessionId: string): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}

export async function getUserBySession(pool: pg.Pool, sessionId: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_ROW_SELECT}
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = $1 AND sessions.expires_at > NOW()`,
    [sessionId],
  );
  return result.rows[0] ?? null;
}

export async function getUserById(pool: pg.Pool, userId: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_ROW_FIELDS}
     FROM users
     WHERE id = $1`,
    [userId],
  );
  const user = result.rows[0] ?? null;
  return user ? ensureUserUsername(pool, user) : null;
}

export async function getUserByGithubId(pool: pg.Pool, githubId: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_ROW_FIELDS} FROM users WHERE github_id = $1`,
    [githubId],
  );
  const user = result.rows[0] ?? null;
  return user ? ensureUserUsername(pool, user) : null;
}

export class GithubAlreadyLinkedError extends Error {
  constructor(message = "This GitHub account is already used on AIPM. Sign in with GitHub to import.") {
    super(message);
    this.name = "GithubAlreadyLinkedError";
  }
}

export class UserAlreadyHasGithubError extends Error {
  constructor(message = "This account is already linked to GitHub.") {
    super(message);
    this.name = "UserAlreadyHasGithubError";
  }
}

export class GithubEmailConflictError extends Error {
  constructor(message = "That GitHub email belongs to a different AIPM account. Use a different GitHub account.") {
    super(message);
    this.name = "GithubEmailConflictError";
  }
}

/** Attach GitHub identity to an existing (usually email-auth) user. Does not change auth_provider. */
export async function linkGithubToUser(
  pool: pg.Pool,
  input: {
    userId: string;
    githubId: string;
    githubLogin: string;
    name?: string | null;
    avatarUrl?: string | null;
    contactEmail?: string | null;
  },
): Promise<UserRow> {
  const current = await getUserById(pool, input.userId);
  if (!current) throw new Error("User not found");
  if (current.github_id) throw new UserAlreadyHasGithubError();

  const existingGithub = await getUserByGithubId(pool, input.githubId);
  if (existingGithub) throw new GithubAlreadyLinkedError();

  if (input.contactEmail) {
    const emailOwner = await getUserByPrimaryEmail(pool, input.contactEmail);
    if (emailOwner && emailOwner.id !== input.userId) {
      throw new GithubEmailConflictError();
    }
  }

  const result = await pool.query<UserRow>(
    `UPDATE users
     SET github_id = $2,
         github_login = $3,
         name = COALESCE(users.name, $4),
         avatar_url = COALESCE(users.avatar_url, $5),
         contact_email = COALESCE(users.contact_email, $6),
         contact_github_url = COALESCE(users.contact_github_url, $7),
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${USER_ROW_FIELDS}`,
    [
      input.userId,
      input.githubId,
      input.githubLogin,
      input.name ?? null,
      input.avatarUrl ?? null,
      input.contactEmail ?? null,
      `https://github.com/${input.githubLogin}`,
    ],
  );
  return ensureUserUsername(pool, result.rows[0]!);
}

export async function createCliAuthorizationCode(
  pool: pg.Pool,
  input: {
    userId: string;
    codeHash: string;
    codeChallenge: string;
    redirectUri: string;
    expiresAt: Date;
  },
): Promise<CliAuthorizationCodeRow> {
  const result = await pool.query<CliAuthorizationCodeRow>(
    `INSERT INTO cli_authorization_codes (user_id, code_hash, code_challenge, redirect_uri, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, code_hash, code_challenge, redirect_uri, expires_at, consumed_at, created_at`,
    [input.userId, input.codeHash, input.codeChallenge, input.redirectUri, input.expiresAt],
  );
  return result.rows[0]!;
}

export async function consumeCliAuthorizationCode(
  pool: pg.Pool,
  codeHash: string,
): Promise<CliAuthorizationCodeRow | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<CliAuthorizationCodeRow>(
      `SELECT id, user_id, code_hash, code_challenge, redirect_uri, expires_at, consumed_at, created_at
       FROM cli_authorization_codes
       WHERE code_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [codeHash],
    );
    const row = result.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query(`UPDATE cli_authorization_codes SET consumed_at = NOW() WHERE id = $1`, [row.id]);
    await client.query("COMMIT");
    return row;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createCliRefreshToken(
  pool: pg.Pool,
  input: { userId: string; tokenHash: string; name?: string | null; expiresAt: Date },
): Promise<CliRefreshTokenRow> {
  const result = await pool.query<CliRefreshTokenRow>(
    `INSERT INTO cli_refresh_tokens (user_id, token_hash, name, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, token_hash, name, expires_at, revoked_at, last_used_at, created_at`,
    [input.userId, input.tokenHash, input.name ?? null, input.expiresAt],
  );
  return result.rows[0]!;
}

export async function getActiveCliRefreshTokenByHash(
  pool: pg.Pool,
  tokenHash: string,
): Promise<CliRefreshTokenRow | null> {
  const result = await pool.query<CliRefreshTokenRow>(
    `SELECT id, user_id, token_hash, name, expires_at, revoked_at, last_used_at, created_at
     FROM cli_refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function touchCliRefreshToken(pool: pg.Pool, tokenId: string): Promise<void> {
  await pool.query(
    `UPDATE cli_refresh_tokens SET last_used_at = NOW()
     WHERE id = $1 AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '1 minute')`,
    [tokenId],
  );
}

export async function revokeCliRefreshToken(pool: pg.Pool, tokenId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE cli_refresh_tokens SET revoked_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [tokenId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function revokeCliRefreshTokenByHash(pool: pg.Pool, tokenHash: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE cli_refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function createCliAccessToken(
  pool: pg.Pool,
  input: { userId: string; refreshTokenId: string; tokenHash: string; expiresAt: Date },
): Promise<CliAccessTokenRow> {
  const result = await pool.query<CliAccessTokenRow>(
    `INSERT INTO cli_access_tokens (user_id, refresh_token_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, refresh_token_id, token_hash, expires_at, created_at`,
    [input.userId, input.refreshTokenId, input.tokenHash, input.expiresAt],
  );
  return result.rows[0]!;
}

export async function getActiveCliAccessTokenByHash(
  pool: pg.Pool,
  tokenHash: string,
): Promise<CliAccessTokenRow | null> {
  const result = await pool.query<CliAccessTokenRow>(
    `SELECT cli_access_tokens.id, cli_access_tokens.user_id, cli_access_tokens.refresh_token_id,
            cli_access_tokens.token_hash, cli_access_tokens.expires_at, cli_access_tokens.created_at
     FROM cli_access_tokens
     JOIN cli_refresh_tokens ON cli_refresh_tokens.id = cli_access_tokens.refresh_token_id
     WHERE cli_access_tokens.token_hash = $1
       AND cli_access_tokens.expires_at > NOW()
       AND cli_refresh_tokens.revoked_at IS NULL
       AND cli_refresh_tokens.expires_at > NOW()`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function listCliRefreshTokensForUser(
  pool: pg.Pool,
  userId: string,
): Promise<CliRefreshTokenRow[]> {
  const result = await pool.query<CliRefreshTokenRow>(
    `SELECT id, user_id, token_hash, name, expires_at, revoked_at, last_used_at, created_at
     FROM cli_refresh_tokens
     WHERE user_id = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function createAdminSession(
  pool: pg.Pool,
  session: { id: string; userId: string; expiresAt: Date },
): Promise<void> {
  await pool.query(`INSERT INTO admin_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`, [
    session.id,
    session.userId,
    session.expiresAt,
  ]);
}

export async function deleteAdminSession(pool: pg.Pool, sessionId: string): Promise<void> {
  await pool.query(`DELETE FROM admin_sessions WHERE id = $1`, [sessionId]);
}

export async function getUserByAdminSession(pool: pg.Pool, sessionId: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_ROW_SELECT}
     FROM admin_sessions
     JOIN users ON users.id = admin_sessions.user_id
     WHERE admin_sessions.id = $1 AND admin_sessions.expires_at > NOW()`,
    [sessionId],
  );
  return result.rows[0] ?? null;
}

export async function createOrg(
  pool: pg.Pool,
  org: { slug: string; name: string; ownerUserId: string },
): Promise<OrgRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<OrgRow>(
      `INSERT INTO orgs (slug, name, owner_user_id)
       VALUES ($1, $2, $3)
       RETURNING ${ORG_ROW_FIELDS}`,
      [org.slug, org.name, org.ownerUserId],
    );
    const created = result.rows[0]!;
    await client.query(
      `INSERT INTO org_memberships (org_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [created.id, org.ownerUserId],
    );
    await client.query(
      `INSERT INTO org_audit_events (org_id, actor_user_id, event_type, metadata)
       VALUES ($1, $2, 'org.created', $3)`,
      [created.id, org.ownerUserId, JSON.stringify({ slug: created.slug, name: created.name })],
    );
    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listUserOrgs(pool: pg.Pool, userId: string): Promise<(OrgRow & { role: OrgRole })[]> {
  const result = await pool.query<OrgRow & { role: OrgRole }>(
    `SELECT orgs.id, orgs.slug, orgs.name, orgs.owner_user_id, orgs.created_at,
            orgs.default_package_visibility, orgs.description, orgs.website_url, orgs.avatar_url,
            orgs.default_member_role, orgs.invite_ttl_hours, orgs.auto_join_domain, orgs.deleted_at,
            org_memberships.role
     FROM org_memberships
     JOIN orgs ON orgs.id = org_memberships.org_id
     WHERE org_memberships.user_id = $1 AND orgs.deleted_at IS NULL
     ORDER BY orgs.created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function getOrgBySlug(pool: pg.Pool, slug: string): Promise<OrgRow | null> {
  const result = await pool.query<OrgRow>(
    `SELECT ${ORG_ROW_FIELDS}
     FROM orgs
     WHERE slug = $1 AND deleted_at IS NULL`,
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function getOrgBySlugForMember(
  pool: pg.Pool,
  slug: string,
  userId: string,
): Promise<(OrgRow & { role: OrgRole }) | null> {
  const result = await pool.query<OrgRow & { role: OrgRole }>(
    `SELECT orgs.id, orgs.slug, orgs.name, orgs.owner_user_id, orgs.created_at,
            orgs.default_package_visibility, orgs.description, orgs.website_url, orgs.avatar_url,
            orgs.default_member_role, orgs.invite_ttl_hours, orgs.auto_join_domain, orgs.deleted_at,
            org_memberships.role
     FROM orgs
     JOIN org_memberships ON org_memberships.org_id = orgs.id
     WHERE orgs.slug = $1 AND org_memberships.user_id = $2 AND orgs.deleted_at IS NULL`,
    [slug, userId],
  );
  return result.rows[0] ?? null;
}

export async function reservePackageName(
  pool: pg.Pool,
  reservation: { name: string; orgId: string; ownerUserId: string; visibility?: PackageVisibility },
): Promise<PackageReservationRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<PackageReservationRow>(
      `INSERT INTO package_reservations (name, org_id, owner_user_id, visibility)
       SELECT $1, $2, $3, COALESCE($4::text, orgs.default_package_visibility)
       FROM orgs
       WHERE orgs.id = $2
       RETURNING ${PACKAGE_RESERVATION_FIELDS}`,
      [reservation.name, reservation.orgId, reservation.ownerUserId, reservation.visibility ?? null],
    );
    await client.query(
      `INSERT INTO package_memberships (package_name, user_id, role, created_by_user_id)
       VALUES ($1, $2, 'maintainer', $2)
       ON CONFLICT (package_name, user_id) DO NOTHING`,
      [reservation.name, reservation.ownerUserId],
    );
    await client.query(
      `INSERT INTO org_audit_events (org_id, actor_user_id, event_type, package_name, metadata)
       VALUES ($1, $2, 'package.reserved', $3, $4)`,
      [reservation.orgId, reservation.ownerUserId, reservation.name, JSON.stringify({ packageName: reservation.name })],
    );
    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOrgPackageReservations(
  pool: pg.Pool,
  orgId: string,
): Promise<PackageReservationRow[]> {
  const result = await pool.query<PackageReservationRow>(
    `SELECT ${PACKAGE_RESERVATION_FIELDS}
     FROM package_reservations
     WHERE org_id = $1
     ORDER BY created_at DESC`,
    [orgId],
  );
  return result.rows;
}

export async function getOwnedOrg(
  pool: pg.Pool,
  slug: string,
  userId: string,
): Promise<OrgRow | null> {
  const result = await pool.query<OrgRow>(
    `SELECT ${ORG_ROW_FIELDS}
     FROM orgs
     WHERE slug = $1 AND owner_user_id = $2 AND deleted_at IS NULL`,
    [slug, userId],
  );
  return result.rows[0] ?? null;
}

export async function getOrgMembership(
  pool: pg.Pool,
  orgId: string,
  userId: string,
): Promise<Pick<OrgMembershipRow, "org_id" | "user_id" | "role" | "created_at" | "updated_at"> | null> {
  const result = await pool.query<Pick<OrgMembershipRow, "org_id" | "user_id" | "role" | "created_at" | "updated_at">>(
    `SELECT org_id, user_id, role, created_at, updated_at
     FROM org_memberships
     WHERE org_id = $1 AND user_id = $2`,
    [orgId, userId],
  );
  return result.rows[0] ?? null;
}

export async function listOrgMembers(pool: pg.Pool, orgId: string): Promise<OrgMembershipRow[]> {
  const result = await pool.query<OrgMembershipRow>(
    `SELECT org_memberships.org_id,
            org_memberships.user_id,
            org_memberships.role,
            org_memberships.created_at,
            org_memberships.updated_at,
            users.github_login,
            users.username,
            users.name,
            users.avatar_url,
            users.contact_email
     FROM org_memberships
     JOIN users ON users.id = org_memberships.user_id
     WHERE org_memberships.org_id = $1
     ORDER BY CASE org_memberships.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'member' THEN 3 ELSE 4 END,
              users.username ASC`,
    [orgId],
  );
  return result.rows;
}

export async function updateOrgMemberRole(
  pool: pg.Pool,
  input: { orgId: string; userId: string; role: Exclude<OrgRole, "owner"> },
): Promise<OrgMembershipRow | null> {
  const result = await pool.query<OrgMembershipRow>(
    `UPDATE org_memberships
     SET role = $3, updated_at = NOW()
     WHERE org_id = $1 AND user_id = $2 AND role <> 'owner'
     RETURNING org_id, user_id, role, created_at, updated_at,
       (SELECT github_login FROM users WHERE users.id = org_memberships.user_id) AS github_login,
       (SELECT username FROM users WHERE users.id = org_memberships.user_id) AS username,
       (SELECT name FROM users WHERE users.id = org_memberships.user_id) AS name,
       (SELECT avatar_url FROM users WHERE users.id = org_memberships.user_id) AS avatar_url,
       (SELECT contact_email FROM users WHERE users.id = org_memberships.user_id) AS contact_email`,
    [input.orgId, input.userId, input.role],
  );
  return result.rows[0] ?? null;
}

export async function removeOrgMember(pool: pg.Pool, orgId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM org_memberships
     WHERE org_id = $1 AND user_id = $2 AND role <> 'owner'`,
    [orgId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function transferOrgOwnership(
  pool: pg.Pool,
  input: { orgId: string; fromUserId: string; toUserId: string },
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE orgs SET owner_user_id = $2 WHERE id = $1 AND owner_user_id = $3`, [
      input.orgId,
      input.toUserId,
      input.fromUserId,
    ]);
    await client.query(`UPDATE org_memberships SET role = 'admin', updated_at = NOW() WHERE org_id = $1 AND user_id = $2`, [
      input.orgId,
      input.fromUserId,
    ]);
    await client.query(
      `INSERT INTO org_memberships (org_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'owner', updated_at = NOW()`,
      [input.orgId, input.toUserId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPackageReservationByName(
  pool: pg.Pool,
  name: string,
): Promise<PackageReservationRow | null> {
  const result = await pool.query<PackageReservationRow>(
    `SELECT ${PACKAGE_RESERVATION_FIELDS}
     FROM package_reservations
     WHERE name = $1`,
    [name],
  );
  return result.rows[0] ?? null;
}

export async function incrementPackageInstallCount(
  pool: pg.Pool,
  name: string,
): Promise<number | null> {
  const result = await pool.query<{ install_count: string }>(
    `UPDATE package_reservations
     SET install_count = install_count + 1
     WHERE name = $1
     RETURNING install_count`,
    [name],
  );
  const row = result.rows[0];
  return row ? Number(row.install_count) : null;
}

export async function getPackageInstallCountMap(
  pool: pg.Pool,
  names: string[],
): Promise<Map<string, number>> {
  if (names.length === 0) return new Map();
  const result = await pool.query<{ name: string; install_count: string }>(
    `SELECT name, install_count
     FROM package_reservations
     WHERE name = ANY($1::text[])`,
    [names],
  );
  return new Map(result.rows.map((row) => [row.name, Number(row.install_count)]));
}

export async function getOwnedPackageReservation(
  pool: pg.Pool,
  name: string,
  userId: string,
): Promise<PackageReservationRow | null> {
  const result = await pool.query<PackageReservationRow>(
    `SELECT ${PACKAGE_RESERVATION_FIELDS}
     FROM package_reservations
     WHERE name = $1 AND owner_user_id = $2`,
    [name, userId],
  );
  return result.rows[0] ?? null;
}

export async function getPackageReservationForUser(
  pool: pg.Pool,
  name: string,
  userId: string,
): Promise<(PackageReservationRow & { org_role: OrgRole | null; package_role: "maintainer" | null }) | null> {
  const result = await pool.query<PackageReservationRow & { org_role: OrgRole | null; package_role: "maintainer" | null }>(
    `SELECT package_reservations.id,
            package_reservations.name,
            package_reservations.org_id,
            package_reservations.owner_user_id,
            package_reservations.created_at,
            package_reservations.visibility,
            package_reservations.deprecated_at,
            package_reservations.deprecation_message,
            package_reservations.install_count,
            org_memberships.role AS org_role,
            package_memberships.role AS package_role
     FROM package_reservations
     LEFT JOIN org_memberships ON org_memberships.org_id = package_reservations.org_id
       AND org_memberships.user_id = $2
     LEFT JOIN package_memberships ON package_memberships.package_name = package_reservations.name
       AND package_memberships.user_id = $2
     WHERE package_reservations.name = $1`,
    [name, userId],
  );
  return result.rows[0] ?? null;
}

export async function listPackageMembers(pool: pg.Pool, packageName: string): Promise<PackageMembershipRow[]> {
  const result = await pool.query<PackageMembershipRow>(
    `SELECT package_memberships.package_name,
            package_memberships.user_id,
            package_memberships.role,
            package_memberships.created_at,
            package_memberships.updated_at,
            users.github_login,
            users.username,
            users.name,
            users.avatar_url
     FROM package_memberships
     JOIN users ON users.id = package_memberships.user_id
     WHERE package_memberships.package_name = $1
     ORDER BY users.username ASC`,
    [packageName],
  );
  return result.rows;
}

export async function setPackageMaintainer(
  pool: pg.Pool,
  input: { packageName: string; userId: string; createdByUserId: string },
): Promise<void> {
  await pool.query(
    `INSERT INTO package_memberships (package_name, user_id, role, created_by_user_id)
     VALUES ($1, $2, 'maintainer', $3)
     ON CONFLICT (package_name, user_id) DO UPDATE SET role = 'maintainer', updated_at = NOW()`,
    [input.packageName, input.userId, input.createdByUserId],
  );
}

export async function removePackageMaintainer(pool: pg.Pool, packageName: string, userId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM package_memberships WHERE package_name = $1 AND user_id = $2`, [
    packageName,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function createPublishToken(
  pool: pg.Pool,
  token: { packageName: string; userId: string; tokenHash: string; expiresAt: Date },
): Promise<PublishTokenRow> {
  const result = await pool.query<PublishTokenRow>(
    `INSERT INTO publish_tokens (package_name, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, package_name, user_id, token_hash, expires_at, revoked_at, created_at`,
    [token.packageName, token.userId, token.tokenHash, token.expiresAt],
  );
  return result.rows[0]!;
}

export async function getValidPublishToken(
  pool: pg.Pool,
  tokenHash: string,
  packageName: string,
): Promise<PublishTokenRow | null> {
  const result = await pool.query<PublishTokenRow>(
    `SELECT id, package_name, user_id, token_hash, expires_at, revoked_at, created_at
     FROM publish_tokens
     WHERE token_hash = $1 AND package_name = $2 AND expires_at > NOW() AND revoked_at IS NULL`,
    [tokenHash, packageName],
  );
  return result.rows[0] ?? null;
}

export async function createOrgInvite(
  pool: pg.Pool,
  input: {
    orgId: string;
    invitedEmail?: string | null;
    invitedGithubLogin?: string | null;
    role: Exclude<OrgRole, "owner">;
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId: string;
  },
): Promise<OrgInviteRow> {
  const result = await pool.query<OrgInviteRow>(
    `INSERT INTO org_invites (org_id, invited_email, invited_github_login, role, token_hash, expires_at, invited_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, org_id, invited_email, invited_github_login, role, token_hash, status, expires_at,
       invited_by_user_id, accepted_by_user_id, created_at, updated_at,
       (SELECT username FROM users WHERE users.id = org_invites.invited_by_user_id) AS invited_by_username`,
    [
      input.orgId,
      input.invitedEmail ?? null,
      input.invitedGithubLogin?.toLowerCase() ?? null,
      input.role,
      input.tokenHash,
      input.expiresAt,
      input.invitedByUserId,
    ],
  );
  return result.rows[0]!;
}

export async function listOrgInvites(pool: pg.Pool, orgId: string): Promise<OrgInviteRow[]> {
  const result = await pool.query<OrgInviteRow>(
    `SELECT org_invites.id,
            org_invites.org_id,
            org_invites.invited_email,
            org_invites.invited_github_login,
            org_invites.role,
            org_invites.token_hash,
            org_invites.status,
            org_invites.expires_at,
            org_invites.invited_by_user_id,
            org_invites.accepted_by_user_id,
            org_invites.created_at,
            org_invites.updated_at,
            users.username AS invited_by_username
     FROM org_invites
     JOIN users ON users.id = org_invites.invited_by_user_id
     WHERE org_invites.org_id = $1
     ORDER BY org_invites.created_at DESC`,
    [orgId],
  );
  return result.rows;
}

export async function getOrgInviteById(pool: pg.Pool, orgId: string, inviteId: string): Promise<OrgInviteRow | null> {
  const result = await pool.query<OrgInviteRow>(
    `SELECT org_invites.id,
            org_invites.org_id,
            org_invites.invited_email,
            org_invites.invited_github_login,
            org_invites.role,
            org_invites.token_hash,
            org_invites.status,
            org_invites.expires_at,
            org_invites.invited_by_user_id,
            org_invites.accepted_by_user_id,
            org_invites.created_at,
            org_invites.updated_at,
            users.username AS invited_by_username
     FROM org_invites
     JOIN users ON users.id = org_invites.invited_by_user_id
     WHERE org_invites.org_id = $1 AND org_invites.id = $2`,
    [orgId, inviteId],
  );
  return result.rows[0] ?? null;
}

export async function getPendingInviteByTokenHash(pool: pg.Pool, tokenHash: string): Promise<OrgInviteRow | null> {
  const result = await pool.query<OrgInviteRow>(
    `SELECT org_invites.id,
            org_invites.org_id,
            org_invites.invited_email,
            org_invites.invited_github_login,
            org_invites.role,
            org_invites.token_hash,
            org_invites.status,
            org_invites.expires_at,
            org_invites.invited_by_user_id,
            org_invites.accepted_by_user_id,
            org_invites.created_at,
            org_invites.updated_at,
            users.username AS invited_by_username
     FROM org_invites
     JOIN users ON users.id = org_invites.invited_by_user_id
     WHERE org_invites.token_hash = $1 AND org_invites.status = 'pending'`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function revokeOrgInvite(pool: pg.Pool, orgId: string, inviteId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE org_invites
     SET status = 'revoked', updated_at = NOW()
     WHERE org_id = $1 AND id = $2 AND status = 'pending'`,
    [orgId, inviteId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function resendOrgInvite(
  pool: pg.Pool,
  orgId: string,
  inviteId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE org_invites
     SET token_hash = $3, expires_at = $4, updated_at = NOW()
     WHERE org_id = $1 AND id = $2 AND status = 'pending'`,
    [orgId, inviteId, tokenHash, expiresAt],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function acceptOrgInvite(pool: pg.Pool, invite: OrgInviteRow, userId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO org_memberships (org_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()`,
      [invite.org_id, userId, invite.role],
    );
    await client.query(
      `UPDATE org_invites
       SET status = 'accepted', accepted_by_user_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [invite.id, userId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createOrgAuditEvent(
  pool: pg.Pool,
  input: {
    orgId: string;
    actorUserId?: string | null;
    eventType: string;
    targetUserId?: string | null;
    packageName?: string | null;
    inviteId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO org_audit_events (org_id, actor_user_id, event_type, target_user_id, package_name, invite_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.orgId,
      input.actorUserId ?? null,
      input.eventType,
      input.targetUserId ?? null,
      input.packageName ?? null,
      input.inviteId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function listOrgAuditEvents(pool: pg.Pool, orgId: string): Promise<OrgAuditEventRow[]> {
  const result = await pool.query<OrgAuditEventRow>(
    `SELECT org_audit_events.id,
            org_audit_events.org_id,
            org_audit_events.actor_user_id,
            org_audit_events.event_type,
            org_audit_events.target_user_id,
            org_audit_events.package_name,
            org_audit_events.invite_id,
            org_audit_events.metadata,
            org_audit_events.created_at,
            actor.username AS actor_username,
            target.username AS target_username
     FROM org_audit_events
     LEFT JOIN users actor ON actor.id = org_audit_events.actor_user_id
     LEFT JOIN users target ON target.id = org_audit_events.target_user_id
     WHERE org_audit_events.org_id = $1
     ORDER BY org_audit_events.created_at DESC
     LIMIT 100`,
    [orgId],
  );
  return result.rows;
}

export async function getPublicPackagePublisher(
  pool: pg.Pool,
  packageName: string,
): Promise<PublicPackagePublisherRow | null> {
  const result = await pool.query<PublicPackagePublisherRow>(
    `SELECT package_reservations.name AS package_name,
            orgs.slug AS org_slug,
            orgs.name AS org_name,
            users.github_login AS publisher_login,
            users.name AS publisher_name,
            users.avatar_url AS publisher_avatar_url,
            users.verified AS publisher_verified
     FROM package_reservations
     JOIN orgs ON orgs.id = package_reservations.org_id
     JOIN users ON users.id = package_reservations.owner_user_id
     WHERE package_reservations.name = $1 AND orgs.deleted_at IS NULL`,
    [packageName],
  );
  return result.rows[0] ?? null;
}

export type AdminPackageSummary = {
  name: string;
  version: string;
  description: string;
  visibility: PackageVisibility;
  versionCount: number;
  createdAt: Date;
};

export async function listAdminPackages(
  pool: pg.Pool,
  query = "",
  limit = 50,
): Promise<AdminPackageSummary[]> {
  const normalizedQuery = query.trim();
  const boundedLimit = Math.min(Math.max(limit, 1), 100);
  const values: Array<string | number> = [];
  let filter = "";

  if (normalizedQuery) {
    values.push(`%${normalizedQuery}%`);
    filter = `
      AND (
        latest.name ILIKE $1
        OR latest.version ILIKE $1
        OR latest.description ILIKE $1
      )
    `;
  }

  values.push(boundedLimit);
  const limitParam = `$${values.length}`;

  const result = await pool.query<{
    name: string;
    version: string;
    description: string | null;
    visibility: PackageVisibility | null;
    version_count: string;
    created_at: Date;
  }>(
    `WITH latest AS (
       SELECT DISTINCT ON (pv.name)
         pv.name,
         pv.version,
         pv.manifest->>'description' AS description,
         pv.created_at
       FROM package_versions pv
       WHERE pv.yanked_at IS NULL
       ORDER BY pv.name, pv.created_at DESC
     ),
     version_counts AS (
       SELECT name, COUNT(*)::int AS version_count
       FROM package_versions
       WHERE yanked_at IS NULL
       GROUP BY name
     )
     SELECT latest.name,
            latest.version,
            latest.description,
            COALESCE(package_reservations.visibility, 'public') AS visibility,
            version_counts.version_count,
            latest.created_at
     FROM latest
     JOIN version_counts ON version_counts.name = latest.name
     LEFT JOIN package_reservations ON package_reservations.name = latest.name
     LEFT JOIN orgs ON orgs.id = package_reservations.org_id
     WHERE orgs.deleted_at IS NULL OR orgs.id IS NULL
     ${filter}
     ORDER BY latest.created_at DESC
     LIMIT ${limitParam}`,
    values,
  );

  return result.rows.map((row) => ({
    name: row.name,
    version: row.version,
    description: row.description ?? "",
    visibility: row.visibility ?? "public",
    versionCount: Number(row.version_count),
    createdAt: row.created_at,
  }));
}

export type InternalStats = {
  users: number;
  orgs: number;
  reservedPackages: number;
  publishedPackages: number;
  publishedVersions: number;
  recentUsers: Array<{ username: string; githubLogin: string | null; name: string | null; createdAt: string }>;
  recentOrgs: Array<{ slug: string; name: string; createdAt: string }>;
  recentPublished: Array<{ name: string; version: string; createdAt: string }>;
};

export async function getInternalStats(pool: pg.Pool): Promise<InternalStats> {
  const [counts, recentUsers, recentOrgs, recentPublished] = await Promise.all([
    pool.query<{
      users: string;
      orgs: string;
      reserved_packages: string;
      published_packages: string;
      published_versions: string;
    }>(`
      SELECT
        (SELECT COUNT(*)::text FROM users) AS users,
        (SELECT COUNT(*)::text FROM orgs WHERE deleted_at IS NULL) AS orgs,
        (SELECT COUNT(*)::text
         FROM package_reservations pr
         JOIN orgs o ON o.id = pr.org_id
         WHERE o.deleted_at IS NULL) AS reserved_packages,
        (SELECT COUNT(DISTINCT name)::text
         FROM package_versions
         WHERE yanked_at IS NULL) AS published_packages,
        (SELECT COUNT(*)::text FROM package_versions WHERE yanked_at IS NULL) AS published_versions
    `),
    pool.query<Pick<UserRow, "username" | "github_login" | "name" | "created_at">>(
      `SELECT username, github_login, name, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`,
    ),
    pool.query<Pick<OrgRow, "slug" | "name" | "created_at">>(
      `SELECT slug, name, created_at
       FROM orgs
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 10`,
    ),
    pool.query<Pick<PackageVersionRow, "name" | "version" | "created_at">>(
      `SELECT name, version, created_at
       FROM package_versions
       WHERE yanked_at IS NULL
       ORDER BY created_at DESC
       LIMIT 10`,
    ),
  ]);

  const row = counts.rows[0]!;
  return {
    users: Number(row.users),
    orgs: Number(row.orgs),
    reservedPackages: Number(row.reserved_packages),
    publishedPackages: Number(row.published_packages),
    publishedVersions: Number(row.published_versions),
    recentUsers: recentUsers.rows.map((user) => ({
      username: user.username,
      githubLogin: user.github_login,
      name: user.name,
      createdAt: user.created_at.toISOString(),
    })),
    recentOrgs: recentOrgs.rows.map((org) => ({
      slug: org.slug,
      name: org.name,
      createdAt: org.created_at.toISOString(),
    })),
    recentPublished: recentPublished.rows.map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
      createdAt: pkg.created_at.toISOString(),
    })),
  };
}

export async function listPublicPackagePublishers(
  pool: pg.Pool,
  packageNames: string[],
): Promise<PublicPackagePublisherRow[]> {
  if (packageNames.length === 0) return [];
  const result = await pool.query<PublicPackagePublisherRow>(
    `SELECT package_reservations.name AS package_name,
            orgs.slug AS org_slug,
            orgs.name AS org_name,
            users.github_login AS publisher_login,
            users.name AS publisher_name,
            users.avatar_url AS publisher_avatar_url,
            users.verified AS publisher_verified
     FROM package_reservations
     JOIN orgs ON orgs.id = package_reservations.org_id
     JOIN users ON users.id = package_reservations.owner_user_id
     WHERE package_reservations.name = ANY($1::text[])`,
    [packageNames],
  );
  return result.rows;
}

export async function upsertProvenance(
  pool: pg.Pool,
  row: Omit<PackageProvenanceRow, "imported_at">,
): Promise<void> {
  await pool.query(
    `INSERT INTO package_provenance (name, version, source_url, source_commit_sha, source_license, content_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (name, version) DO UPDATE SET
       source_url = EXCLUDED.source_url,
       source_commit_sha = EXCLUDED.source_commit_sha,
       source_license = EXCLUDED.source_license,
       content_hash = EXCLUDED.content_hash,
       imported_at = NOW()`,
    [row.name, row.version, row.source_url, row.source_commit_sha, row.source_license, row.content_hash],
  );
}

export async function getProvenance(
  pool: pg.Pool,
  name: string,
  version: string,
): Promise<PackageProvenanceRow | null> {
  const result = await pool.query<PackageProvenanceRow>(
    `SELECT name, version, source_url, source_commit_sha, source_license, content_hash, imported_at
     FROM package_provenance
     WHERE name = $1 AND version = $2`,
    [name, version],
  );
  return result.rows[0] ?? null;
}

export async function getLatestProvenance(
  pool: pg.Pool,
  name: string,
): Promise<PackageProvenanceRow | null> {
  const result = await pool.query<PackageProvenanceRow>(
    `SELECT name, version, source_url, source_commit_sha, source_license, content_hash, imported_at
     FROM package_provenance
     WHERE name = $1
     ORDER BY imported_at DESC
     LIMIT 1`,
    [name],
  );
  return result.rows[0] ?? null;
}

export async function getLatestContentHash(pool: pg.Pool, name: string): Promise<string | null> {
  const row = await getLatestProvenance(pool, name);
  return row?.content_hash ?? null;
}

export async function queueImportNotification(
  pool: pg.Pool,
  input: { userId: string; packageName: string },
): Promise<ImportNotificationRow> {
  const result = await pool.query<ImportNotificationRow>(
    `INSERT INTO import_notifications (user_id, package_name, status)
     VALUES ($1, $2, 'pending')
     RETURNING id, user_id, package_name, status, created_at, sent_at`,
    [input.userId, input.packageName],
  );
  return result.rows[0]!;
}

export async function listUserImportedPackages(
  pool: pg.Pool,
  userId: string,
): Promise<UserImportedPackageRow[]> {
  const result = await pool.query<UserImportedPackageRow>(
    `SELECT package_provenance.name AS package_name,
            package_provenance.source_url,
            package_provenance.source_commit_sha,
            package_provenance.source_license,
            package_provenance.content_hash,
            package_provenance.version,
            package_provenance.imported_at
     FROM package_reservations
     JOIN package_provenance ON package_provenance.name = package_reservations.name
     WHERE package_reservations.owner_user_id = $1
     ORDER BY package_provenance.imported_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function listPackageVersionsForName(pool: pg.Pool, name: string): Promise<PackageVersionRow[]> {
  const result = await pool.query<PackageVersionRow>(
    `SELECT ${PACKAGE_VERSION_FIELDS}
     FROM package_versions
     WHERE name = $1
     ORDER BY created_at DESC`,
    [name],
  );
  return result.rows;
}

export async function deletePackageProvenance(pool: pg.Pool, name: string): Promise<void> {
  await pool.query(`DELETE FROM package_provenance WHERE name = $1`, [name]);
}

export async function deletePackageVersions(pool: pg.Pool, name: string): Promise<PackageVersionRow[]> {
  const versions = await listPackageVersionsForName(pool, name);
  await pool.query(`DELETE FROM package_versions WHERE name = $1`, [name]);
  return versions;
}

export async function deletePackageReservation(pool: pg.Pool, name: string): Promise<void> {
  await pool.query(`DELETE FROM package_reservations WHERE name = $1`, [name]);
}

export async function getProvenanceByPackageNames(
  pool: pg.Pool,
  packageNames: string[],
): Promise<Map<string, PackageProvenanceRow>> {
  if (packageNames.length === 0) return new Map();
  const result = await pool.query<PackageProvenanceRow>(
    `SELECT DISTINCT ON (name) name, version, source_url, source_commit_sha, source_license, content_hash, imported_at
     FROM package_provenance
     WHERE name = ANY($1::text[])
     ORDER BY name, imported_at DESC`,
    [packageNames],
  );
  return new Map(result.rows.map((row) => [row.name, row]));
}

export type OrgSettingsUpdate = {
  name?: string;
  defaultPackageVisibility?: PackageVisibility;
  description?: string | null;
  websiteUrl?: string | null;
  avatarUrl?: string | null;
  defaultMemberRole?: Exclude<OrgRole, "owner">;
  inviteTtlHours?: number;
  autoJoinDomain?: string | null;
};

export async function updateOrgSettings(
  pool: pg.Pool,
  orgId: string,
  settings: OrgSettingsUpdate,
): Promise<OrgRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [orgId];
  const push = (sql: string, value: unknown) => {
    values.push(value);
    fields.push(`${sql} = $${values.length}`);
  };
  if (settings.name !== undefined) push("name", settings.name);
  if (settings.defaultPackageVisibility !== undefined) {
    push("default_package_visibility", settings.defaultPackageVisibility);
  }
  if (settings.description !== undefined) push("description", settings.description);
  if (settings.websiteUrl !== undefined) push("website_url", settings.websiteUrl);
  if (settings.avatarUrl !== undefined) push("avatar_url", settings.avatarUrl);
  if (settings.defaultMemberRole !== undefined) push("default_member_role", settings.defaultMemberRole);
  if (settings.inviteTtlHours !== undefined) push("invite_ttl_hours", settings.inviteTtlHours);
  if (settings.autoJoinDomain !== undefined) push("auto_join_domain", settings.autoJoinDomain);
  if (fields.length === 0) {
    const existing = await pool.query<OrgRow>(`SELECT ${ORG_ROW_FIELDS} FROM orgs WHERE id = $1`, [orgId]);
    return existing.rows[0] ?? null;
  }
  const result = await pool.query<OrgRow>(
    `UPDATE orgs SET ${fields.join(", ")} WHERE id = $1 AND deleted_at IS NULL RETURNING ${ORG_ROW_FIELDS}`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function createEmailVerification(
  pool: pg.Pool,
  input: { userId: string; email: string; codeHash: string; expiresAt: Date },
): Promise<EmailVerificationRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM email_verifications WHERE user_id = $1 AND verified_at IS NULL`, [input.userId]);
    const result = await client.query<EmailVerificationRow>(
      `INSERT INTO email_verifications (user_id, email, code_hash, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, email, code_hash, attempts, expires_at, verified_at, created_at`,
      [input.userId, input.email, input.codeHash, input.expiresAt],
    );
    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getActiveEmailVerification(pool: pg.Pool, userId: string): Promise<EmailVerificationRow | null> {
  const result = await pool.query<EmailVerificationRow>(
    `SELECT id, user_id, email, code_hash, attempts, expires_at, verified_at, created_at
     FROM email_verifications
     WHERE user_id = $1 AND verified_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function incrementEmailVerificationAttempts(pool: pg.Pool, id: string): Promise<number> {
  const result = await pool.query<{ attempts: number }>(
    `UPDATE email_verifications SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts`,
    [id],
  );
  return result.rows[0]?.attempts ?? 0;
}

export async function getUserByPrimaryEmail(pool: pg.Pool, email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_ROW_FIELDS} FROM users WHERE lower(primary_email) = lower($1)`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function getGithubUserByContactEmail(pool: pg.Pool, email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_ROW_FIELDS}
     FROM users
     WHERE lower(contact_email) = lower($1) AND auth_provider = 'github'
     LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function createEmailUser(pool: pg.Pool, input: { email: string }): Promise<UserRow> {
  const username = await allocateUsername(pool, input.email.split("@")[0]!);
  const result = await pool.query<UserRow>(
    `INSERT INTO users (
       auth_provider, primary_email, primary_email_verified_at, username, verified,
       contact_email, contact_email_verified_at
     )
     VALUES ('email', $1, NOW(), $2, true, $1, NOW())
     RETURNING ${USER_ROW_FIELDS}`,
    [input.email, username],
  );
  return result.rows[0]!;
}

export async function createAuthEmailChallenge(
  pool: pg.Pool,
  input: { email: string; codeHash: string; expiresAt: Date; requestIp?: string | null },
): Promise<AuthEmailChallengeRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM auth_email_challenges
       WHERE lower(email) = lower($1) AND consumed_at IS NULL`,
      [input.email],
    );
    const result = await client.query<AuthEmailChallengeRow>(
      `INSERT INTO auth_email_challenges (email, code_hash, expires_at, request_ip)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, code_hash, attempts, expires_at, consumed_at, request_ip, created_at`,
      [input.email, input.codeHash, input.expiresAt, input.requestIp ?? null],
    );
    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getActiveAuthEmailChallenge(
  pool: pg.Pool,
  email: string,
): Promise<AuthEmailChallengeRow | null> {
  const result = await pool.query<AuthEmailChallengeRow>(
    `SELECT id, email, code_hash, attempts, expires_at, consumed_at, request_ip, created_at
     FROM auth_email_challenges
     WHERE lower(email) = lower($1) AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function incrementAuthChallengeAttempts(pool: pg.Pool, id: string): Promise<number> {
  const result = await pool.query<{ attempts: number }>(
    `UPDATE auth_email_challenges SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts`,
    [id],
  );
  return result.rows[0]?.attempts ?? 0;
}

export async function consumeAuthEmailChallenge(pool: pg.Pool, id: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE auth_email_challenges SET consumed_at = NOW()
     WHERE id = $1 AND consumed_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function recordAuthEvent(
  pool: pg.Pool,
  input: {
    eventType: string;
    email?: string | null;
    userId?: string | null;
    ip?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO auth_events (event_type, email, user_id, ip, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      input.eventType,
      input.email ?? null,
      input.userId ?? null,
      input.ip ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function countAuthEventsSince(
  pool: pg.Pool,
  input: {
    eventType: string;
    email?: string | null;
    ip?: string | null;
    since: Date;
  },
): Promise<number> {
  const conditions = ["event_type = $1", "created_at >= $2"];
  const values: Array<string | Date> = [input.eventType, input.since];
  if (input.email) {
    values.push(input.email);
    conditions.push(`lower(email) = lower($${values.length})`);
  }
  if (input.ip) {
    values.push(input.ip);
    conditions.push(`ip = $${values.length}`);
  }
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM auth_events WHERE ${conditions.join(" AND ")}`,
    values,
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function confirmEmailVerification(
  pool: pg.Pool,
  input: { verificationId: string; userId: string; email: string },
): Promise<UserRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE email_verifications SET verified_at = NOW() WHERE id = $1`, [input.verificationId]);
    const result = await client.query<UserRow>(
      `UPDATE users
       SET contact_email = $2, contact_email_verified_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING ${USER_ROW_FIELDS}`,
      [input.userId, input.email],
    );
    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listJoinableOrgsByDomain(
  pool: pg.Pool,
  userId: string,
  domain: string,
): Promise<OrgRow[]> {
  const result = await pool.query<OrgRow>(
    `SELECT ${ORG_ROW_FIELDS}
     FROM orgs
     WHERE auto_join_domain = $2
       AND deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM org_memberships
         WHERE org_memberships.org_id = orgs.id AND org_memberships.user_id = $1
       )
     ORDER BY created_at DESC`,
    [userId, domain],
  );
  return result.rows;
}

export async function addOrgMember(
  pool: pg.Pool,
  input: { orgId: string; userId: string; role: Exclude<OrgRole, "owner"> },
): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO org_memberships (org_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (org_id, user_id) DO NOTHING`,
    [input.orgId, input.userId, input.role],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function updatePackageVisibility(
  pool: pg.Pool,
  name: string,
  visibility: PackageVisibility,
): Promise<PackageReservationRow | null> {
  const result = await pool.query<PackageReservationRow>(
    `UPDATE package_reservations SET visibility = $2 WHERE name = $1 RETURNING ${PACKAGE_RESERVATION_FIELDS}`,
    [name, visibility],
  );
  return result.rows[0] ?? null;
}

export async function getPackageVisibilityMap(
  pool: pg.Pool,
  names: string[],
): Promise<Map<string, PackageVisibility>> {
  if (names.length === 0) return new Map();
  const result = await pool.query<{ name: string; visibility: PackageVisibility }>(
    `SELECT name, visibility FROM package_reservations WHERE name = ANY($1::text[])`,
    [names],
  );
  return new Map(result.rows.map((row) => [row.name, row.visibility]));
}

export async function listOrgIdsForUser(pool: pg.Pool, userId: string): Promise<string[]> {
  const result = await pool.query<{ org_id: string }>(
    `SELECT org_id FROM org_memberships
     JOIN orgs ON orgs.id = org_memberships.org_id
     WHERE org_memberships.user_id = $1 AND orgs.deleted_at IS NULL`,
    [userId],
  );
  return result.rows.map((row) => row.org_id);
}

export async function listAccessiblePrivatePackageNames(
  pool: pg.Pool,
  userId: string,
  names: string[],
): Promise<Set<string>> {
  if (names.length === 0) return new Set();
  const result = await pool.query<{ name: string }>(
    `SELECT package_reservations.name
     FROM package_reservations
     JOIN org_memberships ON org_memberships.org_id = package_reservations.org_id
     JOIN orgs ON orgs.id = package_reservations.org_id
     WHERE package_reservations.name = ANY($1::text[])
       AND package_reservations.visibility = 'private'
       AND org_memberships.user_id = $2
       AND orgs.deleted_at IS NULL`,
    [names, userId],
  );
  return new Set(result.rows.map((row) => row.name));
}

export async function getOrgIdForPackage(pool: pg.Pool, name: string): Promise<string | null> {
  const result = await pool.query<{ org_id: string }>(
    `SELECT org_id FROM package_reservations WHERE name = $1`,
    [name],
  );
  return result.rows[0]?.org_id ?? null;
}

export async function createInstallToken(
  pool: pg.Pool,
  input: {
    orgId: string;
    userId: string;
    name: string;
    tokenHash: string;
    expiresAt: Date | null;
  },
): Promise<InstallTokenRow> {
  const result = await pool.query<InstallTokenRow>(
    `INSERT INTO install_tokens (org_id, user_id, name, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, org_id, user_id, name, token_hash, expires_at, last_used_at, created_at, revoked_at`,
    [input.orgId, input.userId, input.name, input.tokenHash, input.expiresAt],
  );
  return result.rows[0]!;
}

export async function listOrgInstallTokens(
  pool: pg.Pool,
  orgId: string,
  viewerUserId: string,
  viewerRole: OrgRole,
): Promise<InstallTokenRow[]> {
  const adminView = viewerRole === "owner" || viewerRole === "admin";
  const result = await pool.query<InstallTokenRow>(
    `SELECT install_tokens.id, install_tokens.org_id, install_tokens.user_id, install_tokens.name,
            install_tokens.token_hash, install_tokens.expires_at, install_tokens.last_used_at,
            install_tokens.created_at, install_tokens.revoked_at,
            users.github_login, users.username
     FROM install_tokens
     JOIN users ON users.id = install_tokens.user_id
     WHERE install_tokens.org_id = $1
       AND install_tokens.revoked_at IS NULL
       AND (${adminView ? "TRUE" : "install_tokens.user_id = $2"})
     ORDER BY install_tokens.created_at DESC`,
    adminView ? [orgId] : [orgId, viewerUserId],
  );
  return result.rows;
}

export async function getInstallTokenById(
  pool: pg.Pool,
  orgId: string,
  tokenId: string,
): Promise<InstallTokenRow | null> {
  const result = await pool.query<InstallTokenRow>(
    `SELECT id, org_id, user_id, name, token_hash, expires_at, last_used_at, created_at, revoked_at
     FROM install_tokens
     WHERE id = $1 AND org_id = $2`,
    [tokenId, orgId],
  );
  return result.rows[0] ?? null;
}

export async function revokeInstallToken(pool: pg.Pool, orgId: string, tokenId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE install_tokens SET revoked_at = NOW()
     WHERE id = $1 AND org_id = $2 AND revoked_at IS NULL`,
    [tokenId, orgId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getActiveInstallTokenByHash(
  pool: pg.Pool,
  tokenHash: string,
): Promise<InstallTokenRow | null> {
  const result = await pool.query<InstallTokenRow>(
    `SELECT install_tokens.id, install_tokens.org_id, install_tokens.user_id, install_tokens.name,
            install_tokens.token_hash, install_tokens.expires_at, install_tokens.last_used_at,
            install_tokens.created_at, install_tokens.revoked_at
     FROM install_tokens
     JOIN orgs ON orgs.id = install_tokens.org_id
     WHERE install_tokens.token_hash = $1
       AND install_tokens.revoked_at IS NULL
       AND (install_tokens.expires_at IS NULL OR install_tokens.expires_at > NOW())
       AND orgs.deleted_at IS NULL`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function touchInstallToken(pool: pg.Pool, tokenId: string): Promise<void> {
  await pool.query(
    `UPDATE install_tokens SET last_used_at = NOW()
     WHERE id = $1 AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '1 minute')`,
    [tokenId],
  );
}

export async function countPublishedVersionsForOrg(pool: pg.Pool, orgId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM package_versions
     JOIN package_reservations ON package_reservations.name = package_versions.name
     WHERE package_reservations.org_id = $1`,
    [orgId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function countPackageVersions(pool: pg.Pool, name: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM package_versions WHERE name = $1`,
    [name],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function softDeleteOrg(pool: pg.Pool, orgId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE orgs SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
    [orgId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function purgeDeletedOrgs(pool: pg.Pool): Promise<number> {
  const result = await pool.query(
    `DELETE FROM orgs WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'`,
  );
  return result.rowCount ?? 0;
}

export async function listOrgAdminMemberEmails(pool: pg.Pool, orgId: string): Promise<string[]> {
  const result = await pool.query<{ contact_email: string | null }>(
    `SELECT users.contact_email
     FROM org_memberships
     JOIN users ON users.id = org_memberships.user_id
     WHERE org_memberships.org_id = $1 AND org_memberships.role IN ('owner', 'admin')`,
    [orgId],
  );
  return result.rows.map((row) => row.contact_email).filter((email): email is string => Boolean(email));
}

export async function deprecatePackage(
  pool: pg.Pool,
  name: string,
  message: string | null,
): Promise<PackageReservationRow | null> {
  const result = await pool.query<PackageReservationRow>(
    `UPDATE package_reservations
     SET deprecated_at = NOW(), deprecation_message = $2
     WHERE name = $1
     RETURNING ${PACKAGE_RESERVATION_FIELDS}`,
    [name, message],
  );
  return result.rows[0] ?? null;
}

export async function undeprecatePackage(pool: pg.Pool, name: string): Promise<PackageReservationRow | null> {
  const result = await pool.query<PackageReservationRow>(
    `UPDATE package_reservations
     SET deprecated_at = NULL, deprecation_message = NULL
     WHERE name = $1
     RETURNING ${PACKAGE_RESERVATION_FIELDS}`,
    [name],
  );
  return result.rows[0] ?? null;
}

export async function yankPackageVersion(
  pool: pg.Pool,
  name: string,
  version: string,
): Promise<PackageVersionRow | null> {
  const result = await pool.query<PackageVersionRow>(
    `UPDATE package_versions SET yanked_at = NOW()
     WHERE name = $1 AND version = $2 AND yanked_at IS NULL
     RETURNING ${PACKAGE_VERSION_FIELDS}`,
    [name, version],
  );
  return result.rows[0] ?? null;
}

export async function getDeprecatedPackageNames(
  pool: pg.Pool,
  names: string[],
): Promise<Map<string, { deprecated_at: Date; deprecation_message: string | null }>> {
  if (names.length === 0) return new Map();
  const result = await pool.query<{
    name: string;
    deprecated_at: Date;
    deprecation_message: string | null;
  }>(
    `SELECT name, deprecated_at, deprecation_message
     FROM package_reservations
     WHERE name = ANY($1::text[]) AND deprecated_at IS NOT NULL`,
    [names],
  );
  return new Map(
    result.rows.map((row) => [
      row.name,
      { deprecated_at: row.deprecated_at, deprecation_message: row.deprecation_message },
    ]),
  );
}
