import { describe, expect, it } from "vitest";
import {
  cleanCommentBody,
  parseCommentTargetType,
  sortTopLevelComments,
} from "./comment-routes.js";

describe("comment validation", () => {
  it("trims and accepts comment bodies", () => {
    expect(cleanCommentBody("  hello 👋  ")).toBe("hello 👋");
  });

  it("rejects empty or oversized bodies", () => {
    expect(() => cleanCommentBody("   ")).toThrow("Comment text is required");
    expect(() => cleanCommentBody("x".repeat(2001))).toThrow("2000 characters");
  });

  it("accepts package and prompt targets only", () => {
    expect(parseCommentTargetType("package")).toBe("package");
    expect(parseCommentTargetType("prompt")).toBe("prompt");
    expect(() => parseCommentTargetType("skill")).toThrow("targetType");
  });

  it("sorts by reply count then newer first", () => {
    const sorted = sortTopLevelComments([
      { id: "a", replyCount: 1, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", replyCount: 3, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "c", replyCount: 3, createdAt: "2026-01-02T00:00:00.000Z" },
      { id: "d", replyCount: 0, createdAt: "2026-01-03T00:00:00.000Z" },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["c", "b", "a", "d"]);
  });
});
