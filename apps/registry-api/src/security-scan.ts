/**
 * Automated content scan run against skill packages and prompts at publish time.
 *
 * Scope (see AIP-24 / docs/GROWTH_PLAN.md "Security scan status"): pattern-based checks for
 * embedded secrets, prompt-injection style instructions, and suspicious network/filesystem
 * actions. This is not malware analysis and never implies the content is safe to run blindly —
 * see docs/SEO_EXECUTION_PLAN.md ("We will not claim that an automated scan guarantees safety").
 */

export const SCANNER_VERSION = "2026-09-12.1";

export type ScanStatus = "not_scanned" | "clean" | "flagged" | "error";
export type FindingSeverity = "warning" | "block";
export type FindingCategory = "secret" | "prompt-injection" | "network-or-filesystem";

export type ScanFinding = {
  category: FindingCategory;
  severity: FindingSeverity;
  label: string;
  location: string;
};

export type ScanResult = {
  status: ScanStatus;
  findings: ScanFinding[];
  checksPerformed: string[];
  scannerVersion: string;
};

type Check = {
  category: FindingCategory;
  severity: FindingSeverity;
  label: string;
  pattern: RegExp;
};

const SECRET_CHECKS: Check[] = [
  { category: "secret", severity: "block", label: "Private key block", pattern: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ },
  { category: "secret", severity: "block", label: "GitHub token", pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/ },
  { category: "secret", severity: "block", label: "npm token", pattern: /\bnpm_[A-Za-z0-9]{30,}\b/ },
  { category: "secret", severity: "block", label: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { category: "secret", severity: "block", label: "OpenAI-style API key", pattern: /\bsk-[A-Za-z0-9_-]{32,}\b/ },
  { category: "secret", severity: "block", label: "AWS access key ID", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { category: "secret", severity: "block", label: "Azure storage account key", pattern: /(?:AccountKey|accountKey)=[A-Za-z0-9+/=]{40,}/ },
  { category: "secret", severity: "block", label: "Database URL with embedded credentials", pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^:\s/@]+:[^@\s]+@[^/\s]+/i },
];

const PROMPT_INJECTION_CHECKS: Check[] = [
  { category: "prompt-injection", severity: "warning", label: "Instructs ignoring prior/system instructions", pattern: /\b(ignore|disregard|override)\b[^.\n]{0,40}\b(previous|prior|above|system)\b[^.\n]{0,20}\b(instructions?|prompts?|rules?)\b/i },
  { category: "prompt-injection", severity: "warning", label: "Requests exposing hidden/system prompt", pattern: /\b(reveal|print|show|leak|output)\b[^.\n]{0,20}\b(system prompt|hidden instructions|your instructions)\b/i },
  { category: "prompt-injection", severity: "warning", label: "Instructs acting without telling the user", pattern: /\bwithout\s+(telling|informing|notifying)\s+the\s+user\b|\bsecretly\b[^.\n]{0,30}\b(send|upload|email|post|exfiltrate)\b/i },
  { category: "prompt-injection", severity: "warning", label: "Instructs exfiltrating data or credentials", pattern: /\bexfiltrat(e|ing)\b|\bsend\b[^.\n]{0,30}\b(api keys?|credentials?|secrets?|\.env|environment variables?)\b[^.\n]{0,30}\bto\b/i },
  { category: "prompt-injection", severity: "warning", label: "Jailbreak-style persona override", pattern: /\byou are now\b[^.\n]{0,30}\b(dan|jailbroken|unrestricted|no rules|without restrictions)\b/i },
];

const NETWORK_OR_FS_CHECKS: Check[] = [
  { category: "network-or-filesystem", severity: "warning", label: "Outbound HTTP request via curl/wget", pattern: /\b(curl|wget)\s+(-\S+\s+)*https?:\/\//i },
  { category: "network-or-filesystem", severity: "warning", label: "Outbound HTTP request via code", pattern: /\b(fetch|axios|requests\.(get|post|put)|http\.request|urllib\.request)\s*\(\s*["'`]https?:\/\// },
  { category: "network-or-filesystem", severity: "warning", label: "Shell command execution", pattern: /\b(child_process|subprocess|os\.system)\b[^.\n]{0,30}\b(exec|spawn|run|popen|call)\b/i },
  { category: "network-or-filesystem", severity: "warning", label: "Destructive filesystem command", pattern: /\brm\s+-[a-z]*r[a-z]*f\b|\bdel\s+\/[sf]\b/i },
  { category: "network-or-filesystem", severity: "warning", label: "Reads a credential store outside project scope", pattern: /~[\\/](\.ssh|\.aws\/credentials|\.netrc|\.npmrc)\b|\/etc\/(passwd|shadow)\b/i },
  { category: "network-or-filesystem", severity: "warning", label: "Writes outside the project directory", pattern: /\bwrite(?:File)?\w*\s*\(\s*["'`](?:\/(?!tmp\/)|~[\\/]|[A-Za-z]:\\)/i },
];

const ALL_CHECKS = [...SECRET_CHECKS, ...PROMPT_INJECTION_CHECKS, ...NETWORK_OR_FS_CHECKS];

const CHECKS_PERFORMED = [
  "embedded secrets and credentials",
  "prompt-injection style instructions",
  "suspicious outbound network calls",
  "suspicious filesystem writes outside expected scope",
];

/**
 * Scans one block of text and returns findings. Finding `label`s never include the matched
 * substring itself, so a flagged secret is never echoed back through the API/UI.
 */
export function scanText(location: string, text: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  for (const check of ALL_CHECKS) {
    if (check.pattern.test(text)) {
      findings.push({
        category: check.category,
        severity: check.severity,
        label: check.label,
        location,
      });
    }
  }
  return findings;
}

export function buildScanResult(findings: ScanFinding[]): ScanResult {
  return {
    status: findings.length > 0 ? "flagged" : "clean",
    findings,
    checksPerformed: CHECKS_PERFORMED,
    scannerVersion: SCANNER_VERSION,
  };
}

export function errorScanResult(): ScanResult {
  return {
    status: "error",
    findings: [],
    checksPerformed: CHECKS_PERFORMED,
    scannerVersion: SCANNER_VERSION,
  };
}

/** Scans a set of extracted text files (skill package content). */
export function scanFiles(files: { path: string; content: string }[]): ScanResult {
  const findings = files.flatMap((file) => scanText(file.path, file.content));
  return buildScanResult(findings);
}

/** Scans a set of named free-text fields (prompt submissions). */
export function scanFields(fields: Record<string, string | null | undefined>): ScanResult {
  const findings = Object.entries(fields).flatMap(([field, value]) =>
    value ? scanText(field, value) : [],
  );
  return buildScanResult(findings);
}
