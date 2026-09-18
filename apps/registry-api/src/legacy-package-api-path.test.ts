import { describe, expect, it } from "vitest";
import { rewriteLegacyPackageApiPath } from "./legacy-package-api-path.js";

describe("rewriteLegacyPackageApiPath", () => {
  it("rewrites public, admin, and org package API paths", () => {
    expect(rewriteLegacyPackageApiPath("/v1/packages?limit=1")).toBe("/v1/skills?limit=1");
    expect(rewriteLegacyPackageApiPath("/v1/packages/%40team%2Fskill/versions")).toBe(
      "/v1/skills/%40team%2Fskill/versions",
    );
    expect(rewriteLegacyPackageApiPath("/v1/admin/packages?q=team")).toBe("/v1/admin/skills?q=team");
    expect(rewriteLegacyPackageApiPath("/v1/orgs/aipm/packages")).toBe("/v1/orgs/aipm/skills");
    expect(rewriteLegacyPackageApiPath("/v1/orgs/aipm/packages/%40aipm%2Fskill")).toBe(
      "/v1/orgs/aipm/skills/%40aipm%2Fskill",
    );
  });

  it("leaves skill and unrelated paths unchanged", () => {
    expect(rewriteLegacyPackageApiPath("/v1/skills?limit=1")).toBe("/v1/skills?limit=1");
    expect(rewriteLegacyPackageApiPath("/v1/prompts?limit=1")).toBe("/v1/prompts?limit=1");
    expect(rewriteLegacyPackageApiPath("/health")).toBe("/health");
  });
});
