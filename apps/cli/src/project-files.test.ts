import { describe, expect, it } from "vitest";
import { parseTargetFlag, parseTargetsFlag } from "./project-files.js";

describe("parseTargetFlag", () => {
  it("accepts wildcard target", () => {
    expect(parseTargetFlag("*")).toBe("*");
  });

  it("accepts concrete targets", () => {
    expect(parseTargetFlag("cursor")).toBe("cursor");
    expect(parseTargetFlag("claude")).toBe("claude");
  });

  it("rejects invalid targets", () => {
    expect(() => parseTargetFlag("vscode")).toThrow(/cursor.*claude.*\*/);
  });
});

describe("parseTargetsFlag", () => {
  it("accepts wildcard target", () => {
    expect(parseTargetsFlag("*")).toEqual(["*"]);
  });

  it("collapses mixed targets to wildcard", () => {
    expect(parseTargetsFlag("cursor,*")).toEqual(["*"]);
  });

  it("accepts concrete targets", () => {
    expect(parseTargetsFlag("cursor,claude")).toEqual(["cursor", "claude"]);
  });

  it("rejects invalid targets", () => {
    expect(() => parseTargetsFlag("vscode")).toThrow(/cursor.*claude.*\*/);
  });
});
