import { describe, expect, it } from "vitest";
import { recommendCmd } from "./recommend-cmd.js";

describe("recommendCmd", () => {
  it("quotes the command without color when stream is not a TTY", () => {
    const stream = { isTTY: false } as NodeJS.WriteStream;
    expect(recommendCmd("aipm init", stream, { NO_COLOR: "1" })).toBe('"aipm init"');
    expect(recommendCmd("aipm add <@scope/pkg>@<version>", stream)).toBe(
      '"aipm add <@scope/pkg>@<version>"',
    );
  });

  it("quotes and colors the command in brand mint when stream is a TTY", () => {
    const stream = { isTTY: true } as NodeJS.WriteStream;
    const rendered = recommendCmd("aipm login", stream, {
      FORCE_COLOR: "3",
      COLORTERM: "truecolor",
    });
    expect(rendered).toContain('"aipm login"');
    expect(rendered).toContain("38;2;72;185;141");
    expect(rendered).not.toContain("\u001b[36m");
  });
});
