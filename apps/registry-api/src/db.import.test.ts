import {
  acceptOrgInvite,
  createOrg,
  createOrgInvite,
  createPool,
  ensureSchema,
  getLatestContentHash,
  getOrgMembership,
  getPackageReservationForUser,
  listOrgAuditEvents,
  listOrgInvites,
  listOrgMembers,
  queueImportNotification,
  reservePackageName,
  setPackageMaintainer,
  transferOrgOwnership,
  updateOrgMemberRole,
  upsertGithubUser,
  upsertProvenance,
} from "./db.js";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

describe.skipIf(!databaseUrl)("db import helpers", () => {
  it("migrates schema idempotently and upserts verified state", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    await ensureSchema(pool);
    const suffix = unique();

    const imported = await upsertGithubUser(pool, {
      githubId: `import-test-${suffix}`,
      githubLogin: `ImportTestUser-${suffix}`,
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
      githubId: `import-test-${suffix}`,
      githubLogin: `ImportTestUser-${suffix}`,
      verified: true,
    });
    expect(claimed.verified).toBe(true);

    await upsertProvenance(pool, {
      name: `@importtest-${suffix}/sample`,
      version: "1.0.0",
      source_url: "https://github.com/importtest/skills/tree/main/sample",
      source_commit_sha: "abc123",
      source_license: "Apache-2.0",
      content_hash: "hash-v1",
    });
    expect(await getLatestContentHash(pool, `@importtest-${suffix}/sample`)).toBe("hash-v1");

    const notification = await queueImportNotification(pool, {
      userId: claimed.id,
      packageName: `@importtest-${suffix}/sample`,
    });
    expect(notification.status).toBe("pending");

    await pool.end();
  });

  it("supports org invites, role changes, ownership transfer, and package maintainer access", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    await ensureSchema(pool);
    const suffix = unique();

    const owner = await upsertGithubUser(pool, {
      githubId: `owner-${suffix}`,
      githubLogin: `owner-${suffix}`,
      name: "Owner",
    });
    const teammate = await upsertGithubUser(pool, {
      githubId: `teammate-${suffix}`,
      githubLogin: `teammate-${suffix}`,
      name: "Teammate",
    });
    const org = await createOrg(pool, {
      slug: `team-${suffix}`.replace(/[^a-z0-9-]/g, "-"),
      name: "Team",
      ownerUserId: owner.id,
    });
    const invite = await createOrgInvite(pool, {
      orgId: org.id,
      invitedGithubLogin: teammate.github_login,
      role: "member",
      tokenHash: `hash-${suffix}`,
      expiresAt: new Date(Date.now() + 60_000),
      invitedByUserId: owner.id,
    });

    expect((await listOrgInvites(pool, org.id))[0]).toMatchObject({ id: invite.id, status: "pending" });
    await acceptOrgInvite(pool, invite, teammate.id);
    expect(await getOrgMembership(pool, org.id, teammate.id)).toMatchObject({ role: "member" });

    await updateOrgMemberRole(pool, { orgId: org.id, userId: teammate.id, role: "admin" });
    expect((await listOrgMembers(pool, org.id)).map((member) => member.role)).toContain("admin");

    const reserved = await reservePackageName(pool, {
      name: `@${org.slug}/review-helper`,
      orgId: org.id,
      ownerUserId: owner.id,
    });
    await setPackageMaintainer(pool, {
      packageName: reserved.name,
      userId: teammate.id,
      createdByUserId: owner.id,
    });
    expect(await getPackageReservationForUser(pool, reserved.name, teammate.id)).toMatchObject({
      org_role: "admin",
      package_role: "maintainer",
    });

    await transferOrgOwnership(pool, { orgId: org.id, fromUserId: owner.id, toUserId: teammate.id });
    expect(await getOrgMembership(pool, org.id, teammate.id)).toMatchObject({ role: "owner" });
    expect(await getOrgMembership(pool, org.id, owner.id)).toMatchObject({ role: "admin" });
    expect((await listOrgAuditEvents(pool, org.id)).map((event) => event.event_type)).toContain("package.reserved");

    await pool.end();
  });
});
