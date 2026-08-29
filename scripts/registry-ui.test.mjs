import { describe, expect, it } from "vitest";

function isUnverifiedImportedPackage(pkg) {
  return Boolean(pkg.import?.imported) && pkg.publisher?.user.verified === false;
}

describe("registry import UI helpers", () => {
  it("detects unverified imported packages", () => {
    expect(
      isUnverifiedImportedPackage({
        import: { imported: true, sourceUrl: "https://github.com/x/y" },
        publisher: { user: { verified: false } },
      }),
    ).toBe(true);
    expect(
      isUnverifiedImportedPackage({
        import: { imported: true, sourceUrl: "https://github.com/x/y" },
        publisher: { user: { verified: true } },
      }),
    ).toBe(false);
  });

  it("excludes private contact fields from API-shaped payloads", () => {
    const apiPackage = {
      name: "@mattpocock/grill-me",
      publisher: {
        user: { githubLogin: "mattpocock", verified: false },
      },
      import: { imported: true, sourceUrl: "https://github.com/x/y" },
    };
    expect(apiPackage).not.toHaveProperty("contact_email");
    expect(apiPackage.publisher.user).not.toHaveProperty("email");
  });
});
