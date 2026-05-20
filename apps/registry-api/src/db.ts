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
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
