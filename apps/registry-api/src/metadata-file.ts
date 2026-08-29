import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { PackageManifestSchema } from "@aipm-registry/schemas";
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

  async list(
    query = "",
    options: { limit?: number; cursor?: string } = {},
  ): Promise<PackageVersionRow[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const limit = options.limit ?? 100;
    const cursorTime = options.cursor ? new Date(options.cursor).getTime() : null;
    const index = await this.readIndex();
    const rows: PackageVersionRow[] = [];

    for (const [name, versions] of Object.entries(index.packages)) {
      for (const [version, entry] of Object.entries(versions)) {
        const manifest = PackageManifestSchema.parse(entry.manifest);
        const examples = manifest.examples?.flatMap((example) => [
          example.title,
          example.description ?? "",
          example.prompt,
        ]) ?? [];
        const haystack = [
          name,
          version,
          manifest.description,
          manifest.type,
          manifest.usage ?? "",
          manifest.agentDescription ?? "",
          manifest.sourceUrl ?? "",
          manifest.releaseNotes ?? "",
          ...manifest.targets,
          ...(manifest.tags ?? []),
          ...(manifest.categories ?? []),
          ...examples,
        ]
          .join(" ")
          .toLowerCase();

        const createdAt = new Date(entry.created_at);
        if (normalizedQuery && !haystack.includes(normalizedQuery)) continue;
        if (cursorTime && createdAt.getTime() >= cursorTime) continue;

        rows.push({
          id: randomUUID(),
          name,
          version,
          manifest,
          integrity: entry.integrity,
          blob_path: entry.blob_path,
          size_bytes: entry.size_bytes,
          created_at: createdAt,
        });
      }
    }

    return rows
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  async deletePackage(name: string): Promise<PackageVersionRow[]> {
    const index = await this.readIndex();
    const versions = index.packages[name];
    if (!versions) return [];
    const deleted: PackageVersionRow[] = [];
    for (const [version, entry] of Object.entries(versions)) {
      deleted.push({
        id: randomUUID(),
        name,
        version,
        manifest: PackageManifestSchema.parse(entry.manifest),
        integrity: entry.integrity,
        blob_path: entry.blob_path,
        size_bytes: entry.size_bytes,
        created_at: new Date(entry.created_at),
      });
    }
    delete index.packages[name];
    await this.writeIndex(index);
    return deleted;
  }

  async health(): Promise<void> {
    await this.readIndex();
  }
}
