import { join } from "node:path";
import { FileMetadataStore } from "./metadata-file.js";
import { PostgresMetadataStore } from "./metadata-postgres.js";
import { DuplicateVersionError } from "./metadata-store.js";

const dataDir = process.env.AIPM_DATA_DIR ?? "/var/lib/aipm";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(2);
}

const fileStore = new FileMetadataStore(join(dataDir, "package-index.json"));
const postgresStore = new PostgresMetadataStore(databaseUrl);

await fileStore.init();
await postgresStore.init();

const rows = await fileStore.list("", { limit: 100_000 });
let inserted = 0;
let skipped = 0;

for (const row of rows) {
  try {
    await postgresStore.insert({
      name: row.name,
      version: row.version,
      manifest: row.manifest,
      integrity: row.integrity,
      blob_path: row.blob_path,
      size_bytes: row.size_bytes,
    });
    inserted += 1;
  } catch (error) {
    if (error instanceof DuplicateVersionError) {
      skipped += 1;
      continue;
    }
    throw error;
  }
}

console.log(`Migrated file metadata to PostgreSQL: inserted=${inserted} skipped=${skipped}`);
