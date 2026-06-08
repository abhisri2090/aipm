import { describe, expect, it } from "vitest";
import { normalizeImportOrgSlug, normalizeImportPackageName } from "./admin-import.js";

describe("admin import normalization", () => {
  it("normalizes github login into org slug and package name", () => {
    expect(normalizeImportOrgSlug("MattPocock")).toBe("mattpocock");
    expect(normalizeImportPackageName("mattpocock", "grill-me")).toBe("@mattpocock/grill-me");
  });
});
