import {
  createOrg,
  createPool,
  ensureSchema,
  getPackageReservationByName,
  listOrgAuditEvents,
  purgeDeletedOrgs,
  reservePackageName,
  softDeleteOrg,
  updateOrgSettings,
  updatePackageVisibility,
  upsertGithubUser,
} from "./db.js";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

describe.skipIf(!databaseUrl)("org settings and visibility", () => {
  it("inherits org default visibility and allows overrides", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const suffix = unique();
    const owner = await upsertGithubUser(pool, {
      githubId: `vis-owner-${suffix}`,
      githubLogin: `vis-owner-${suffix}`,
    });
    const org = await createOrg(pool, {
      slug: `vis-org-${suffix}`,
      name: "Visibility Org",
      ownerUserId: owner.id,
    });
    await updateOrgSettings(pool, org.id, { defaultPackageVisibility: "private" });

    const inherited = await reservePackageName(pool, {
      name: `@vis-org-${suffix}/inherited`,
      orgId: org.id,
      ownerUserId: owner.id,
    });
    expect(inherited.visibility).toBe("private");

    const explicit = await reservePackageName(pool, {
      name: `@vis-org-${suffix}/public-one`,
      orgId: org.id,
      ownerUserId: owner.id,
      visibility: "public",
    });
    expect(explicit.visibility).toBe("public");

    const updated = await updatePackageVisibility(pool, explicit.name, "private");
    expect(updated?.visibility).toBe("private");

    await pool.end();
  });

  it("soft deletes orgs and purges after retention window", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const suffix = unique();
    const owner = await upsertGithubUser(pool, {
      githubId: `del-owner-${suffix}`,
      githubLogin: `del-owner-${suffix}`,
    });
    const org = await createOrg(pool, {
      slug: `del-org-${suffix}`,
      name: "Delete Org",
      ownerUserId: owner.id,
    });
    await reservePackageName(pool, {
      name: `@del-org-${suffix}/pkg`,
      orgId: org.id,
      ownerUserId: owner.id,
    });

    expect(await softDeleteOrg(pool, org.id)).toBe(true);
    expect(await getPackageReservationByName(pool, `@del-org-${suffix}/pkg`)).toBeTruthy();

    await pool.query(`UPDATE orgs SET deleted_at = NOW() - INTERVAL '31 days' WHERE id = $1`, [org.id]);
    const purged = await purgeDeletedOrgs(pool);
    expect(purged).toBeGreaterThanOrEqual(1);

    await pool.end();
  });

  it("records settings audit events via API helpers indirectly", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const suffix = unique();
    const owner = await upsertGithubUser(pool, {
      githubId: `audit-owner-${suffix}`,
      githubLogin: `audit-owner-${suffix}`,
    });
    const org = await createOrg(pool, {
      slug: `audit-org-${suffix}`,
      name: "Audit Org",
      ownerUserId: owner.id,
    });
    await updateOrgSettings(pool, org.id, {
      description: "Test org",
      inviteTtlHours: 24,
      defaultMemberRole: "viewer",
    });
    const events = await listOrgAuditEvents(pool, org.id);
    expect(events.some((event) => event.event_type === "org.created")).toBe(true);
    await pool.end();
  });
});
