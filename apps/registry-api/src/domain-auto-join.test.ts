import {
  addOrgMember,
  confirmEmailVerification,
  createEmailUser,
  createEmailVerification,
  createOrg,
  createPool,
  ensureSchema,
  getActiveEmailVerification,
  incrementEmailVerificationAttempts,
  listJoinableOrgsByDomain,
  updateOrgSettings,
  upsertGithubUser,
} from "./db.js";
import { getVerifiedUserEmail } from "./email-auth.js";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

describe.skipIf(!databaseUrl)("domain auto-join", () => {
  it("verifies an email and exposes joinable orgs by domain", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const suffix = unique();
    const owner = await upsertGithubUser(pool, {
      githubId: `aj-owner-${suffix}`,
      githubLogin: `aj-owner-${suffix}`,
    });
    const joiner = await upsertGithubUser(pool, {
      githubId: `aj-joiner-${suffix}`,
      githubLogin: `aj-joiner-${suffix}`,
    });
    const org = await createOrg(pool, {
      slug: `aj-org-${suffix}`,
      name: "Auto Join Org",
      ownerUserId: owner.id,
    });
    const domain = `aj-${suffix}.example.com`;
    await updateOrgSettings(pool, org.id, { autoJoinDomain: domain, defaultMemberRole: "viewer" });

    const verification = await createEmailVerification(pool, {
      userId: joiner.id,
      email: `person@${domain}`,
      codeHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await incrementEmailVerificationAttempts(pool, verification.id)).toBe(1);
    const active = await getActiveEmailVerification(pool, joiner.id);
    expect(active?.id).toBe(verification.id);

    const verifiedUser = await confirmEmailVerification(pool, {
      verificationId: verification.id,
      userId: joiner.id,
      email: verification.email,
    });
    expect(verifiedUser.contact_email).toBe(`person@${domain}`);
    expect(verifiedUser.contact_email_verified_at).toBeTruthy();
    expect(await getActiveEmailVerification(pool, joiner.id)).toBeNull();

    const joinable = await listJoinableOrgsByDomain(pool, joiner.id, domain);
    expect(joinable.map((row) => row.id)).toContain(org.id);

    expect(await addOrgMember(pool, { orgId: org.id, userId: joiner.id, role: "viewer" })).toBe(true);
    expect(await addOrgMember(pool, { orgId: org.id, userId: joiner.id, role: "viewer" })).toBe(false);
    expect(await listJoinableOrgsByDomain(pool, joiner.id, domain)).toHaveLength(0);

    await pool.end();
  });

  it("lets email-auth users auto-join with primary email", async () => {
    const pool = createPool(databaseUrl!);
    await ensureSchema(pool);
    const suffix = unique();
    const owner = await upsertGithubUser(pool, {
      githubId: `aj-email-owner-${suffix}`,
      githubLogin: `aj-email-owner-${suffix}`,
    });
    const domain = `aj-email-${suffix}.example.com`;
    const joiner = await createEmailUser(pool, { email: `person@${domain}` });
    const org = await createOrg(pool, {
      slug: `aj-email-org-${suffix}`,
      name: "Email Auto Join Org",
      ownerUserId: owner.id,
    });
    await updateOrgSettings(pool, org.id, { autoJoinDomain: domain, defaultMemberRole: "member" });

    expect(getVerifiedUserEmail(joiner)).toBe(`person@${domain}`);
    const joinable = await listJoinableOrgsByDomain(pool, joiner.id, domain);
    expect(joinable.map((row) => row.id)).toContain(org.id);
    expect(await addOrgMember(pool, { orgId: org.id, userId: joiner.id, role: "member" })).toBe(true);

    await pool.end();
  });
});
