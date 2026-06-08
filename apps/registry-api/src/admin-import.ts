import { randomUUID } from "node:crypto";
import type pg from "pg";
import { isValidScopeName, parseScopeName } from "@aipm-registry/schemas";
import { normalizeUsernameCandidate } from "./aipm-username.js";
import {
  createOrg,
  getOrgBySlug,
  getPackageReservationByName,
  queueImportNotification,
  reservePackageName,
  upsertGithubUser,
  upsertProvenance,
  type UserRow,
} from "./db.js";
import { DuplicateVersionError } from "./metadata-store.js";
import { extractManifestFromTarball } from "./publish.js";
import type { MetadataStore } from "./metadata-store.js";
import type { BlobStorage } from "./storage.js";
import { blobKeyForPackage } from "./storage.js";

export { DuplicateVersionError };
export { getLatestContentHash, getOwnedPackageReservation } from "./db.js";

export type ImportAuthorPayload = {
  githubId: string;
  githubLogin: string;
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  xHandle?: string | null;
  githubUrl?: string | null;
};

export type ImportProvenancePayload = {
  sourceUrl: string;
  commitSha: string;
  license?: string | null;
  contentHash: string;
};

export function normalizeImportOrgSlug(githubLogin: string): string {
  return normalizeUsernameCandidate(githubLogin);
}

export function normalizeImportPackageName(orgSlug: string, skillName: string): string {
  const normalizedSkill = skillName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");
  const safeSkill = normalizedSkill || "skill";
  return `@${orgSlug}/${safeSkill}`;
}

export async function ensureImportAccount(
  pool: pg.Pool,
  author: ImportAuthorPayload,
): Promise<{ user: UserRow; orgSlug: string }> {
  const orgSlug = normalizeImportOrgSlug(author.githubLogin);
  const user = await upsertGithubUser(pool, {
    githubId: author.githubId,
    githubLogin: author.githubLogin,
    name: author.name ?? null,
    avatarUrl: author.avatarUrl ?? null,
    verified: false,
    contact: {
      email: author.email ?? null,
      xHandle: author.xHandle ?? null,
      githubUrl: author.githubUrl ?? null,
    },
  });

  let org = await getOrgBySlug(pool, orgSlug);
  if (!org) {
    org = await createOrg(pool, {
      slug: orgSlug,
      name: author.name?.trim() || author.githubLogin,
      ownerUserId: user.id,
    });
  } else if (org.owner_user_id !== user.id) {
    throw new Error(`Org @${orgSlug} is owned by another user`);
  }

  return { user, orgSlug };
}

export async function ensureImportReservation(
  pool: pg.Pool,
  user: UserRow,
  packageName: string,
  orgSlug: string,
): Promise<void> {
  if (!isValidScopeName(packageName)) {
    throw new Error("Invalid package name; use @org/name");
  }
  const parsed = parseScopeName(packageName);
  if (parsed.scope !== orgSlug) {
    throw new Error(`Package name must use @${orgSlug}/...`);
  }

  const existing = await getPackageReservationByName(pool, packageName);
  if (existing) {
    if (existing.owner_user_id !== user.id) {
      throw new Error("Package name is reserved by another user");
    }
    return;
  }

  const org = await getOrgBySlug(pool, orgSlug);
  if (!org) throw new Error("Org not found");
  await reservePackageName(pool, {
    name: packageName,
    orgId: org.id,
    ownerUserId: user.id,
  });
}

export async function importSkillPackage(options: {
  pool: pg.Pool;
  metadata: MetadataStore;
  storage: BlobStorage;
  tarball: Buffer;
  author: ImportAuthorPayload;
  provenance: ImportProvenancePayload;
}): Promise<{ name: string; version: string; integrity: string; userId: string }> {
  const { manifest, integrity } = await extractManifestFromTarball(options.tarball);
  const { user, orgSlug } = await ensureImportAccount(options.pool, options.author);
  await ensureImportReservation(options.pool, user, manifest.name, orgSlug);

  const blobPath = blobKeyForPackage(manifest.name, manifest.version);
  const tempBlobPath = `${blobPath}.tmp-${randomUUID()}`;
  let tempWritten = false;
  try {
    await options.storage.put(tempBlobPath, options.tarball);
    tempWritten = true;
    await options.metadata.insert({
      name: manifest.name,
      version: manifest.version,
      manifest,
      integrity,
      blob_path: blobPath,
      size_bytes: options.tarball.length,
    });
    await options.storage.copy(tempBlobPath, blobPath);
  } finally {
    if (tempWritten) await options.storage.delete(tempBlobPath).catch(() => undefined);
  }

  await upsertProvenance(options.pool, {
    name: manifest.name,
    version: manifest.version,
    source_url: options.provenance.sourceUrl,
    source_commit_sha: options.provenance.commitSha,
    source_license: options.provenance.license ?? null,
    content_hash: options.provenance.contentHash,
  });
  await queueImportNotification(options.pool, { userId: user.id, packageName: manifest.name });

  return { name: manifest.name, version: manifest.version, integrity, userId: user.id };
}
