import { createPool, ensureSchema, getLatestContentHash, queueImportNotification, upsertGithubUser, upsertProvenance } from "./db.js";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("db import helpers", () => {
  it("migrates schema idempotently and upserts verified state", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    await ensureSchema(pool);

    const imported = await upsertGithubUser(pool, {
      githubId: "import-test-1",
      githubLogin: "ImportTestUser",
      name: "Import Test",
      verified: false,
      contact: {
        email: "import@test.example",
        xHandle: "importtest",
        githubUrl: "https://github.com/importtest",
      },
    });
    expect(imported.verified).toBe(false);
    expect(imported.contact_email).toBe("import@test.example");

    const claimed = await upsertGithubUser(pool, {
      githubId: "import-test-1",
      githubLogin: "ImportTestUser",
      verified: true,
    });
    expect(claimed.verified).toBe(true);

    await upsertProvenance(pool, {
      name: "@importtest/sample",
      version: "1.0.0",
      source_url: "https://github.com/importtest/skills/tree/main/sample",
      source_commit_sha: "abc123",
      source_license: "Apache-2.0",
      content_hash: "hash-v1",
    });
    expect(await getLatestContentHash(pool, "@importtest/sample")).toBe("hash-v1");

    const notification = await queueImportNotification(pool, {
      userId: claimed.id,
      packageName: "@importtest/sample",
    });
    expect(notification.status).toBe("pending");

    await pool.end();
  });
});
