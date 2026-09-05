import { describe, expect, it } from "vitest";
import { parseTargetFlag, parseTargetsFlag } from "./project-files.js";

describe("parseTargetFlag", () => {
  it("accepts wildcard target", () => {
    expect(parseTargetFlag("*")).toBe("*");
  });

  it("accepts concrete targets", () => {
    expect(parseTargetFlag("cursor")).toBe("cursor");
    expect(parseTargetFlag("claude")).toBe("claude");
    expect(parseTargetFlag("codex")).toBe("codex");
  });

  it("rejects invalid targets", () => {
    expect(() => parseTargetFlag("vscode")).toThrow(/cursor.*claude.*codex.*\*/);
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
    expect(parseTargetsFlag("cursor,claude,codex")).toEqual(["cursor", "claude", "codex"]);
  });

  it("rejects invalid targets", () => {
    expect(() => parseTargetsFlag("vscode")).toThrow(/cursor.*claude.*codex.*\*/);
  });
});
