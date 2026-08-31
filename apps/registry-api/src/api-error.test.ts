import { describe, expect, it } from "vitest";
import { httpStatusFromError, publicError } from "./api-error.js";

describe("publicError", () => {
  it("passes the backend error message through to API clients", () => {
    expect(publicError(new Error("Skill already exists: @org/skill@1.0.0"), "Failed to import skill")).toBe(
      "Skill already exists: @org/skill@1.0.0",
    );
  });

  it("uses the fallback when the error has no message", () => {
    expect(publicError({}, "Failed to import skill")).toBe("Failed to import skill");
    expect(publicError(new Error("   "), "Failed to import skill")).toBe("Failed to import skill");
  });
});

describe("httpStatusFromError", () => {
  it("uses a numeric statusCode of 400 or higher", () => {
    expect(httpStatusFromError({ statusCode: 404 })).toBe(404);
    expect(httpStatusFromError(Object.assign(new Error("gone"), { statusCode: 410 }))).toBe(410);
  });

  it("falls back to 500 when statusCode is missing or not a client/server error", () => {
    expect(httpStatusFromError(new Error("boom"))).toBe(500);
    expect(httpStatusFromError({ statusCode: 200 })).toBe(500);
    expect(httpStatusFromError({ statusCode: "404" })).toBe(500);
    expect(httpStatusFromError(null)).toBe(500);
  });
});
