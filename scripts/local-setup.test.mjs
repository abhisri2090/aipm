import { describe, expect, it } from "vitest";
import { isDockerComposeOutput } from "./local-setup.mjs";

describe("local-setup", () => {
  it("detects real Docker Compose output", () => {
    expect(isDockerComposeOutput("Docker Compose version v2.31.0-desktop.2")).toBe(true);
    expect(isDockerComposeOutput("Saved file tree to doc-filelist.js")).toBe(false);
  });
});
