import { describe, expect, it, vi } from "vitest";
import {
  CLI_UPDATE_COMMAND,
  classifyCliUpdate,
  formatCliUpdateNotice,
  isSemVerNewer,
  notifyCliUpdateIfNeeded,
  parseSemVer,
} from "./cli-update-check.js";

describe("parseSemVer", () => {
  it("parses semver prefixes", () => {
    expect(parseSemVer("0.1.8")).toEqual({ major: 0, minor: 1, patch: 8 });
    expect(parseSemVer("1.2.3-beta.1")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("rejects invalid versions", () => {
    expect(parseSemVer("not-a-version")).toBeNull();
  });
});

describe("classifyCliUpdate", () => {
  it("returns none when current is up to date", () => {
    expect(classifyCliUpdate("0.1.8", "0.1.8")).toBe("none");
    expect(classifyCliUpdate("0.2.0", "0.1.9")).toBe("none");
  });

  it("detects patch and minor updates", () => {
    expect(classifyCliUpdate("0.1.8", "0.1.9")).toBe("patch-minor");
    expect(classifyCliUpdate("0.1.8", "0.2.0")).toBe("patch-minor");
  });

  it("detects major updates", () => {
    expect(classifyCliUpdate("0.9.0", "1.0.0")).toBe("major");
    expect(classifyCliUpdate("1.4.2", "2.0.0")).toBe("major");
  });
});

describe("isSemVerNewer", () => {
  it("compares semver tuples", () => {
    expect(isSemVerNewer({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 1 })).toBe(
      true,
    );
    expect(isSemVerNewer({ major: 1, minor: 1, patch: 0 }, { major: 1, minor: 0, patch: 9 })).toBe(
      false,
    );
  });
});

describe("formatCliUpdateNotice", () => {
  it("formats patch/minor notice as info", () => {
    expect(
      formatCliUpdateNotice({
        currentVersion: "0.1.8",
        latestVersion: "0.1.9",
        level: "patch-minor",
      }),
    ).toContain(CLI_UPDATE_COMMAND);
  });

  it("formats major notice as urgent update", () => {
    const message = formatCliUpdateNotice({
      currentVersion: "0.9.0",
      latestVersion: "1.0.0",
      level: "major",
    });
    expect(message).toContain("Update now");
    expect(message).toContain(CLI_UPDATE_COMMAND);
  });
});

describe("notifyCliUpdateIfNeeded", () => {
  it("prints info for patch updates", async () => {
    const writeInfo = vi.fn();
    const writeWarn = vi.fn();

    const level = await notifyCliUpdateIfNeeded("0.1.8", {
      fetchLatest: async () => "0.1.9",
      useColor: false,
      writeInfo,
      writeWarn,
    });

    expect(level).toBe("patch-minor");
    expect(writeInfo).toHaveBeenCalledOnce();
    expect(writeWarn).not.toHaveBeenCalled();
  });

  it("prints red-style warning for major updates", async () => {
    const writeInfo = vi.fn();
    const writeWarn = vi.fn();

    const level = await notifyCliUpdateIfNeeded("0.9.0", {
      fetchLatest: async () => "1.0.0",
      useColor: true,
      writeInfo,
      writeWarn,
    });

    expect(level).toBe("major");
    expect(writeWarn).toHaveBeenCalledOnce();
    expect(writeWarn.mock.calls[0]?.[0]).toContain("\x1b[31m");
    expect(writeInfo).not.toHaveBeenCalled();
  });

  it("silently skips when registry lookup fails", async () => {
    const writeInfo = vi.fn();
    const level = await notifyCliUpdateIfNeeded("0.1.8", {
      fetchLatest: async () => null,
      writeInfo,
    });
    expect(level).toBe("none");
    expect(writeInfo).not.toHaveBeenCalled();
  });
});
