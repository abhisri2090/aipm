import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./select.js", () => ({
  SelectCancelledError: class SelectCancelledError extends Error {
    constructor(message = "Selection cancelled") {
      super(message);
      this.name = "SelectCancelledError";
    }
  },
  selectPrompt: vi.fn(),
}));

vi.mock("./note.js", () => ({
  printNote: vi.fn(),
}));

import { SelectCancelledError, selectPrompt } from "./select.js";
import { offerChoices, RecoveryCancelledError } from "./recover.js";

describe("offerChoices", () => {
  beforeEach(() => {
    vi.mocked(selectPrompt).mockReset();
  });

  it("throws fallbackError in CI", async () => {
    await expect(
      offerChoices({
        ci: true,
        message: "Pick",
        choices: [{ value: "a" as const, label: "A" }],
        fallbackError: "fallback boom",
      }),
    ).rejects.toThrow("fallback boom");
    expect(selectPrompt).not.toHaveBeenCalled();
  });

  it("returns selectPrompt result when interactive", async () => {
    const stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
    const stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    vi.mocked(selectPrompt).mockResolvedValueOnce("init");

    try {
      await expect(
        offerChoices({
          message: "How continue?",
          note: { type: "warn", message: "not initialized" },
          choices: [
            { value: "init" as const, label: "Init" },
            { value: "no-init" as const, label: "No init" },
          ],
          fallbackError: "fallback",
        }),
      ).resolves.toBe("init");
    } finally {
      if (stdinDescriptor) Object.defineProperty(process.stdin, "isTTY", stdinDescriptor);
      else delete (process.stdin as { isTTY?: boolean }).isTTY;
      if (stdoutDescriptor) Object.defineProperty(process.stdout, "isTTY", stdoutDescriptor);
      else delete (process.stdout as { isTTY?: boolean }).isTTY;
    }
  });

  it("maps select cancel to RecoveryCancelledError", async () => {
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    vi.mocked(selectPrompt).mockRejectedValueOnce(new SelectCancelledError());

    await expect(
      offerChoices({
        message: "Pick",
        choices: [{ value: "a" as const, label: "A" }],
        fallbackError: "fallback",
      }),
    ).rejects.toBeInstanceOf(RecoveryCancelledError);
  });
});
