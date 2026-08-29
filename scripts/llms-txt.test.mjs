import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "../apps/web/lib/llms-txt.ts";

const LIGHTHOUSE_H1 = /^\s*#\s+.+/m;
const LIGHTHOUSE_MARKDOWN_LINK = /\[.+\]\(.+\)/;

describe("llms.txt", () => {
  it("satisfies Lighthouse H1, markdown-link, and length checks", () => {
    const content = buildLlmsTxt({
      siteUrl: "https://www.aipm-registry.com",
      cliVersion: "1.2.3",
      cliReleaseUrl: "https://example.com/release",
      cliInstallCommand: "npm install -g @aipm-registry/cli",
      cliInstallScriptCommand: "curl -fsSL https://example.com/install.sh | sh",
      cliHomebrewCommand: "brew install aipm",
      cliWindowsInstallCommand: "irm https://example.com/install.ps1 | iex",
      cliScoopCommand: "scoop install aipm",
    });

    expect(LIGHTHOUSE_H1.test(content)).toBe(true);
    expect(LIGHTHOUSE_MARKDOWN_LINK.test(content)).toBe(true);
    expect(content.length).toBeGreaterThanOrEqual(50);
    expect(content).toContain("[Website](https://www.aipm-registry.com)");
    expect(content).toContain("[Security and privacy](https://www.aipm-registry.com/security)");
  });
});
