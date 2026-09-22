import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { SelectCancelledError, selectPrompt } from "./select.js";

type FakeStream = EventEmitter & {
  isTTY: boolean;
  isRaw: boolean;
  setRawMode: (mode: boolean) => void;
  resume: () => void;
  write: ReturnType<typeof vi.fn>;
};

function createFakeTty(): { input: FakeStream; output: FakeStream; writes: string[] } {
  const writes: string[] = [];
  const input = new EventEmitter() as FakeStream;
  input.isTTY = true;
  input.isRaw = false;
  input.setRawMode = vi.fn((mode: boolean) => {
    input.isRaw = mode;
  });
  input.resume = vi.fn();

  const output = new EventEmitter() as FakeStream;
  output.isTTY = true;
  output.isRaw = false;
  output.setRawMode = vi.fn();
  output.resume = vi.fn();
  output.write = vi.fn((chunk: string | Uint8Array) => {
    writes.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  });

  return { input, output, writes };
}

describe("selectPrompt", () => {
  it("highlights and returns the selected option on enter", async () => {
    const { input, output, writes } = createFakeTty();
    const pending = selectPrompt({
      message: "Pick a tool",
      options: [
        { value: "cursor", label: "cursor" },
        { value: "claude", label: "claude" },
        { value: "codex", label: "codex" },
      ],
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream,
    });

    // Allow listener registration.
    await Promise.resolve();
    input.emit("data", "\u001b[B"); // down → claude
    input.emit("data", "\r");

    await expect(pending).resolves.toBe("claude");
    const joined = writes.join("");
    expect(joined).toContain("Pick a tool");
    expect(joined).toContain("✔");
    expect(joined).toContain("claude");
    expect(input.setRawMode).toHaveBeenCalledWith(true);
    expect(input.isRaw).toBe(false);
  });

  it("wraps from last to first on down", async () => {
    const { input, output } = createFakeTty();
    const pending = selectPrompt({
      message: "Pick",
      options: [
        { value: "a", label: "a" },
        { value: "b", label: "b" },
      ],
      initialIndex: 1,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream,
    });

    await Promise.resolve();
    input.emit("data", "\u001b[B");
    input.emit("data", "\r");

    await expect(pending).resolves.toBe("a");
  });

  it("cancels on escape", async () => {
    const { input, output } = createFakeTty();
    const pending = selectPrompt({
      message: "Pick",
      options: [{ value: 1, label: "one" }],
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream,
    });

    await Promise.resolve();
    input.emit("data", "\u001b");

    await expect(pending).rejects.toBeInstanceOf(SelectCancelledError);
  });

  it("rejects when stdin is not a TTY", async () => {
    const { input, output } = createFakeTty();
    input.isTTY = false;

    await expect(
      selectPrompt({
        message: "Pick",
        options: [{ value: 1, label: "one" }],
        input: input as unknown as NodeJS.ReadStream,
        output: output as unknown as NodeJS.WriteStream,
      }),
    ).rejects.toThrow(/requires a TTY/);
  });

  it("rejects an empty options list", async () => {
    const { input, output } = createFakeTty();
    await expect(
      selectPrompt({
        message: "Pick",
        options: [],
        input: input as unknown as NodeJS.ReadStream,
        output: output as unknown as NodeJS.WriteStream,
      }),
    ).rejects.toThrow(/at least one option/);
  });
});
