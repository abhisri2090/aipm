import { describe, expect, it } from "vitest";
import {
  isValidScopeName,
  normalizePackageSearchQuery,
  shortNameFromScopeName,
} from "./scope-name.js";

describe("scope name", () => {
  it("accepts valid names", () => {
    expect(isValidScopeName("@team/react-reviewer")).toBe(true);
    expect(isValidScopeName("@acme-corp/foo")).toBe(true);
  });

  it("rejects invalid names", () => {
    expect(isValidScopeName("react-reviewer")).toBe(false);
    expect(isValidScopeName("@TEAM/foo")).toBe(false);
    expect(isValidScopeName("@team/")).toBe(false);
  });

  it("extracts short name", () => {
    expect(shortNameFromScopeName("@team/react-reviewer")).toBe("react-reviewer");
  });

  it("strips version from package@version search queries", () => {
    expect(normalizePackageSearchQuery("@team/prod-flow-20260616170043@1.0.0")).toBe(
      "@team/prod-flow-20260616170043",
    );
    expect(normalizePackageSearchQuery("  @acme/skill@2.1.0-beta  ")).toBe("@acme/skill");
    expect(normalizePackageSearchQuery("@team/react-reviewer")).toBe("@team/react-reviewer");
    expect(normalizePackageSearchQuery("@Team/React-Reviewer")).toBe("@team/react-reviewer");
    expect(normalizePackageSearchQuery("prod-flow")).toBe("prod-flow");
  });
});
