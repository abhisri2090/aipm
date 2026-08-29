#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , packagePath, tagPrefix] = process.argv;

if (!packagePath || !tagPrefix) {
  console.error("Usage: node scripts/set-package-version-from-tag.mjs <package-json> <tag-prefix>");
  process.exit(2);
}

const refName = process.env.GITHUB_REF_NAME ?? "";
const fallbackRef = process.env.GITHUB_REF ?? "";
const tag = refName || fallbackRef.replace(/^refs\/tags\//, "");

if (!tag.startsWith(tagPrefix)) {
  console.error(`Expected tag to start with ${tagPrefix}, got ${tag || "(empty)"}`);
  process.exit(2);
}

const version = tag.slice(tagPrefix.length);
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid release version from tag ${tag}: ${version}`);
  process.exit(2);
}

const absolutePath = isAbsolute(packagePath) ? packagePath : join(repoRoot, packagePath);
const pkg = JSON.parse(readFileSync(absolutePath, "utf8"));
pkg.version = version;
writeFileSync(absolutePath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`Set ${packagePath} version to ${version} from ${tag}`);
