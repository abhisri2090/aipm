#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  ".github/workflows/ci.yml",
  ".github/workflows/deploy-api-vm.yml",
  ".github/workflows/release-cli.yml",
  "infra/azure/deploy-registry-vm.sh",
  "infra/azure/verify-production.sh",
  "scripts/build-cli-binaries.mjs",
  "scripts/render-cli-distribution-templates.mjs",
];

const requiredExecutableScripts = [
  "infra/azure/deploy-registry-vm.sh",
  "infra/azure/verify-production.sh",
];

const fileChecks = [
  {
    file: "package.json",
    patterns: [
      /"release:cli:binaries":\s*"node scripts\/build-cli-binaries\.mjs"/,
      /"release:cli:templates":\s*"node scripts\/render-cli-distribution-templates\.mjs"/,
      /"release:cli:publish":/,
      /"release:check":\s*"node scripts\/check-release-plumbing\.mjs"/,
      /"release:version-from-tag":\s*"node scripts\/set-package-version-from-tag\.mjs"/,
    ],
  },
  {
    file: ".github/workflows/release-cli.yml",
    patterns: [
      /tags:\s*\n\s+- "cli-v\*"/,
      /release:version-from-tag apps\/cli\/package\.json cli-v/,
      /pnpm release:cli:binaries/,
      /pnpm release:cli:templates/,
      /softprops\/action-gh-release@v2/,
      /NODE_AUTH_TOKEN:\s*\$\{\{ secrets\.NPM_TOKEN \}\}/,
      /release\/homebrew\/Formula\/aipm\.rb/,
      /release\/scoop\/bucket\/aipm\.json/,
      /release\/winget\/aipm\.yaml/,
      /HOMEBREW_TAP_REPO/,
      /SCOOP_BUCKET_REPO/,
    ],
  },
  {
    file: ".github/workflows/deploy-api-vm.yml",
    patterns: [
      /tags:\s*\n\s+- "api-v\*"/,
      /azure\/login@v2/,
      /AZURE_CREDENTIALS/,
      /release:version-from-tag apps\/registry-api\/package\.json api-v/,
      /infra\/azure\/deploy-registry-vm\.sh/,
      /infra\/azure\/verify-production\.sh/,
    ],
  },
];

const forbiddenFiles = [
  ".github/workflows/deploy-registry-staging.yml",
  "infra/azure/create-staging.sh",
  "infra/azure/deploy-registry.sh",
];

const forbiddenRepoPatterns = [
  { name: "Azure Web App deploy action", pattern: /azure\/webapps-deploy/i },
  { name: "Web App publish profile secret", pattern: /AZURE_WEBAPP_PUBLISH_PROFILE/i },
];

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

export function scanReleasePlumbing() {
  const findings = [];

  for (const file of requiredFiles) {
    if (!existsSync(join(repoRoot, file))) {
      findings.push(`${file}: missing required release/deploy file`);
    }
  }

  if (process.platform !== "win32") {
    for (const file of requiredExecutableScripts) {
      if (!existsSync(join(repoRoot, file))) continue;
      const mode = statSync(join(repoRoot, file)).mode;
      if ((mode & 0o111) === 0) findings.push(`${file}: script is not executable`);
    }
  }

  for (const check of fileChecks) {
    if (!existsSync(join(repoRoot, check.file))) continue;
    const content = read(check.file);
    for (const pattern of check.patterns) {
      if (!pattern.test(content)) findings.push(`${check.file}: missing ${pattern}`);
    }
  }

  for (const file of forbiddenFiles) {
    if (existsSync(join(repoRoot, file))) {
      findings.push(`${file}: removed deployment path should not exist`);
    }
  }

  const activeFiles = [
    ".github/workflows/ci.yml",
    ".github/workflows/deploy-api-vm.yml",
    ".github/workflows/release-cli.yml",
    "infra/azure/README.md",
  ].filter((file) => existsSync(join(repoRoot, file)));
  for (const file of activeFiles) {
    const content = read(file);
    for (const check of forbiddenRepoPatterns) {
      if (check.pattern.test(content)) findings.push(`${file}: forbidden ${check.name}`);
    }
  }

  return findings;
}

export function main() {
  const findings = scanReleasePlumbing();
  if (findings.length > 0) {
    console.error("Release plumbing check failed:");
    for (const finding of findings) console.error(`- ${finding}`);
    process.exit(1);
  }
  console.log("Release plumbing check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
