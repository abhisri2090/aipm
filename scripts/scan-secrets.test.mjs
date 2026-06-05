import { describe, expect, it } from "vitest";
import { lineNumberFor, scanContent } from "./scan-secrets.mjs";

describe("scan-secrets", () => {
  it("finds private keys with line numbers", () => {
    const findings = scanContent(
      "leak.txt",
      `safe line\n-----BEGIN ${"OPENSSH"} PRIVATE KEY-----\nsecret\n`,
    );

    expect(findings).toContainEqual({
      file: "leak.txt",
      line: 2,
      name: "private key",
    });
  });

  it("finds high-risk service tokens", () => {
    const findings = scanContent(
      "tokens.txt",
      [
        `github=${"ghp"}_abcdefghijklmnopqrstuvwxyz1234567890`,
        `npm=${"npm"}_abcdefghijklmnopqrstuvwxyz1234567890`,
        `openai=${"sk"}-abcdefghijklmnopqrstuvwxyz1234567890abcdef`,
      ].join("\n"),
    );

    expect(findings.map((finding) => finding.name)).toEqual([
      "GitHub token",
      "npm token",
      "OpenAI-style API key",
    ]);
  });

  it("allows documented placeholders and localhost database URLs", () => {
    const findings = scanContent(
      ".env.example",
      [
        "DATABASE_URL=postgresql://aipm:aipm@localhost:5432/aipm",
        "AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...",
        "DATABASE_URL=postgresql://<user>:<password>@<postgres-host>:5432/aipm",
      ].join("\n"),
    );

    expect(findings).toEqual([]);
  });

  it("finds live Postgres URLs with credentials", () => {
    const findings = scanContent(
      "prod.env",
      `DATABASE_URL=${"postgresql"}://aipm:super-secret@db.example.com:5432/aipm?sslmode=require`,
    );

    expect(findings).toContainEqual({
      file: "prod.env",
      line: 1,
      name: "Postgres URL with credentials",
    });
  });

  it("counts line numbers from zero-based offsets", () => {
    expect(lineNumberFor("a\nb\nc", 4)).toBe(3);
  });
});
