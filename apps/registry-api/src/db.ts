import pg from "pg";
import type { PackageManifest } from "@aipm/schemas";

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
  `);
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
