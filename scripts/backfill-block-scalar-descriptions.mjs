#!/usr/bin/env node
/**
 * Backfill script for fixing YAML block scalar descriptions.
 *
 * This script finds packages whose stored description is '>' or '|' (or empty-ish)
 * because multi-line YAML block scalars in SKILL.md frontmatter weren't parsed correctly.
 * It re-derives the description from the stored tarball and updates the manifest.
 *
 * Usage:
 *   node scripts/backfill-block-scalar-descriptions.mjs           # dry-run (default)
 *   node scripts/backfill-block-scalar-descriptions.mjs --apply   # apply changes to database
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string (required)
 *   AZURE_STORAGE_CONNECTION_STRING - Azure blob storage connection (if using Azure)
 *   AIPM_DATA_DIR - Local data directory (if using filesystem storage)
 */

import pg from "pg";
import { parse as parseYaml } from "yaml";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createStorage } from "../apps/registry-api/dist/storage.js";

const execFileAsync = promisify(execFile);

const BROKEN_DESCRIPTIONS = [">", "|", ">-", "|-", "", "> ", "| "];
const MAX_DESCRIPTION_CHARS = 240;

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {};

  let parsed;
  try {
    parsed = parseYaml(match[1] ?? "");
  } catch {
    return {};
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {};
  }

  const fields = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string") {
      fields[key] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      fields[key] = String(value);
    }
  }
  return fields;
}

function truncateDescription(value) {
  const trimmed = value.trim();
  if (trimmed.length <= MAX_DESCRIPTION_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_CHARS - 3).trimEnd()}...`;
}

function resolveDescription({ frontmatter, readmeContent, fallbackName }) {
  let description;
  if (frontmatter.description?.trim()) {
    description = frontmatter.description.trim();
  } else if (frontmatter.name?.trim()) {
    description = frontmatter.name.trim();
  } else if (readmeContent) {
    const stripped = readmeContent.replace(/^---[\s\S]*?---\s*/m, "").trim();
    const firstLine = stripped.split("\n").find((line) => line.trim());
    description = firstLine ? firstLine.replace(/^#\s*/, "").trim() : fallbackName;
  } else {
    description = fallbackName;
  }
  return truncateDescription(description);
}

async function readTarballFile(tarball, filePath) {
  const tempDir = await mkdtemp(join(tmpdir(), "aipm-backfill-"));
  const tgzPath = join(tempDir, "pkg.tgz");
  try {
    await writeFile(tgzPath, tarball);
    await execFileAsync("tar", ["-xzf", tgzPath, "-C", tempDir]);
    const fullPath = join(tempDir, filePath);
    const content = await readFile(fullPath, "utf8");
    return content;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function findPackagesWithBrokenDescriptions(pool) {
  const result = await pool.query(`
    SELECT DISTINCT ON (name) 
      id, name, version, manifest, blob_path
    FROM package_versions
    WHERE yanked_at IS NULL
      AND (
        manifest->>'description' IN ('>','|','>-','|-','','> ','| ')
        OR manifest->>'description' IS NULL
        OR LENGTH(TRIM(manifest->>'description')) = 0
        OR manifest->>'description' ~ '^[>|][-+]?\\s*$'
      )
    ORDER BY name, created_at DESC
  `);
  return result.rows;
}

async function main() {
  const dryRun = !process.argv.includes("--apply");
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  console.log(`Mode: ${dryRun ? "DRY RUN (use --apply to make changes)" : "APPLY CHANGES"}`);
  console.log("");

  const pool = new pg.Pool({ connectionString: databaseUrl });
  let storage;

  try {
    const dataDir = process.env.AIPM_DATA_DIR || "./data";
    storage = await createStorage(dataDir);
    console.log(`Storage backend: ${storage.backend}`);
  } catch (error) {
    console.error("Failed to initialize storage:", error.message);
    console.log("Note: Set AZURE_STORAGE_CONNECTION_STRING or AIPM_DATA_DIR as needed.");
    await pool.end();
    process.exit(1);
  }

  try {
    const packages = await findPackagesWithBrokenDescriptions(pool);
    console.log(`Found ${packages.length} package(s) with broken descriptions.`);
    console.log("");

    let fixedCount = 0;
    let errorCount = 0;
    const fixes = [];

    for (const pkg of packages) {
      const { id, name, version, manifest, blob_path } = pkg;
      const oldDescription = manifest.description ?? "(empty)";

      try {
        const tarball = await storage.get(blob_path);
        const entryPath = manifest.entry ?? "SKILL.md";
        let entryContent;

        try {
          entryContent = await readTarballFile(tarball, entryPath);
        } catch {
          console.log(`  [SKIP] ${name}@${version}: Could not read entry file ${entryPath}`);
          continue;
        }

        const frontmatter = parseFrontmatter(entryContent);
        const folderName = name.split("/").pop() ?? name;
        const readmePath = "README.md";
        let readmeContent = null;
        try {
          readmeContent = await readTarballFile(tarball, readmePath);
        } catch {
          // README.md is optional
        }

        const newDescription = resolveDescription({
          frontmatter,
          readmeContent,
          fallbackName: folderName,
        });

        if (newDescription === oldDescription) {
          console.log(`  [SKIP] ${name}@${version}: Description unchanged`);
          continue;
        }

        if (BROKEN_DESCRIPTIONS.includes(newDescription) || newDescription.trim().length === 0) {
          console.log(`  [SKIP] ${name}@${version}: Could not derive valid description from frontmatter`);
          continue;
        }

        fixes.push({
          id,
          name,
          version,
          oldDescription,
          newDescription,
          manifest: { ...manifest, description: newDescription },
        });

        fixedCount++;
        console.log(`  [FIX] ${name}@${version}`);
        console.log(`         Old: "${oldDescription}"`);
        console.log(`         New: "${newDescription.slice(0, 80)}${newDescription.length > 80 ? "..." : ""}"`);
      } catch (error) {
        errorCount++;
        console.error(`  [ERROR] ${name}@${version}: ${error.message}`);
      }
    }

    console.log("");
    console.log("=".repeat(60));
    console.log(`Summary: ${fixedCount} to fix, ${errorCount} errors, ${packages.length - fixedCount - errorCount} skipped`);

    if (dryRun) {
      console.log("");
      console.log("DRY RUN complete. No changes made.");
      console.log("Run with --apply to apply these changes.");
    } else if (fixes.length > 0) {
      console.log("");
      console.log("Applying changes...");

      for (const fix of fixes) {
        await pool.query(
          `UPDATE package_versions
           SET manifest = $2
           WHERE id = $1`,
          [fix.id, JSON.stringify(fix.manifest)],
        );
        console.log(`  Updated ${fix.name}@${fix.version}`);
      }

      console.log("");
      console.log(`Applied ${fixes.length} fix(es).`);
    }

    return fixedCount;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
