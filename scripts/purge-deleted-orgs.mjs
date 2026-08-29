#!/usr/bin/env node
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });
try {
  const result = await pool.query(
    `DELETE FROM orgs WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'`,
  );
  console.log(`Purged ${result.rowCount ?? 0} deleted org(s).`);
} finally {
  await pool.end();
}
