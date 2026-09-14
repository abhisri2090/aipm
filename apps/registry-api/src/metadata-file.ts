import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { PackageManifestSchema } from "@aipm-registry/schemas";
import {
  DuplicateVersionError,
  selectLatestPackageVersions,
  type MetadataStore,
  type PackageListOptions,
  type PackageVersionInsert,
  type PackageVersionRow,
} from "./metadata-store.js";

interface FileIndexEntry {
  manifest: unknown;
  integrity: string;
  blob_path: string;
  size_bytes: number;
  created_at: string;
  scan_status?: PackageVersionRow["scan_status"];
  scan_findings?: PackageVersionRow["scan_findings"];
  scan_checks_performed?: PackageVersionRow["scan_checks_performed"];
  scanned_at?: string | null;
  scanner_version?: string | null;
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
      scan_status: row.scan_status,
      scan_findings: row.scan_findings,
      scan_checks_performed: row.scan_checks_performed,
      scanned_at: row.scanned_at ? row.scanned_at.toISOString() : null,
      scanner_version: row.scanner_version,
    };
    await this.writeIndex(index);
  }

  async get(name: string, version: string): Promise<PackageVersionRow | null> {
    const index = await this.readIndex();
    const entry = index.packages[name]?.[version];
    if (!entry) return null;
    return this.toRow(name, version, entry);
  }

  private toRow(name: string, version: string, entry: FileIndexEntry): PackageVersionRow {
    return {
      id: randomUUID(),
      name,
      version,
      manifest: PackageManifestSchema.parse(entry.manifest),
      integrity: entry.integrity,
      blob_path: entry.blob_path,
      size_bytes: entry.size_bytes,
      created_at: new Date(entry.created_at),
      // Legacy index entries may omit scan fields entirely.
      scan_status: entry.scan_status ?? "not_scanned",
      scan_findings: entry.scan_findings ?? [],
      scan_checks_performed: entry.scan_checks_performed ?? [],
      scanned_at: entry.scanned_at ? new Date(entry.scanned_at) : null,
      scanner_version: entry.scanner_version ?? null,
    };
  }

  async list(query = "", options: PackageListOptions = {}): Promise<PackageVersionRow[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const limit = options.limit ?? 100;
    const sort = options.sort ?? "newest";
    const useCursor = sort === "newest";
    const cursorTime = useCursor && options.cursor ? new Date(options.cursor).getTime() : null;
    const category = options.category?.trim().toLowerCase();
    const target = options.target?.trim().toLowerCase();
    const index = await this.readIndex();
    const rows: PackageVersionRow[] = [];
    const haystacks = new Map<string, string>();

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

        rows.push(this.toRow(name, version, entry));
        haystacks.set(`${name}@${version}`, haystack);
      }
    }

    const filtered = selectLatestPackageVersions(rows).filter((row) => {
      if (normalizedQuery && !haystacks.get(`${row.name}@${row.version}`)?.includes(normalizedQuery)) {
        return false;
      }
      if (category && category !== "all" && !row.manifest.categories?.some((item) => item.toLowerCase() === category)) {
        return false;
      }
      if (
        target &&
        target !== "all" &&
        !row.manifest.targets.some((item) => item === target || item === "*")
      ) {
        return false;
      }
      return !cursorTime || row.created_at.getTime() < cursorTime;
    });

    if (sort === "title") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    const offset = !useCursor ? Math.max(options.offset ?? 0, 0) : 0;
    return filtered.slice(offset, offset + limit);
  }

  async listVersions(name: string): Promise<PackageVersionRow[]> {
    const index = await this.readIndex();
    const versions = index.packages[name];
    if (!versions) return [];
    return Object.entries(versions)
      .map(([version, entry]) => this.toRow(name, version, entry))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async deletePackage(name: string): Promise<PackageVersionRow[]> {
    const index = await this.readIndex();
    const versions = index.packages[name];
    if (!versions) return [];
    const deleted: PackageVersionRow[] = [];
    for (const [version, entry] of Object.entries(versions)) {
      deleted.push(this.toRow(name, version, entry));
    }
    delete index.packages[name];
    await this.writeIndex(index);
    return deleted;
  }

  async health(): Promise<void> {
    await this.readIndex();
  }
}
