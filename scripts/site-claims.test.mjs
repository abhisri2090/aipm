import { describe, expect, it } from "vitest";
import nextConfig from "../apps/web/next.config";
import sitemap from "../apps/web/lib/static-sitemap";
import { SEO_GUIDES } from "../apps/web/lib/seo-guides";
import { DOC_NAV_SECTIONS } from "../apps/web/lib/docs-nav";
import { SKILL_DISCOVERY_PAGES } from "../apps/web/lib/skill-discovery";
import { buildLlmsTxt } from "../apps/web/lib/llms-txt";
import { pageMetadata } from "../apps/web/lib/seo";

const RETIRED = {
  "/guides/agent-package-manager": "/guides/ai-package-manager",
  "/guides/prompt-package-manager": "/guides/share-ai-prompts-team",
  "/guides/mcp-package-manager": "/guides/mcp-json-guide-cursor-claude",
  "/guides/agents-md-skill-md": "/guides/agents-md-vs-skill-md",
};

function followRedirect(redirects, start) {
  const hops = [];
  const seen = new Set();
  let current = start;
  while (true) {
    const rule = redirects.find((item) => item.source === current);
    if (!rule) return { final: current, hops };
    if (seen.has(current)) throw new Error(`redirect loop at ${current}`);
    seen.add(current);
    hops.push({ from: current, to: rule.destination, statusCode: rule.statusCode });
    if (hops.length > 4) throw new Error(`redirect chain from ${start}`);
    current = rule.destination;
  }
}

const llms = buildLlmsTxt({
  siteUrl: "https://www.aipm-registry.com",
  cliVersion: "1.2.3",
  cliReleaseUrl: "https://example.com/release",
  cliInstallCommand: "npm install -g @aipm-registry/cli",
  cliInstallScriptCommand: "curl -fsSL https://example.com/install.sh | sh",
  cliHomebrewCommand: "brew install aipm",
  cliWindowsInstallCommand: "irm https://example.com/install.ps1 | iex",
  cliScoopCommand: "scoop install aipm",
});

const guideText = (guide) => JSON.stringify(guide);

describe("retired guide URLs", () => {
  it("301 to existing, product-accurate guides", async () => {
    const redirects = await nextConfig.redirects();
    const slugs = new Set(SEO_GUIDES.map((guide) => `/guides/${guide.slug}`));
    for (const [from, to] of Object.entries(RETIRED)) {
      const rule = redirects.find((item) => item.source === from);
      expect(rule, from).toMatchObject({ destination: to, statusCode: 301 });
      expect(rule.permanent, from).toBeUndefined();
      expect(slugs.has(to), to).toBe(true);
      expect(slugs.has(from), from).toBe(false);
      const followed = followRedirect(redirects, from);
      expect(followed.hops, from).toEqual([{ from, to, statusCode: 301 }]);
      expect(followed.final, from).toBe(to);
      expect(followRedirect(redirects, to).hops, `${to} must not redirect`).toEqual([]);
    }
    expect(redirects.find((item) => item.source === "/guides/ai-package-manager")).toBeUndefined();
    expect(followRedirect(redirects, "/guides/ai-package-manager").final).toBe("/guides/ai-package-manager");
  });

  it("keeps /guides/ai-package-manager as the only package-manager URL in the sitemap, with a self canonical", async () => {
    const guide = SEO_GUIDES.find((item) => item.slug === "ai-package-manager");
    expect(guide).toBeDefined();
    expect(SEO_GUIDES.some((item) => item.slug === "agent-package-manager")).toBe(false);
    const meta = pageMetadata({
      title: guide.title,
      description: guide.description,
      path: `/guides/${guide.slug}`,
    });
    expect(meta.alternates.canonical).toBe("https://www.aipm-registry.com/guides/ai-package-manager");
    expect(meta.robots).toBeUndefined();

    const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(paths.filter((path) => path === "/guides/ai-package-manager")).toEqual(["/guides/ai-package-manager"]);
    expect(paths).not.toContain("/guides/agent-package-manager");
    expect(paths).toContain("/guides/agents-md-vs-skill-md");
    expect(paths).not.toContain("/guides/agents-md-skill-md");
  });

  it("are gone from the sitemap, docs nav, and llms.txt", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    const navHrefs = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    for (const from of Object.keys(RETIRED)) {
      expect(urls.some((url) => url.endsWith(from)), from).toBe(false);
      expect(navHrefs, from).not.toContain(from);
      expect(llms, from).not.toContain(from);
    }
  });
});

describe("SEO copy matches CLI behaviour", () => {
  it("does not claim AIPM installs rules, MCP, AGENTS.md, or per-tool files", () => {
    for (const guide of SEO_GUIDES) {
      const text = guideText(guide);
      expect(text, guide.slug).not.toMatch(/different file for each AI tool/i);
      expect(text, guide.slug).not.toMatch(/installs AI skill files, prompts, rules/i);
      expect(text, guide.slug).not.toMatch(/package reusable MCP instructions with AIPM/i);
      expect(text, guide.slug).not.toMatch(/frozen|version ranges? (are|is) supported|integrity-verified/i);
    }
    expect(llms).not.toMatch(/skills, prompts, rules, and tool files/);
  });

  it("tells Cursor users to install with --target cursor", () => {
    const cursorGuide = SEO_GUIDES.find((guide) => guide.slug === "how-to-install-cursor-skills");
    expect(cursorGuide.answer).toContain("--target cursor");
    expect(cursorGuide.answer).toContain(".cursor/skills/<skill>/SKILL.md");
    expect(cursorGuide.steps.join(" ")).toContain("--target cursor");
    const cursorHub = SKILL_DISCOVERY_PAGES.find((page) => page.slug === "cursor");
    expect(cursorHub.installCommands.map((command) => command.code).join(" ")).toContain("--target cursor");
  });

  it("lists Codex as a supported target", () => {
    const codexGuide = SEO_GUIDES.find((guide) => guide.slug === "claude-code-skills-vs-codex-skills");
    expect(guideText(codexGuide)).toContain(".agents/skills/<skill>/SKILL.md");
    expect(llms).toContain("codex (.agents/skills/<skill>/SKILL.md)");
  });
});
