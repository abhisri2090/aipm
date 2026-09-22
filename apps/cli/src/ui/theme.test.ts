import { describe, expect, it } from "vitest";
import { brand, createTheme, fgTruecolor, supportsTruecolor } from "./theme.js";

describe("createTheme", () => {
  it("disables color when NO_COLOR is set", () => {
    const theme = createTheme({ isTTY: true }, { NO_COLOR: "1" });
    expect(theme.color).toBe(false);
    expect(theme.accent).toBe("");
  });

  it("uses truecolor accent matching brand mint on TTY", () => {
    const theme = createTheme(
      { isTTY: true },
      { FORCE_COLOR: "3", COLORTERM: "truecolor" },
    );
    expect(theme.color).toBe(true);
    expect(theme.truecolor).toBe(true);
    expect(theme.accent).toBe(fgTruecolor(brand.accent));
    expect(theme.accent).toContain("38;2;72;185;141");
  });

  it("supportsTruecolor is false when color is disabled", () => {
    expect(supportsTruecolor({ isTTY: true }, { NO_COLOR: "1" })).toBe(false);
  });

  it("falls back to ANSI green when truecolor is unavailable", () => {
    // Non-TTY + FORCE_COLOR=1: color on, truecolor off.
    const basic = createTheme({ isTTY: false }, { FORCE_COLOR: "1" });
    expect(basic.color).toBe(true);
    expect(basic.truecolor).toBe(false);
    expect(basic.accent).toBe("\x1b[32m");
  });
});
