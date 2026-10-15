import { describe, expect, it } from "vitest";
import { scanReleasePlumbing } from "./check-release-plumbing.mjs";

describe("scanReleasePlumbing", () => {
  it("passes on the current release plumbing", () => {
    expect(scanReleasePlumbing()).toEqual([]);
  });
});
