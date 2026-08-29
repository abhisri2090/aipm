import { createPool, ensureSchema } from "./db.js";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("email auth schema", () => {
  it("creates users email-auth columns, constraints, and tables", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);

    const columns = await pool.query<{ column_name: string; is_nullable: string }>(
      `SELECT column_name, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users'
         AND column_name IN ('auth_provider', 'primary_email', 'primary_email_verified_at', 'github_id', 'github_login')
       ORDER BY column_name`,
    );
    expect(columns.rows).toEqual(
      expect.arrayContaining([
        { column_name: "auth_provider", is_nullable: "NO" },
        { column_name: "github_id", is_nullable: "YES" },
        { column_name: "github_login", is_nullable: "YES" },
        { column_name: "primary_email", is_nullable: "YES" },
        { column_name: "primary_email_verified_at", is_nullable: "YES" },
      ]),
    );

    const identityCheck = await pool.query<{ conname: string }>(
      `SELECT conname
       FROM pg_constraint
       WHERE conrelid = 'users'::regclass AND conname = 'users_identity_check'`,
    );
    expect(identityCheck.rows).toHaveLength(1);

    const authProviderCheck = await pool.query<{ conname: string }>(
      `SELECT conname
       FROM pg_constraint
       WHERE conrelid = 'users'::regclass AND conname = 'users_auth_provider_check'`,
    );
    expect(authProviderCheck.rows).toHaveLength(1);

    const primaryEmailIndex = await pool.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes
       WHERE tablename = 'users' AND indexname = 'idx_users_primary_email'`,
    );
    expect(primaryEmailIndex.rows).toHaveLength(1);

    const challengeTable = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_email_challenges'`,
    );
    expect(challengeTable.rows).toHaveLength(1);

    const challengeIndexes = await pool.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes
       WHERE tablename = 'auth_email_challenges'
         AND indexname IN ('idx_auth_email_challenges_email', 'idx_auth_email_challenges_expires')`,
    );
    expect(challengeIndexes.rows).toHaveLength(2);

    const eventsTable = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_events'`,
    );
    expect(eventsTable.rows).toHaveLength(1);

    await pool.end();
  });
});
