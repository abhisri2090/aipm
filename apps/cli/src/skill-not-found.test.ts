import { describe, expect, it } from "vitest";
import { skillNotFoundMessage } from "./registry-client.js";

describe("skillNotFoundMessage", () => {
  it("puts the login hint two blank lines under the missing skill", () => {
    const stream = { isTTY: false } as NodeJS.WriteStream;
    const message = skillNotFoundMessage("@team/private-skill", stream);

    expect(message).toBe(
      [
        "Not able to find the skill: @team/private-skill",
        "",
        "",
        'If the skill is private you might need to do "aipm login"',
      ].join("\n"),
    );
  });
});
