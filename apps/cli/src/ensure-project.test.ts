import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureProjectOrOffer } from "./ensure-project.js";

vi.mock("./ui/recover.js", () => ({
  offerChoices: vi.fn(),
}));

vi.mock("./prompt.js", () => ({
  promptForTool: vi.fn(async () => "cursor"),
}));

import { offerChoices } from "./ui/recover.js";

describe("ensureProjectOrOffer", () => {
  beforeEach(() => {
    vi.mocked(offerChoices).mockReset();
  });

  it("returns ready when project already exists", async () => {
    const project = {
      schemaVersion: "0.1" as const,
      registry: "https://api.example.test",
      packages: {},
      prompts: {},
    };
    const result = await ensureProjectOrOffer({
      scope: {},
      project,
      registry: "https://api.example.test",
      allowNoInit: true,
      command: "add",
    });
    expect(result).toEqual({ action: "ready", project });
    expect(offerChoices).not.toHaveBeenCalled();
  });

  it("throws classic init error in CI when project is missing", async () => {
    vi.mocked(offerChoices).mockImplementation(async (opts) => {
      throw new Error(opts.fallbackError);
    });
    await expect(
      ensureProjectOrOffer({
        scope: {},
        project: null,
        ci: true,
        registry: "https://api.example.test",
        allowNoInit: true,
        command: "add",
      }),
    ).rejects.toThrow(/aipm init/);
  });

  it("returns no-init when the user chooses it", async () => {
    vi.mocked(offerChoices).mockResolvedValueOnce("no-init");
    const result = await ensureProjectOrOffer({
      scope: {},
      project: null,
      registry: "https://api.example.test",
      allowNoInit: true,
      command: "add",
    });
    expect(result).toEqual({ action: "no-init" });
  });
});
