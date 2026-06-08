#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const contributorFiles = [
  ".env.example",
  "README.md",
  "CONTRIBUTING.md",
  "docs/LOCAL_DEV.md",
  "apps/web/README.md",
  "apps/web/.env.local.example",
];

const bannedPatterns = [
  { name: "pull-local-dev-secrets", pattern: /pull-local-dev-secrets/i },
  { name: "allow-local-postgres-ip", pattern: /allow-local-postgres-ip/i },
  { name: "production database recommended", pattern: /production database \(recommended\)/i },
  { name: "KEY_VAULT_NAME in contributor docs", pattern: /KEY_VAULT_NAME/i },
  {
    name: "remote postgres url in contributor docs",
    pattern: /postgres(?:ql)?:\/\/[^:\s/@]+:[^@\s]+@(?!localhost|127\.0\.0\.1)[^/\s]+/i,
  },
];

export function scanContributorDocs(files = contributorFiles, readFile = readFileSync) {
  const findings = [];
  for (const relativePath of files) {
    const absolutePath = join(repoRoot, relativePath);
    let content;
    try {
      content = readFile(absolutePath, "utf8");
    } catch {
      findings.push({ file: relativePath, issue: "missing contributor doc" });
      continue;
    }
    for (const check of bannedPatterns) {
      if (check.pattern.test(content)) {
        findings.push({ file: relativePath, issue: check.name });
      }
    }
  }
  return findings;
}

export function main() {
  const findings = scanContributorDocs();
  if (findings.length > 0) {
    console.error("Local safety doc check failed:");
    for (const finding of findings) {
      console.error(`- ${finding.file}: ${finding.issue}`);
    }
    process.exit(1);
  }
  console.log("Local safety doc check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
