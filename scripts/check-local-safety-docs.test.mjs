import { describe, expect, it } from "vitest";
import { scanContributorDocs } from "./check-local-safety-docs.mjs";

describe("scanContributorDocs", () => {
  it("passes on the current contributor docs", () => {
    expect(scanContributorDocs()).toEqual([]);
  });

  it("flags banned production-local instructions", () => {
    const findings = scanContributorDocs(["README.md"], () =>
      "Use KEY_VAULT_NAME and pull-local-dev-secrets for production database (recommended)",
    );
    expect(findings.length).toBeGreaterThan(0);
  });
});
