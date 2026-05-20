import type { PackageManifest } from "@aipm/schemas";

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

export type PackageVersionInsert = Omit<PackageVersionRow, "id" | "created_at">;

export class DuplicateVersionError extends Error {
  readonly code = "23505";
  constructor(name: string, version: string) {
    super(`Version already published: ${name}@${version}`);
    this.name = "DuplicateVersionError";
  }
}

export interface MetadataStore {
  readonly backend: "postgres" | "file";
  init(): Promise<void>;
  insert(row: PackageVersionInsert): Promise<void>;
  get(name: string, version: string): Promise<PackageVersionRow | null>;
}
