import { describe, expect, it } from "vitest";
import { recommendCmd } from "./recommend-cmd.js";

describe("recommendCmd", () => {
  it("quotes the command without color when stream is not a TTY", () => {
    const stream = { isTTY: false } as NodeJS.WriteStream;
    expect(recommendCmd("aipm init", stream)).toBe('"aipm init"');
    expect(recommendCmd("aipm add <@scope/pkg>@<version>", stream)).toBe(
      '"aipm add <@scope/pkg>@<version>"',
    );
  });

  it("quotes and colors the command when stream is a TTY", () => {
    const stream = { isTTY: true } as NodeJS.WriteStream;
    expect(recommendCmd("aipm login", stream)).toBe('\u001b[36m"aipm login"\u001b[39m');
  });
});
