import { homedir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { globalConfigDir, resolveConfigRoot, resolveInstallRoot } from "./project-root.js";

describe("project-root", () => {
  it("uses ~/.aipm for global config", () => {
    expect(globalConfigDir({})).toBe(join(homedir(), ".aipm"));
    expect(globalConfigDir({ AIPM_HOME: "/custom/aipm" })).toBe("/custom/aipm");
  });

  it("separates global config dir from install root", () => {
    expect(resolveConfigRoot({ global: true })).toBe(join(homedir(), ".aipm"));
    expect(resolveInstallRoot({ global: true })).toBe(homedir());
  });
});
