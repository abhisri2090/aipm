import type pg from "pg";
import {
  createPool,
  ensureSchema,
  getPackageVersion,
  insertPackageVersion,
} from "./db.js";
import {
  DuplicateVersionError,
  type MetadataStore,
  type PackageVersionInsert,
  type PackageVersionRow,
} from "./metadata-store.js";

export class PostgresMetadataStore implements MetadataStore {
  readonly backend = "postgres" as const;
  private readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = createPool(connectionString);
  }

  async init(): Promise<void> {
    await ensureSchema(this.pool);
  }

  async insert(row: PackageVersionInsert): Promise<void> {
    try {
      await insertPackageVersion(this.pool, row);
    } catch (e: unknown) {
      const pgErr = e as { code?: string };
      if (pgErr.code === "23505") {
        throw new DuplicateVersionError(row.name, row.version);
      }
      throw e;
    }
  }

  async get(name: string, version: string): Promise<PackageVersionRow | null> {
    return getPackageVersion(this.pool, name, version);
  }
}

export async function tryPostgresStore(
  connectionString: string,
): Promise<PostgresMetadataStore | null> {
  const store = new PostgresMetadataStore(connectionString);
  try {
    await store.init();
    return store;
  } catch {
    return null;
  }
}
