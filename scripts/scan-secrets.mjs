#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MAX_FILE_BYTES = 1024 * 1024;

const ignoredPathPatterns = [
  /(^|\/)\.git\//,
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)dist\//,
  /(^|\/)\.turbo\//,
  /(^|\/)deploy\//,
  /(^|\/)coverage\//,
  /(^|\/)doc\//,
  /(^|\/)docs\//,
  /\.tgz$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.webp$/,
  /\.ico$/,
  /\.pdf$/,
  /\.zip$/,
  /\.gz$/,
  /\.map$/,
  /pnpm-lock\.yaml$/,
];

const checks = [
  {
    name: "private key",
    pattern: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/,
  },
  {
    name: "Azure publish profile",
    pattern: /<publishData[\s>]|<publishProfile[\s>]|userPWD\s*=/i,
  },
  {
    name: "Azure storage account key",
    pattern: /(?:AccountKey|accountKey)=([A-Za-z0-9+/=]{40,})/,
  },
  {
    name: "Azure SAS signature",
    pattern: /(?:SharedAccessSignature|sig)=([A-Za-z0-9%+/=]{32,})/,
  },
  {
    name: "GitHub token",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  },
  {
    name: "npm token",
    pattern: /\bnpm_[A-Za-z0-9]{30,}\b/,
  },
  {
    name: "Slack token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  },
  {
    name: "OpenAI-style API key",
    pattern: /\bsk-[A-Za-z0-9_-]{32,}\b/,
  },
  {
    name: "Postgres URL with credentials",
    pattern: /\bpostgres(?:ql)?:\/\/[^:\s/@]+:[^@\s]+@[^/\s]+/i,
  },
];

const allowedMatches = [
  {
    path: "apps/registry-api/src/storage.test.ts",
    patterns: [/UseDevelopmentStorage=true/],
  },
];

export function listFiles() {
  const output = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
    encoding: "buffer",
  });
  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((file) => !ignoredPathPatterns.some((pattern) => pattern.test(file)));
}

export function isAllowed(file, match) {
  if (match.includes("localhost") || match.includes("127.0.0.1") || match.includes("<") || match.includes("${")) return true;
  return allowedMatches.some(
    (entry) => entry.path === file && entry.patterns.some((pattern) => pattern.test(match)),
  );
}

export function lineNumberFor(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

export function scanContent(file, content) {
  const findings = [];
  for (const check of checks) {
    for (const match of content.matchAll(new RegExp(check.pattern, check.pattern.flags.includes("g") ? check.pattern.flags : `${check.pattern.flags}g`))) {
      const value = match[0] ?? "";
      if (isAllowed(file, value)) continue;
      findings.push({
        file,
        line: lineNumberFor(content, match.index ?? 0),
        name: check.name,
      });
    }
  }
  return findings;
}

export function scanFiles(files = listFiles()) {
  const findings = [];

  for (const file of files) {
    let buffer;
    try {
      buffer = readFileSync(file);
    } catch {
      continue;
    }

    if (buffer.length > MAX_FILE_BYTES || buffer.includes(0)) continue;
    findings.push(...scanContent(file, buffer.toString("utf8")));
  }

  return findings;
}

export function main() {
  const findings = scanFiles();

  if (findings.length > 0) {
    console.error("Secret scan failed. Review these possible leaks:");
    for (const finding of findings) {
      console.error(`- ${finding.file}:${finding.line} (${finding.name})`);
    }
    process.exit(1);
  }

  console.log("Secret scan passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
