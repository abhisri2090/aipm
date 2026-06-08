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
}

export interface UserRow {
  id: string;
  github_id: string;
  github_login: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  verified: boolean;
  contact_email: string | null;
  contact_x: string | null;
  contact_github_url: string | null;
  created_at: Date;
  updated_at: Date;
}

const USER_ROW_FIELDS =
  "id, github_id, github_login, username, name, avatar_url, verified, contact_email, contact_x, contact_github_url, created_at, updated_at";
const USER_ROW_SELECT = `users.${USER_ROW_FIELDS.replace(/, /g, ", users.")}`;

export interface OrgRow {
  id: string;
  slug: string;
  name: string;
  owner_user_id: string;
  created_at: Date;
}

export interface PackageReservationRow {
  id: string;
  name: string;
  org_id: string;
  owner_user_id: string;
  created_at: Date;
}

export interface PublishTokenRow {
  id: string;
  package_name: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
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
      PRIMARY KEY (org_id, user_id)
    );
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_publish_tokens_hash ON publish_tokens (token_hash);
    CREATE INDEX IF NOT EXISTS idx_publish_tokens_expires_at ON publish_tokens (expires_at);

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
  `);
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

export async function backfillMissingUsernames(pool: pg.Pool): Promise<void> {
  const missing = await pool.query<Pick<UserRow, "id" | "github_login">>(
    `SELECT id, github_login FROM users WHERE username IS NULL`,
  );
  for (const row of missing.rows) {
    const username = await allocateUsername(pool, row.github_login);
    await pool.query(`UPDATE users SET username = $2, updated_at = NOW() WHERE id = $1`, [row.id, username]);
  }
}

export async function ensureUserUsername(pool: pg.Pool, user: UserRow): Promise<UserRow> {
  if (user.username) return user;
  const username = await allocateUsername(pool, user.github_login);
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
  row: Omit<PackageVersionRow, "id" | "created_at">,
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
    `SELECT id, name, version, manifest, integrity, blob_path, size_bytes, created_at
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
  let where = "";

  if (normalizedQuery) {
    values.push(`%${normalizedQuery}%`);
    where = `
      WHERE name ILIKE $1
        OR version ILIKE $1
        OR manifest->>'description' ILIKE $1
        OR manifest->>'type' ILIKE $1
        OR (manifest->'targets')::text ILIKE $1
    `;
  }

  if (options.cursor) {
    values.push(options.cursor);
    where += where ? ` AND created_at < $${values.length}` : ` WHERE created_at < $${values.length}`;
  }

  values.push(limit);
  const result = await pool.query<PackageVersionRow>(
    `SELECT id, name, version, manifest, integrity, blob_path, size_bytes, created_at
     FROM package_versions
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
       RETURNING id, slug, name, owner_user_id, created_at`,
      [org.slug, org.name, org.ownerUserId],
    );
    const created = result.rows[0]!;
    await client.query(
      `INSERT INTO org_memberships (org_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [created.id, org.ownerUserId],
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

export async function listUserOrgs(pool: pg.Pool, userId: string): Promise<OrgRow[]> {
  const result = await pool.query<OrgRow>(
    `SELECT orgs.id, orgs.slug, orgs.name, orgs.owner_user_id, orgs.created_at
     FROM org_memberships
     JOIN orgs ON orgs.id = org_memberships.org_id
     WHERE org_memberships.user_id = $1
     ORDER BY orgs.created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function getOrgBySlug(pool: pg.Pool, slug: string): Promise<OrgRow | null> {
  const result = await pool.query<OrgRow>(
    `SELECT id, slug, name, owner_user_id, created_at
     FROM orgs
     WHERE slug = $1`,
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function reservePackageName(
  pool: pg.Pool,
  reservation: { name: string; orgId: string; ownerUserId: string },
): Promise<PackageReservationRow> {
  const result = await pool.query<PackageReservationRow>(
    `INSERT INTO package_reservations (name, org_id, owner_user_id)
     VALUES ($1, $2, $3)
     RETURNING id, name, org_id, owner_user_id, created_at`,
    [reservation.name, reservation.orgId, reservation.ownerUserId],
  );
  return result.rows[0]!;
}

export async function listOrgPackageReservations(
  pool: pg.Pool,
  orgId: string,
): Promise<PackageReservationRow[]> {
  const result = await pool.query<PackageReservationRow>(
    `SELECT id, name, org_id, owner_user_id, created_at
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
    `SELECT id, slug, name, owner_user_id, created_at
     FROM orgs
     WHERE slug = $1 AND owner_user_id = $2`,
    [slug, userId],
  );
  return result.rows[0] ?? null;
}

export async function getPackageReservationByName(
  pool: pg.Pool,
  name: string,
): Promise<PackageReservationRow | null> {
  const result = await pool.query<PackageReservationRow>(
    `SELECT id, name, org_id, owner_user_id, created_at
     FROM package_reservations
     WHERE name = $1`,
    [name],
  );
  return result.rows[0] ?? null;
}

export async function getOwnedPackageReservation(
  pool: pg.Pool,
  name: string,
  userId: string,
): Promise<PackageReservationRow | null> {
  const result = await pool.query<PackageReservationRow>(
    `SELECT id, name, org_id, owner_user_id, created_at
     FROM package_reservations
     WHERE name = $1 AND owner_user_id = $2`,
    [name, userId],
  );
  return result.rows[0] ?? null;
}

export async function createPublishToken(
  pool: pg.Pool,
  token: { packageName: string; userId: string; tokenHash: string; expiresAt: Date },
): Promise<PublishTokenRow> {
  const result = await pool.query<PublishTokenRow>(
    `INSERT INTO publish_tokens (package_name, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, package_name, user_id, token_hash, expires_at, created_at`,
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
    `SELECT id, package_name, user_id, token_hash, expires_at, created_at
     FROM publish_tokens
     WHERE token_hash = $1 AND package_name = $2 AND expires_at > NOW()`,
    [tokenHash, packageName],
  );
  return result.rows[0] ?? null;
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
     WHERE package_reservations.name = $1`,
    [packageName],
  );
  return result.rows[0] ?? null;
}

export type InternalStats = {
  users: number;
  orgs: number;
  reservedPackages: number;
  publishedPackages: number;
  publishedVersions: number;
  recentUsers: Array<{ username: string; githubLogin: string; name: string | null; createdAt: string }>;
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
        (SELECT COUNT(*)::text FROM orgs) AS orgs,
        (SELECT COUNT(*)::text FROM package_reservations) AS reserved_packages,
        (SELECT COUNT(DISTINCT name)::text FROM package_versions) AS published_packages,
        (SELECT COUNT(*)::text FROM package_versions) AS published_versions
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
       ORDER BY created_at DESC
       LIMIT 10`,
    ),
    pool.query<Pick<PackageVersionRow, "name" | "version" | "created_at">>(
      `SELECT name, version, created_at
       FROM package_versions
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
    `SELECT id, name, version, manifest, integrity, blob_path, size_bytes, created_at
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
