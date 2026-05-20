import { describe, expect, it } from "vitest";
import { isValidScopeName, shortNameFromScopeName } from "./scope-name.js";

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
});
