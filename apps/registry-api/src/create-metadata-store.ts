import { join } from "node:path";
import { FileMetadataStore } from "./metadata-file.js";
import { tryPostgresStore } from "./metadata-postgres.js";
import type { MetadataStore } from "./metadata-store.js";

const DEFAULT_DATABASE_URL = "postgresql://aipm:aipm@localhost:5432/aipm";

export async function createMetadataStore(dataDir: string): Promise<MetadataStore> {
  const forced = process.env.AIPM_METADATA_BACKEND?.toLowerCase();

  if (forced === "file") {
    const store = new FileMetadataStore(join(dataDir, "package-index.json"));
    await store.init();
    console.log(`Metadata backend: file (${join(dataDir, "package-index.json")})`);
    return store;
  }

  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

  if (forced !== "postgres") {
    const postgres = await tryPostgresStore(databaseUrl);
    if (postgres) {
      console.log("Metadata backend: postgres");
      return postgres;
    }
    console.warn(
      "Postgres not reachable; using file metadata store. Install Docker for Postgres, or set AIPM_METADATA_BACKEND=file.",
    );
  } else {
    const postgres = await tryPostgresStore(databaseUrl);
    if (postgres) {
      console.log("Metadata backend: postgres");
      return postgres;
    }
    throw new Error(`AIPM_METADATA_BACKEND=postgres but cannot connect to ${databaseUrl}`);
  }

  const fileStore = new FileMetadataStore(join(dataDir, "package-index.json"));
  await fileStore.init();
  console.log(`Metadata backend: file (${join(dataDir, "package-index.json")})`);
  return fileStore;
}
