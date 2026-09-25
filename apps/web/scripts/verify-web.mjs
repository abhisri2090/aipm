#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_URL = "https://www.aipm-registry.com";
const positionalUrl = process.argv.find((arg, index) => index > 1 && !arg.startsWith("--"));
const baseUrl = new URL(positionalUrl ?? process.env.WEB_URL ?? DEFAULT_URL);
const expectedCanonicalUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_URL).replace(/\/$/, "");
const allowHttp =
  process.argv.includes("--allow-http") || baseUrl.hostname === "127.0.0.1" || baseUrl.hostname === "localhost";
const timeoutMs = Number(process.env.VERIFY_TIMEOUT_MS ?? 8000);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

if (baseUrl.protocol !== "https:" && !allowHttp) {
  fail(`Refusing to verify non-HTTPS URL ${baseUrl.href}. Pass --allow-http for local checks.`);
}

baseUrl.pathname = baseUrl.pathname.replace(/\/+$/, "");
baseUrl.search = "";
baseUrl.hash = "";

const requiredPages = [
  {
    path: "/",
    title: "Claude & Agent Skills Marketplace — Install with AIPM",
    renderedTitle: "Claude &amp; Agent Skills Marketplace — Install with AIPM",
    h1: "Claude and agent skills you can install like packages.",
    jsonLd: true,
    includes: ["What is AIPM?", "AIPM is a Claude and agent skills marketplace", "/best-claude-skills", "/guides/what-are-claude-skills", "Abhishek Srivastava", "aipm add @scope/name@version"],
  },
  {
    path: "/registry",
    canonicalPath: "/skills",
    title: "Search the AIPM Skills Registry",
    h1: "AI agent skills registry for Claude Code, Cursor, and more",
    jsonLd: true,
  },
  {
    path: "/skills",
    title: "Agent Skills Marketplace for Claude, Cursor & Codex",
    renderedTitle: "Agent Skills Marketplace for Claude, Cursor &amp; Codex | AIPM",
    h1: "AI agent skills registry for Claude Code, Cursor, and more",
    jsonLd: true,
    includes: ["Claude Code", "Cursor"],
  },
  {
    path: "/prompts",
    title: "AI Prompt Directory: Gemini, Claude & ChatGPT Prompts",
    renderedTitle: "AI Prompt Directory: Gemini, Claude &amp; ChatGPT Prompts | AIPM",
    h1: "Gemini, Claude, and ChatGPT prompts that already work.",
    jsonLd: true,
    includes: ["Browse all prompts", "Category", "Output", "/prompts/topics/gemini-prompts", "/prompts/topics/claude-prompts"],
  },
  {
    path: "/prompts/topics/gemini-prompts",
    title: "Gemini Prompts: Tested Prompts for Google Gemini",
    h1: "Gemini prompts for research, work, and photos",
    jsonLd: true,
    includes: ["Curated prompts", "/prompts/aipm/gemini-linkedin-headshot-nano-banana"],
  },
  {
    path: "/prompts/topics/claude-prompts",
    title: "Claude Prompts: Tested Prompts for Claude",
    h1: "Claude prompts for code, analysis, and writing",
    jsonLd: true,
    includes: ["Curated prompts", "/prompts/aipm/code-review-prompt-that-checks-if-it-actually-works"],
  },
  {
    path: "/prompts/topics/nano-banana-prompts",
    title: "Nano Banana Prompts: Gemini Photo Editing Prompts",
    h1: "Nano Banana prompts that keep your real face",
    jsonLd: true,
    includes: ["Curated prompts", "/prompts/aipm/selfie-studio-backdrop-swap"],
  },
  {
    path: "/publish",
    title: "Publish an AI Agent Skill to the AIPM Registry",
    h1: "Publish AI skills so others can install them.",
    jsonLd: false,
    includes: ["AI package distribution", "MCP setup", "What teams can share", "/publish/guide"],
  },
  {
    path: "/publish/guide",
    title: "AIPM Publishing Guide - Create and Publish AI Skills",
    h1: "Create a skill package and publish it.",
    jsonLd: false,
    includes: ["install guide", "skill templates guide", "aipm publish init"],
  },
  {
    path: "/use",
    title: "Use AIPM - Install AI Skills Into Your Project",
    h1: "Install AI skills into your project.",
    jsonLd: false,
  },
  {
    path: "/install",
    title: "Install AIPM CLI on macOS, Linux, or Windows",
    h1: "Install the AIPM CLI.",
    jsonLd: false,
    includes: ["via Homebrew", "via Scoop", "aipm --version", "aipm doctor"],
  },
  {
    path: "/commands",
    title: "AIPM CLI Commands",
    h1: "Every AIPM command in one place.",
    jsonLd: false,
    includes: ["Install the CLI", "aipm publish init", "aipm add @scope/name@1.0.0 --target cursor --ci"],
  },
  {
    path: "/targets",
    title: "AIPM Supported Targets",
    h1: "Choose where AIPM should install a skill.",
    jsonLd: true,
    includes: [".cursor/aipm/skills/&lt;skill&gt;.md", ".claude/skills/&lt;skill&gt;/SKILL.md", "--target claude"],
    // The Claude adapter (packages/adapter-claude) writes .claude/skills/<name>/, not .claude/aipm/skills.
    excludes: [".claude/aipm/skills"],
  },
  {
    path: "/resources",
    title: "AI Skill Resources",
    h1: "Find the guide you need.",
    jsonLd: false,
  },
  {
    path: "/compatibility",
    title: "AI Agent File Support for Cursor, Claude and Codex",
    h1: "Which AI agent files work with Cursor, Claude Code, and Codex?",
    jsonLd: true,
    includes: ["Which file works where?", "AGENTS.md", "CLAUDE.md", "Last checked: 25 September 2026", "AIPM does not install AGENTS.md"],
  },
  {
    path: "/guides/cursor-rules-vs-agent-skills",
    title: "Cursor Rules vs Skills: Differences and When to Use",
    h1: "Cursor rules vs skills: what is the difference?",
    jsonLd: true,
    includes: ["Short answer", "/migrate-to-skills", ".cursor/skills"],
  },
  {
    path: "/guides/cursor-rules-vs-agents-md",
    title: "Does Cursor Read AGENTS.md? Cursor Rules vs AGENTS.md",
    h1: "Does Cursor read AGENTS.md, and should you use it or Cursor rules?",
    jsonLd: true,
    includes: ["Short answer", "Does Claude Code read AGENTS.md?", "v2.1.277"],
  },
  {
    path: "/guides/agents-md-vs-skill-md",
    title: "AGENTS.md vs SKILL.md: Which File Does What?",
    h1: "AGENTS.md vs SKILL.md: what is the difference?",
    jsonLd: true,
    includes: ["Short answer", "Which tools read which file", ".agents/skills"],
  },
  {
    path: "/guides/components-of-an-ai-agent",
    title: "Components of an AI Agent",
    h1: "What are the main components of an AI agent?",
    jsonLd: true,
    includes: ["Short answer", "Model", "Instructions and goals", "Safety and human control"],
  },
  {
    path: "/guides/aipm-vs-skills-sh",
    title: "AIPM vs Skills.sh — Skills.sh Alternative for Versioned Agent Skills",
    h1: "Looking for a skills.sh alternative? Here is how AIPM compares.",
    jsonLd: true,
    includes: ["Short answer", "Where they overlap", "How AIPM is different"],
  },
  {
    path: "/guides/claude-code-skills-vs-codex-skills",
    title: "Claude Code Skills vs Codex Skills",
    h1: "What is the difference between Claude Code skills and Codex skills?",
    jsonLd: true,
    includes: ["Short answer", "The shared idea", "Sharing across a team"],
  },
  {
    path: "/guides/agent-skills-vs-mcp",
    title: "Agent Skills vs MCP",
    h1: "What is the difference between Agent Skills and MCP?",
    jsonLd: true,
    includes: ["Short answer", "Use a skill for repeatable instructions", "Use MCP for a connection"],
  },
  {
    path: "/guides/how-to-install-claude-code-skills",
    title: "How to Install Claude Skills (App, Code, GitHub, npx)",
    h1: "How do you install Claude skills?",
    jsonLd: true,
    includes: ["Short answer", "Customize &gt; Skills", "~/.claude/skills/", "npx skills add", "aipm init --target claude"],
  },
  {
    path: "/guides/how-to-install-cursor-skills",
    title: "How to Install Cursor AI Skills",
    h1: "How do you install an AI skill for Cursor?",
    jsonLd: true,
    includes: ["Short answer", "aipm init --target claude", "Why not --target cursor?", ".agents/skills"],
  },
  {
    path: "/guides/how-to-create-agent-skill",
    title: "How to Create an Agent Skill",
    h1: "How do you create a reusable Agent Skill?",
    jsonLd: true,
    includes: ["Short answer", "Give the skill one job", "aipm publish validate", "/guides/skill-md-frontmatter-reference"],
  },
  {
    path: "/guides/skill-md-frontmatter-reference",
    title: "SKILL.md Frontmatter Reference: Every Field &amp; Limit",
    h1: "SKILL.md frontmatter reference: every field, limit and error",
    jsonLd: true,
    includes: [
      "Short answer",
      'id="one-table-which-fields-work-where"',
      'id="frontmatter-errors-and-how-to-fix-them"',
      "Unexpected key(s) in SKILL.md frontmatter",
      "allow_implicit_invocation",
      "skills-ref validate ./my-skill",
      "aipm publish validate",
      '"@type":"FAQPage"',
    ],
  },
  {
    path: "/best-claude-skills",
    title: "Best Claude Skills: Ranked by GitHub Stars and Installs",
    h1: "Best Claude skills, ranked with real registry data",
    jsonLd: true,
    includes: ["How this list is ranked", "Top Claude skill collections by GitHub stars", "/guides/what-are-claude-skills"],
  },
  {
    path: "/publishers",
    title: "AI Skill Publishers",
    h1: "Meet the people and orgs behind public skills.",
    jsonLd: true,
    includes: ["Publisher name or handle"],
  },
  {
    path: "/publishers/microsoft",
    title: "Microsoft AI Skills",
    h1: "Microsoft",
    jsonLd: true,
    includes: ["/skills/microsoft/", "has not claimed the AIPM account yet"],
  },
  {
    path: "/skills/cursor",
    title: "Cursor Skills Registry — Browse & Install",
    renderedTitle: "Cursor Skills Registry — Browse &amp; Install | AIPM",
    h1: "Cursor skills you can review, version, and install.",
    jsonLd: true,
    includes: ["Search registry", "Browse more skill categories"],
  },
  {
    path: "/skills/claude",
    title: "Claude Skills Marketplace: Claude Code Skills Library",
    h1: "Claude Code skills you can review, version, and install.",
    jsonLd: true,
    includes: ["Search registry", "Browse more skill categories"],
  },
  {
    path: "/skills/code-review",
    title: "Code Review AI Skills",
    h1: "Find AI skills for code review.",
    jsonLd: true,
    includes: ["Search registry", "Browse more skill categories"],
  },
  {
    path: "/skills/issue-summarizer",
    title: "Issue Summarizer AI Skills",
    h1: "Find AI skills for issue summaries and triage.",
    jsonLd: true,
    includes: ["Search registry", "Browse more skill categories"],
  },
  {
    path: "/skills/testing",
    title: "Testing AI Skills",
    h1: "Find AI skills for test writing and verification.",
    jsonLd: true,
    includes: ["Search registry", "Browse more skill categories"],
  },
  {
    path: "/skills/documentation",
    title: "Documentation AI Skills",
    h1: "Find AI skills for documentation.",
    jsonLd: true,
    includes: ["Search registry", "Browse more skill categories"],
  },
  {
    path: "/examples",
    title: "Claude Code & Cursor Skill Examples",
    renderedTitle: "Claude Code &amp; Cursor Skill Examples | AIPM",
    h1: "Skill publishing examples.",
    jsonLd: true,
    includes: [
      "Code review AI skill for Cursor",
      "Sentry issue summariser AI skill for Claude",
      "Import an existing Codex AI skill folder",
    ],
  },
  {
    path: "/glossary",
    title: "AIPM Glossary — Agent Skills Terms",
    h1: "Simple definitions for AIPM terms.",
    jsonLd: true,
    includes: ["Publish token", "Org namespace", ".aipmignore"],
  },
  {
    path: "/ai-practices",
    title: "AI Skill Best Practices for Reusable Assistant Workflows",
    h1: "Build AI skills that are clear, safe, and reusable.",
    jsonLd: true,
  },
  {
    path: "/discoverability",
    title: "AI Skill SEO and Discoverability Guide",
    h1: "Help users find and understand your skill.",
    jsonLd: true,
  },
  {
    path: "/security",
    title: "AIPM Security Guide for Publishing AI Skills Safely",
    h1: "Publish AI skills without leaking private files.",
    jsonLd: true,
    includes: [".aipmignore", "aipm publish preview", "security contact channel"],
  },
  {
    path: "/privacy",
    title: "AIPM Privacy Notice",
    h1: "Know what is public and what should stay private.",
    jsonLd: true,
    includes: ["Publisher profile", "Short-lived publish tokens", "What becomes public"],
  },
  {
    path: "/terms",
    title: "AIPM Acceptable Use Policy for AI Skill Packages",
    h1: "Use AIPM to share helpful AI skills.",
    jsonLd: true,
    includes: ["Rules for publishers", "Registry moderation", "formal takedown and appeal process"],
  },
  {
    path: "/status",
    title: "AIPM Registry Status",
    h1: "Check if the AIPM registry is working.",
    jsonLd: true,
    includes: ["/health", "/ready", "Check from the command line"],
  },
  {
    path: "/roadmap",
    title: "AIPM Roadmap for AI Package Manager Features",
    h1: "See what AIPM is building next.",
    jsonLd: true,
    includes: ["Available now", "Near term reliability", "Trust and registry depth"],
  },
  {
    path: "/changelog",
    title: "AIPM Changelog and AI Package Manager Release Notes",
    h1: "See what changed in AIPM.",
    jsonLd: true,
    includes: ["Public trust and status pages", "Publisher account and dashboard", "@aipm-registry/cli"],
  },
  {
    path: "/templates",
    title: "SKILL.md Template and Examples for AI Agent Skills",
    h1: "SKILL.md template and examples",
    jsonLd: true,
    includes: [
      "--template code-review",
      "--template issue-summary",
      "--template release-notes",
      "/guides/skill-md-frontmatter-reference#one-table-which-fields-work-where",
      'id="frontmatter-checklist-before-you-publish"',
    ],
  },
  {
    path: "/thanks",
    title: "Special Thanks to the AI Community",
    h1: "AI tools are built on shared work.",
    jsonLd: true,
    includes: ["Global conferences &amp; communities", "NeurIPS", "ICLR", "CVPR", "AI Engineer"],
  },
  {
    path: "/faq",
    title: "AIPM FAQ — Install Claude Code & Cursor Skills",
    renderedTitle: "AIPM FAQ — Install Claude Code &amp; Cursor Skills | AIPM",
    h1: "Common questions and fixes.",
    jsonLd: false,
  },
  {
    path: "/guides/ai-package-manager",
    title: "What Is an AI Package Manager?",
    h1: "What is an AI package manager?",
    jsonLd: true,
    includes: ["Short answer", "AIPM gives you a registry and a CLI", "What AIPM installs today", "Is an AI package manager the same as npm?"],
  },
  {
    path: "/guides/version-ai-prompts",
    title: "How to Version AI Prompts in a Repo",
    h1: "How do you version AI prompts in a repo?",
    jsonLd: true,
    includes: ["Short answer", "Move prompts out of chat", "Why not keep prompts only in a shared document?"],
  },
  {
    path: "/guides/share-cursor-rules",
    title: "How to Share Cursor Rules Across a Team",
    h1: "How do you share Cursor rules across a team?",
    jsonLd: true,
    includes: ["Short answer", "Cursor rules should be visible", "Does AIPM replace Cursor?"],
  },
  {
    path: "/guides/reusable-claude-skills",
    title: "How to Publish Reusable Claude Skills",
    h1: "How do you publish reusable Claude skills?",
    jsonLd: true,
    includes: ["Short answer", "Start with one repeated job", "What should a beginner include first?"],
  },
  {
    path: "/guides/ai-agent-instructions-git",
    title: "How to Manage AI Agent Instructions in Git",
    h1: "How do you manage AI agent instructions in Git?",
    jsonLd: true,
    includes: ["Short answer", "Instructions are part of the project", "Why put AI instructions in Git?"],
  },  {
    path: "/guides/what-are-claude-skills",
    title: "What Are Claude Skills? How They Work, With Examples",
    h1: "What are Claude skills?",
    jsonLd: true,
    includes: ["Short answer", "How a Claude skill works", "Customize &gt; Skills"],
  },
  {
    path: "/guides/claude-code-plugins-vs-skills",
    title: "Claude Code Plugins vs Skills: Differences Explained",
    h1: "Claude Code plugins vs skills: which do you need?",
    jsonLd: true,
    includes: ["Short answer", ".claude-plugin/plugin.json", "/plugin marketplace add"],
  },
  {
    path: "/guides/claude-skills-marketplaces",
    title: "Claude Skills Marketplaces Compared: Where to Get Skills",
    h1: "Where can you find Claude skills? Marketplaces compared",
    jsonLd: true,
    includes: ["Comparison table", "SkillsMP", "skills.sh", "claude-plugins-official"],
  },

];

const privatePages = ["/login", "/cli/login", "/dashboard", "/dashboard/skills", "/dashboard/profile", "/dashboard/orgs/new"];

const requiredHeaders = [
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "content-security-policy",
];

function urlFor(path) {
  const url = new URL(baseUrl.href);
  url.pathname = `${baseUrl.pathname}${path}`.replace(/\/{2,}/g, "/");
  return url;
}

function fail(message) {
  console.error(`Verification failed: ${message}`);
  process.exit(1);
}

async function fetchText(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = urlFor(path);
  try {
    const response = await fetch(url, {
      ...init,
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    return { response, text, url };
  } catch (error) {
    fail(`${url.href} is not reachable: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

/** Optional registry API probes — skip quietly on timeout/network errors. */
async function tryFetchText(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = urlFor(path);
  try {
    const response = await fetch(url, {
      ...init,
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    return { response, text, url };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function assertStatus(path, response, expected = 200) {
  if (response.status !== expected) {
    fail(`${path} returned ${response.status}; expected ${expected}`);
  }
}

function assertIncludes(path, text, expected) {
  if (!text.includes(expected)) {
    fail(`${path} does not include expected text: ${expected}`);
  }
}

function assertCanonicalSitemapHosts(path, xml) {
  const expectedOrigin = new URL(expectedCanonicalUrl).origin;
  const locations = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
  for (const location of locations) {
    if (new URL(location).origin !== expectedOrigin) {
      fail(`${path} contains a non-canonical URL: ${location}`);
    }
  }
}

function extractJsonLd(html) {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  return Array.from(matches, (match) => match[1]?.trim()).filter(Boolean);
}

function packagePath(packageName, version) {
  const [scope, name] = packageName.replace(/^@/, "").split("/");
  return `/skills/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(name ?? "")}/${encodeURIComponent(version)}`;
}

console.log(`Verifying web app: ${baseUrl.href.replace(/\/$/, "")}`);

const homeHead = await fetchText("/", { method: "HEAD" });
assertStatus("/", homeHead.response);

if (baseUrl.protocol === "https:") {
  for (const header of requiredHeaders) {
    if (!homeHead.response.headers.has(header)) {
      fail(`Missing security header on /: ${header}`);
    }
  }
}

if (baseUrl.hostname === "www.aipm-registry.com") {
  const canonicalOrigin = new URL(expectedCanonicalUrl).origin;
  for (const alias of ["https://aipm-registry.com/", "http://aipm-registry.com/", "http://www.aipm-registry.com/"]) {
    const response = await fetch(alias, { redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
    if (!response.redirected || new URL(response.url).origin !== canonicalOrigin) {
      fail(`${alias} does not redirect to the canonical origin ${canonicalOrigin}`);
    }
  }
}

for (const page of requiredPages) {
  const { response, text } = await fetchText(page.path);
  assertStatus(page.path, response);
  const renderedTitle = page.renderedTitle ?? `${page.title} | AIPM`;
  assertIncludes(page.path, text, `<title>${renderedTitle}</title>`);
  assertIncludes(page.path, text, page.h1);

  const canonicalPath = page.canonicalPath ?? page.path;
  const canonical = `${expectedCanonicalUrl}${canonicalPath === "/" ? "" : canonicalPath}`;
  assertIncludes(page.path, text, `rel="canonical" href="${canonical}"`);

  if (page.jsonLd && extractJsonLd(text).length === 0) {
    fail(`${page.path} is missing JSON-LD structured data`);
  }

  if (page.path === "/") {
    const jsonLd = extractJsonLd(text).join("\n");
    assertIncludes("/", jsonLd, '"@type":"Organization"');
    assertIncludes("/", jsonLd, '"@type":"Person"');
    assertIncludes("/", jsonLd, '"@type":"SoftwareApplication"');
    assertIncludes("/", jsonLd, '"name":"AIPM CLI"');
  }

  for (const expected of page.includes ?? []) {
    assertIncludes(page.path, text, expected);
  }
  for (const unexpected of page.excludes ?? []) {
    if (text.includes(unexpected)) fail(`${page.path} still contains "${unexpected}"`);
  }
}

const homePage = await fetchText("/");
assertIncludes("/", homePage.text, "Footer navigation");
assertIncludes("/", homePage.text, 'href="/security"');
assertIncludes("/", homePage.text, 'href="/privacy"');
assertIncludes("/", homePage.text, 'href="/terms"');
assertIncludes("/", homePage.text, 'href="/status"');
assertIncludes("/", homePage.text, 'href="/roadmap"');
assertIncludes("/", homePage.text, 'href="/changelog"');
assertIncludes("/", homePage.text, 'href="/templates"');
assertIncludes("/", homePage.text, 'href="/targets"');
assertIncludes("/", homePage.text, 'href="/examples"');
assertIncludes("/", homePage.text, 'href="/glossary"');
assertIncludes("/", homePage.text, 'href="/guides/ai-package-manager"');
assertIncludes("/", homePage.text, "Installs today");
assertIncludes("/", homePage.text, "Planned");
if (homePage.text.includes('href="/guides/agent-package-manager"')) {
  fail("/ still links the retired /guides/agent-package-manager guide");
}
assertIncludes("/", homePage.text, 'href="/guides/version-ai-prompts"');
assertIncludes("/", homePage.text, 'href="/guides/cursor-rules-vs-agent-skills"');
assertIncludes("/", homePage.text, 'href="/guides/agents-md-vs-skill-md"');
assertIncludes("/", homePage.text, 'href="/research/state-of-agent-skills-2026"');

for (const path of privatePages) {
  const { response, text } = await fetchText(path);
  assertStatus(path, response);
  assertIncludes(path, text, "noindex");
  assertIncludes(path, text, "nofollow");
}

{
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(urlFor("/dashboard/packages"), {
      redirect: "manual",
      signal: controller.signal,
    });
    const location = response.headers.get("location") ?? "";
    if (![301, 302, 307, 308].includes(response.status) || !location.includes("/dashboard/skills")) {
      fail(
        `/dashboard/packages did not redirect to /dashboard/skills (status ${response.status}, location ${location})`,
      );
    }
  } catch (error) {
    fail(`/dashboard/packages redirect check failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

for (const [from, to] of [
  ["/guides/agent-package-manager", "/guides/ai-package-manager"],
  ["/guides/prompt-package-manager", "/guides/share-ai-prompts-team"],
  ["/guides/mcp-package-manager", "/guides/mcp-json-guide-cursor-claude"],
]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(urlFor(from), { redirect: "manual", signal: controller.signal });
    const location = response.headers.get("location") ?? "";
    if (response.status !== 301 || !location.endsWith(to)) {
      fail(`${from} did not 301 to ${to} (status ${response.status}, location ${location})`);
    }
  } catch (error) {
    fail(`${from} redirect check failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

const robots = await fetchText("/robots.txt");
assertStatus("/robots.txt", robots.response);
assertIncludes("/robots.txt", robots.text, `Sitemap: ${expectedCanonicalUrl}/sitemap.xml`);
assertIncludes("/robots.txt", robots.text, `Sitemap: ${expectedCanonicalUrl}/ai-skills-sitemap.xml`);
assertIncludes("/robots.txt", robots.text, `Sitemap: ${expectedCanonicalUrl}/prompt-sitemap.xml`);
assertIncludes("/robots.txt", robots.text, "Disallow: /dashboard");

const sitemap = await fetchText("/sitemap.xml");
assertStatus("/sitemap.xml", sitemap.response);
assertCanonicalSitemapHosts("/sitemap.xml", sitemap.text);
if (sitemap.text.includes("/dashboard/packages") || /<loc>[^<]*\/packages\//.test(sitemap.text)) {
  fail("/sitemap.xml still contains /packages URLs");
}
for (const path of [
  "/skills",
  "/prompts",
  "/publishers",
  "/best-claude-skills",
  "/publish",
  "/publish/guide",
  "/publish/github",
  "/install",
  "/use",
  "/commands",
  "/targets",
  "/resources",
  "/skills/cursor",
  "/skills/claude",
  "/skills/code-review",
  "/skills/issue-summarizer",
  "/skills/testing",
  "/skills/documentation",
  "/guides/ai-package-manager",
  "/guides/version-ai-prompts",
  "/guides/share-cursor-rules",
  "/guides/reusable-claude-skills",
  "/guides/ai-agent-instructions-git",
  "/guides/cursor-rules-vs-agent-skills",
  "/guides/agents-md-vs-skill-md",
  "/guides/what-are-claude-skills",
  "/guides/claude-code-plugins-vs-skills",
  "/guides/claude-skills-marketplaces",
  "/research/state-of-agent-skills-2026",
  "/examples",
  "/glossary",
  "/discoverability",
  "/security",
  "/privacy",
  "/terms",
  "/status",
  "/roadmap",
  "/changelog",
  "/templates",
  "/guides/skill-md-frontmatter-reference",
  "/thanks",
]) {
  assertIncludes("/sitemap.xml", sitemap.text, `<loc>${expectedCanonicalUrl}${path}</loc>`);
}
assertIncludes("/sitemap.xml", sitemap.text, "<lastmod>");
if (sitemap.text.includes(`<loc>${expectedCanonicalUrl}/registry</loc>`)) {
  fail("/sitemap.xml contains the duplicate /registry landing page.");
}
for (const retired of ["agent-package-manager", "prompt-package-manager", "mcp-package-manager"]) {
  if (sitemap.text.includes(`/guides/${retired}</loc>`)) {
    fail(`/sitemap.xml still lists the redirected /guides/${retired} guide.`);
  }
}

const research = await fetchText("/research/state-of-agent-skills-2026");
assertStatus("/research/state-of-agent-skills-2026", research.response);
assertIncludes("/research/state-of-agent-skills-2026", research.text, "State of AI Agent Skills 2026");
assertIncludes("/research/state-of-agent-skills-2026", research.text, "Trust signals in the registry");
assertIncludes("/research/state-of-agent-skills-2026", research.text, '"@type":"Dataset"');

const researchDataset = await fetchText("/research/agent-skills-2026.json");
assertStatus("/research/agent-skills-2026.json", researchDataset.response);
const researchData = JSON.parse(researchDataset.text);
if (!Array.isArray(researchData.packages) || typeof researchData.totals?.packages !== "number") {
  fail("/research/agent-skills-2026.json does not contain the expected reproducible dataset.");
}

const skillsSitemap = await fetchText("/ai-skills-sitemap.xml");
assertStatus("/ai-skills-sitemap.xml", skillsSitemap.response);
assertCanonicalSitemapHosts("/ai-skills-sitemap.xml", skillsSitemap.text);
if (
  skillsSitemap.text.includes("/dashboard/packages") ||
  /<loc>[^<]*\/packages\//.test(skillsSitemap.text)
) {
  fail("/ai-skills-sitemap.xml still contains /packages URLs");
}
assertIncludes(
  "/ai-skills-sitemap.xml",
  skillsSitemap.text,
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
);

const promptSitemap = await fetchText("/prompt-sitemap.xml");
assertStatus("/prompt-sitemap.xml", promptSitemap.response);
assertCanonicalSitemapHosts("/prompt-sitemap.xml", promptSitemap.text);
assertIncludes(
  "/prompt-sitemap.xml",
  promptSitemap.text,
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
);
// Topic hubs live at /prompts/topics/{topic} in the static sitemap; individual
// prompt pages are /prompts/{publisher}/{slug} and belong in prompt-sitemap.xml.
if (/<loc>[^<]*\/prompts\/(?!topics\/)[^/<]+\/[^/<]+<\/loc>/.test(sitemap.text)) {
  fail("/sitemap.xml contains individual prompt URLs; those belong in /prompt-sitemap.xml.");
}

// Near-duplicate prompt variants (lib/prompt-noindex.json) are noindex and not in the prompt sitemap.
const promptNoindex = JSON.parse(await readFile(resolve(repoRoot, "apps/web/lib/prompt-noindex.json"), "utf8"));
const noindexPromptPaths = new Set(promptNoindex.noindex.map((entry) => entry.path));
for (const path of noindexPromptPaths) {
  if (promptSitemap.text.includes(`<loc>${expectedCanonicalUrl}${path}</loc>`)) {
    fail(`/prompt-sitemap.xml contains near-duplicate noindex prompt ${path}`);
  }
}
const sampleNoindexPrompt = promptNoindex.noindex[0]?.path;
if (sampleNoindexPrompt) {
  const page = await fetchText(sampleNoindexPrompt);
  if (page.response.ok && !/<meta name="robots" content="noindex, ?follow"/.test(page.text)) {
    fail(`${sampleNoindexPrompt} should render <meta name="robots" content="noindex, follow">`);
  }
}

const promptList = await fetchText("/v1/prompts?limit=1");
if (promptList.response.ok) {
  const data = JSON.parse(promptList.text);
  const prompt = data.prompts?.[0];
  if (prompt?.path && !noindexPromptPaths.has(prompt.path)) {
    assertIncludes("/prompt-sitemap.xml", promptSitemap.text, `<loc>${expectedCanonicalUrl}${prompt.path}</loc>`);
    if (sitemap.text.includes(`<loc>${expectedCanonicalUrl}${prompt.path}</loc>`)) {
      fail(`/sitemap.xml contains prompt URL ${prompt.path}; use /prompt-sitemap.xml.`);
    }
  }
}

const packageList = await fetchText("/v1/skills?limit=1");
if (packageList.response.ok) {
  const data = JSON.parse(packageList.text);
  const pkg = (data.skills ?? data.packages)?.[0];
  if (pkg?.name && pkg?.version) {
    const path = packagePath(pkg.name, pkg.version);
    assertIncludes("/ai-skills-sitemap.xml", skillsSitemap.text, `<loc>${expectedCanonicalUrl}${path}</loc>`);
    const page = await fetchText(path);
    assertStatus(path, page.response);
    assertIncludes(path, page.text, `<title>${pkg.name}@${pkg.version} | AIPM</title>`);
    assertIncludes(path, page.text, `rel="canonical" href="${expectedCanonicalUrl}${path}"`);
    assertIncludes(path, page.text, `aipm add ${pkg.name}@${pkg.version}`);
    assertIncludes(path, page.text, "AI assistant context");
    assertIncludes(path, page.text, "Package FAQ");
    assertIncludes(path, page.text, "Share this skill");
    assertIncludes(path, page.text, "Copy link");
    assertIncludes(path, page.text, "LinkedIn");
    assertIncludes(path, page.text, 'id="aipm-package-context"');
    const jsonLd = extractJsonLd(page.text).join("\n");
    assertIncludes(path, jsonLd, '"@type":"WebPage"');
    assertIncludes(path, jsonLd, '"@type":"SoftwareSourceCode"');
    assertIncludes(path, jsonLd, '"@type":"HowTo"');
    if (jsonLd.includes('"@type":"FAQPage"')) {
      fail(`${path} contains deprecated FAQPage structured data.`);
    }
  }
}

// Publisher detail pages only render for orgs present in listPackages("", 100).
// Prefer /publishers/{slug} entries already emitted in ai-skills-sitemap (same window),
// then probe /publishers directory links — never hardcode a third-party org.
async function assertPublisherDetail(slug, name) {
  const publisherPath = `/publishers/${encodeURIComponent(slug)}`;
  const publisherPage = await fetchText(publisherPath);
  assertStatus(publisherPath, publisherPage.response);
  assertIncludes(publisherPath, publisherPage.text, `<title>${name} AI Skills | AIPM</title>`);
  assertIncludes(publisherPath, publisherPage.text, `<h1>${name}</h1>`);
  assertIncludes(publisherPath, publisherPage.text, `rel="canonical" href="${expectedCanonicalUrl}${publisherPath}"`);
  assertIncludes(publisherPath, publisherPage.text, `/skills/${slug}/`);
  assertIncludes(publisherPath, publisherPage.text, "Account verification confirms account control");
  const claimed = "This publisher has connected the linked GitHub account to AIPM.";
  const unclaimed = "has not claimed the AIPM account yet";
  if (!publisherPage.text.includes(claimed) && !publisherPage.text.includes(unclaimed)) {
    fail(`${publisherPath} is missing publisher claim status copy`);
  }
  const publisherJsonLd = extractJsonLd(publisherPage.text).join("\n");
  if (publisherJsonLd.length === 0) {
    fail(`${publisherPath} is missing JSON-LD structured data`);
  }
  assertIncludes(publisherPath, publisherJsonLd, '"@type":"ProfilePage"');
  assertIncludes(publisherPath, publisherJsonLd, `"name":"${name}"`);
}

const publisherCandidateSlugs = Array.from(
  skillsSitemap.text.matchAll(/<loc>[^<]*\/publishers\/([^/<]+)<\/loc>/g),
  (match) => decodeURIComponent(match[1]),
);

if (publisherCandidateSlugs.length === 0) {
  const directory = await fetchText("/publishers");
  assertStatus("/publishers", directory.response);
  publisherCandidateSlugs.push(
    ...Array.from(
      directory.text.matchAll(/href="\/publishers\/([^"/?]+)"/g),
      (match) => decodeURIComponent(match[1]),
    ),
  );
}

const uniquePublisherSlugs = publisherCandidateSlugs.filter(
  (slug, index, all) => all.indexOf(slug) === index,
);

let publisherVerified = false;
for (const slug of uniquePublisherSlugs.slice(0, 12)) {
  const candidate = await tryFetchText(`/publishers/${encodeURIComponent(slug)}`);
  if (!candidate || candidate.response.status !== 200) continue;
  const h1 = candidate.text.match(/<h1>([^<]+)<\/h1>/)?.[1];
  if (!h1) continue;
  await assertPublisherDetail(slug, h1);
  publisherVerified = true;
  break;
}

if (!publisherVerified) {
  fail("Could not discover a live /publishers/{slug} page from ai-skills-sitemap or /publishers");
}

const llms = await fetchText("/llms.txt");
assertStatus("/llms.txt", llms.response);
if (!/^\s*#\s+.+/m.test(llms.text)) {
  fail('/llms.txt is missing a Markdown H1 header (e.g., "# Title").');
}
if (!/\[.+\]\(.+\)/.test(llms.text)) {
  fail("/llms.txt does not appear to contain Markdown links ([text](url)).");
}
if (llms.text.length < 50) {
  fail("/llms.txt is suspiciously short.");
}
assertIncludes("/llms.txt", llms.text, "AIPM is a Claude and agent skills marketplace plus a command line tool");
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/security`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/privacy`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/terms`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/status`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/roadmap`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/changelog`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/templates`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/targets`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/examples`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/glossary`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/ai-package-manager`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/version-ai-prompts`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/share-cursor-rules`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/reusable-claude-skills`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/ai-agent-instructions-git`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/components-of-an-ai-agent`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/compatibility`);
assertIncludes("/llms.txt", llms.text, "What are the main components of an AI agent?");

const securityPolicy = await readFile(resolve(repoRoot, "SECURITY.md"), "utf8");
assertIncludes("SECURITY.md", securityPolicy, "aipm publish preview");
assertIncludes("SECURITY.md", securityPolicy, "https://www.aipm-registry.com/security");

const readme = await readFile(resolve(repoRoot, "README.md"), "utf8");
assertIncludes("README.md", readme, "web/              → Next.js website, registry UI, docs, and publisher dashboard");
assertIncludes(
  "README.md",
  readme,
  "GitHub sign-in, profile, org namespaces, package reservations, and 5-minute publish tokens",
);
assertIncludes(
  "README.md",
  readme,
  "Public website: search, package pages, dashboard, docs, SEO pages, security/privacy/terms/status, and roadmap",
);

console.log("Web verification passed.");
