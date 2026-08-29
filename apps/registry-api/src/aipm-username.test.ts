import { describe, expect, it } from "vitest";
import { isValidAipmUsername, nextUsernameCandidate, normalizeUsernameCandidate } from "./aipm-username.js";

describe("aipm usernames", () => {
  it("normalizes github logins into stable username candidates", () => {
    expect(normalizeUsernameCandidate("AbhiSrivastava")).toBe("abhisrivastava");
    expect(normalizeUsernameCandidate("a.b-c")).toBe("a-b-c");
    expect(normalizeUsernameCandidate("ab")).toBe("user-ab");
  });

  it("validates username format", () => {
    expect(isValidAipmUsername("abhisrivastava")).toBe(true);
    expect(isValidAipmUsername("ab")).toBe(false);
    expect(isValidAipmUsername("-bad")).toBe(false);
  });

  it("creates deduplicated username candidates", () => {
    expect(nextUsernameCandidate("abhisrivastava", 1)).toBe("abhisrivastava");
    expect(nextUsernameCandidate("abhisrivastava", 2)).toBe("abhisrivastava-2");
  });
});
