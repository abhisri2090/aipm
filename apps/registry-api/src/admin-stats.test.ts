import {
  createOrg,
  createPool,
  ensureSchema,
  getInternalStats,
  insertPackageVersion,
  reservePackageName,
  upsertGithubUser,
  yankPackageVersion,
} from "./db.js";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

describe.skipIf(!databaseUrl)("admin internal stats", () => {
  it("counts users and active published skills, excluding yanked versions", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const suffix = unique();
    const owner = await upsertGithubUser(pool, {
      githubId: `stats-owner-${suffix}`,
      githubLogin: `stats-owner-${suffix}`,
    });
    const org = await createOrg(pool, {
      slug: `stats-org-${suffix}`,
      name: "Stats Org",
      ownerUserId: owner.id,
    });
    const packageName = `@stats-org-${suffix}/skill`;
    await reservePackageName(pool, {
      name: packageName,
      orgId: org.id,
      ownerUserId: owner.id,
    });
    const manifest = {
      schemaVersion: "0.1" as const,
      type: "skill" as const,
      name: packageName,
      version: "1.0.0",
      description: "Stats test skill",
      entry: "SKILL.md",
      targets: ["cursor" as const],
    };
    await insertPackageVersion(pool, {
      name: packageName,
      version: "1.0.0",
      manifest,
      integrity: "sha256:abc",
      blob_path: "blob/path",
      size_bytes: 10,
    });
    await insertPackageVersion(pool, {
      name: packageName,
      version: "1.0.1",
      manifest: { ...manifest, version: "1.0.1" },
      integrity: "sha256:def",
      blob_path: "blob/path2",
      size_bytes: 12,
    });

    const beforeYank = await getInternalStats(pool);
    expect(beforeYank.users).toBeGreaterThanOrEqual(1);
    expect(beforeYank.publishedPackages).toBeGreaterThanOrEqual(1);
    expect(beforeYank.publishedVersions).toBeGreaterThanOrEqual(2);

    await yankPackageVersion(pool, packageName, "1.0.1");
    const afterYank = await getInternalStats(pool);
    expect(afterYank.publishedPackages).toBeGreaterThanOrEqual(1);
    expect(afterYank.publishedVersions).toBe(beforeYank.publishedVersions - 1);

    await pool.end();
  });
});
