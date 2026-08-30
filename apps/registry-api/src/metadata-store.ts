import type { PackageManifest } from "@aipm-registry/schemas";

export interface PackageVersionRow {
  id: string;
  name: string;
  version: string;
  manifest: PackageManifest;
  integrity: string;
  blob_path: string;
  size_bytes: number;
  created_at: Date;
  yanked_at?: Date | null;
}

export type PackageVersionInsert = Omit<PackageVersionRow, "id" | "created_at">;
export type PackageVersionSummary = Pick<
  PackageVersionRow,
  "name" | "version" | "manifest" | "integrity" | "size_bytes" | "created_at" | "yanked_at"
>;

export class DuplicateVersionError extends Error {
  readonly code = "23505";
  constructor(name: string, version: string) {
    super(`Version already published: ${name}@${version}`);
    this.name = "DuplicateVersionError";
  }
}

export function selectLatestPackageVersions<T extends { name: string; created_at: Date }>(
  rows: T[],
): T[] {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const current = latest.get(row.name);
    if (!current || row.created_at.getTime() > current.created_at.getTime()) {
      latest.set(row.name, row);
    }
  }
  return [...latest.values()];
}

export interface MetadataStore {
  readonly backend: "postgres" | "file";
  init(): Promise<void>;
  insert(row: PackageVersionInsert): Promise<void>;
  get(name: string, version: string): Promise<PackageVersionRow | null>;
  list(query?: string, options?: { limit?: number; cursor?: string }): Promise<PackageVersionSummary[]>;
  listVersions(name: string): Promise<PackageVersionRow[]>;
  deletePackage(name: string): Promise<PackageVersionRow[]>;
  health(): Promise<void>;
}
