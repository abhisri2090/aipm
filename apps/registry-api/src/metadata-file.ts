import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { PackageManifestSchema } from "@aipm/schemas";
import {
  DuplicateVersionError,
  type MetadataStore,
  type PackageVersionInsert,
  type PackageVersionRow,
} from "./metadata-store.js";

interface FileIndexEntry {
  manifest: unknown;
  integrity: string;
  blob_path: string;
  size_bytes: number;
  created_at: string;
}

interface FileIndex {
  packages: Record<string, Record<string, FileIndexEntry>>;
}

export class FileMetadataStore implements MetadataStore {
  readonly backend = "file" as const;

  constructor(private readonly indexPath: string) {}

  async init(): Promise<void> {
    try {
      await readFile(this.indexPath, "utf8");
    } catch {
      await this.writeIndex({ packages: {} });
    }
  }

  private async readIndex(): Promise<FileIndex> {
    const raw = await readFile(this.indexPath, "utf8");
    return JSON.parse(raw) as FileIndex;
  }

  private async writeIndex(index: FileIndex): Promise<void> {
    await writeFile(this.indexPath, JSON.stringify(index, null, 2) + "\n", "utf8");
  }

  async insert(row: PackageVersionInsert): Promise<void> {
    const index = await this.readIndex();
    if (!index.packages[row.name]) index.packages[row.name] = {};
    if (index.packages[row.name][row.version]) {
      throw new DuplicateVersionError(row.name, row.version);
    }
    index.packages[row.name][row.version] = {
      manifest: row.manifest,
      integrity: row.integrity,
      blob_path: row.blob_path,
      size_bytes: row.size_bytes,
      created_at: new Date().toISOString(),
    };
    await this.writeIndex(index);
  }

  async get(name: string, version: string): Promise<PackageVersionRow | null> {
    const index = await this.readIndex();
    const entry = index.packages[name]?.[version];
    if (!entry) return null;
    return {
      id: randomUUID(),
      name,
      version,
      manifest: PackageManifestSchema.parse(entry.manifest),
      integrity: entry.integrity,
      blob_path: entry.blob_path,
      size_bytes: entry.size_bytes,
      created_at: new Date(entry.created_at),
    };
  }
}
