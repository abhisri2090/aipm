import type pg from "pg";
import type { MetadataStore } from "./metadata-store.js";
import type { BlobStorage } from "./storage.js";
import {
  buildGitHubTreeUrl,
  importSkillFromGitHubUrl,
  listGitHubSubfolders,
  parseGitHubFolderUrl,
  type ImportFromUrlResult,
} from "./import-from-github.js";

export const DEFAULT_BULK_IMPORT_MAX_SKILLS = 50;

export type BulkImportFromUrlResult = {
  parentUrl: string;
  subfolders: string[];
  results: Array<ImportFromUrlResult & { subfolder: string }>;
  summary: { published: number; skipped: number; failed: number };
  aborted?: { subfolder: string; error: string };
};

export async function bulkImportSkillsFromGitHubFolder(options: {
  pool: pg.Pool;
  metadata: MetadataStore;
  storage: BlobStorage;
  sourceUrl: string;
  githubToken?: string;
  maxSkills?: number;
}): Promise<BulkImportFromUrlResult> {
  const token = options.githubToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const parentUrl = options.sourceUrl.trim();
  const parsed = parseGitHubFolderUrl(parentUrl);
  const maxSkills = options.maxSkills ?? DEFAULT_BULK_IMPORT_MAX_SKILLS;

  const subfolders = await listGitHubSubfolders(parsed, token);
  if (subfolders.length > maxSkills) {
    throw new Error(`Too many subfolders (${subfolders.length}); max is ${maxSkills}`);
  }

  const results: Array<ImportFromUrlResult & { subfolder: string }> = [];
  let published = 0;
  let skipped = 0;

  for (const subfolder of subfolders) {
    const childUrl = buildGitHubTreeUrl(parsed, subfolder);
    try {
      const result = await importSkillFromGitHubUrl({
        pool: options.pool,
        metadata: options.metadata,
        storage: options.storage,
        sourceUrl: childUrl,
        githubToken: token,
      });
      results.push({ ...result, subfolder });
      if (result.action === "published") {
        published += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        parentUrl,
        subfolders,
        results,
        summary: { published, skipped, failed: 1 },
        aborted: { subfolder, error: message },
      };
    }
  }

  return {
    parentUrl,
    subfolders,
    results,
    summary: { published, skipped, failed: 0 },
  };
}
