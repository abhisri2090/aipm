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
    title: "AIPM - AI Package Manager for Skills and Tool Files",
    renderedTitle: "AIPM - AI Package Manager for Skills and Tool Files",
    h1: "Install AI skills like packages.",
    jsonLd: true,
    includes: ["What is AIPM?", "AIPM is an AI package manager", "Abhishek Srivastava", "aipm add @scope/name@version"],
  },
  {
    path: "/registry",
    title: "AI Skills Registry",
    h1: "Search public skills.",
    jsonLd: true,
  },
  {
    path: "/prompts",
    title: "AI Prompt Directory",
    h1: "Start with a prompt that already works.",
    jsonLd: true,
    includes: ["Browse all prompts", "Category", "Output"],
  },
  {
    path: "/publish",
    title: "Publish and Distribute AI Skills, MCP, and Tool Packages",
    h1: "Publish AI skills so others can install them.",
    jsonLd: false,
    includes: ["AI package distribution", "MCP setup", "What teams can share", "/publish/guide"],
  },
  {
    path: "/publish/guide",
    title: "Publishing Guide",
    h1: "Create a skill package and publish it.",
    jsonLd: false,
    includes: ["install guide", "skill templates guide", "aipm publish init"],
  },
  {
    path: "/use",
    title: "Use AIPM",
    h1: "Install AI skills into your project.",
    jsonLd: false,
  },
  {
    path: "/install",
    title: "Install the AIPM CLI",
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
    includes: [".cursor/aipm/skills/&lt;skill&gt;.md", ".claude/aipm/skills/&lt;skill&gt;/SKILL.md", "--target claude"],
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
    includes: ["Which file works where?", "AGENTS.md", "CLAUDE.md", "Last checked: 31 August 2026"],
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
    title: "AIPM vs Skills.sh",
    h1: "What is the difference between AIPM and Skills.sh?",
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
    title: "How to Install Claude Code Skills",
    h1: "How do you install a Claude Code skill?",
    jsonLd: true,
    includes: ["Short answer", "aipm init --target claude", "Review the installed .claude skill files"],
  },
  {
    path: "/guides/how-to-install-cursor-skills",
    title: "How to Install Cursor AI Skills",
    h1: "How do you install an AI skill for Cursor?",
    jsonLd: true,
    includes: ["Short answer", "aipm init --target cursor", "Review the installed .cursor/aipm skill file"],
  },
  {
    path: "/guides/how-to-create-agent-skill",
    title: "How to Create an Agent Skill",
    h1: "How do you create a reusable Agent Skill?",
    jsonLd: true,
    includes: ["Short answer", "Give the skill one job", "aipm publish validate"],
  },
  {
    path: "/publishers/anthropics",
    title: "Anthropic AI Skills",
    h1: "Anthropic",
    jsonLd: true,
    includes: ["/packages/anthropics/", "has not claimed the AIPM account yet"],
  },
  {
    path: "/skills/cursor",
    title: "Cursor Skills",
    h1: "Find Cursor skills for project-ready AI workflows.",
    jsonLd: true,
    includes: ["Search registry", "Browse more skill categories"],
  },
  {
    path: "/skills/claude",
    title: "Claude Skills",
    h1: "Find Claude skills for repeatable assistant workflows.",
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
    title: "AIPM Skill Examples",
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
    title: "AIPM Glossary",
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
    title: "AIPM Skill Templates for Code Review, Issues, and Releases",
    h1: "Start with a template, then edit it.",
    jsonLd: true,
    includes: ["--template code-review", "--template issue-summary", "--template release-notes"],
  },
  {
    path: "/thanks",
    title: "Special Thanks to the AI Community",
    h1: "AI tools are built on shared work.",
    jsonLd: true,
    includes: ["Global conferences &amp; communities", "NeurIPS", "ICLR", "CVPR", "AI Engineer"],
  },
  { path: "/faq", title: "AIPM FAQ", h1: "Common questions and fixes.", jsonLd: true },
  {
    path: "/guides/ai-package-manager",
    title: "What Is an AI Package Manager?",
    h1: "What is an AI package manager?",
    jsonLd: true,
    includes: ["Short answer", "AIPM gives you a registry and a CLI", "Is an AI package manager the same as npm?"],
  },
  {
    path: "/guides/agent-package-manager",
    title: "Agent Package Manager for AI Workflows",
    h1: "What is an agent package manager?",
    jsonLd: true,
    includes: ["Short answer", "Agents need instructions", "Does an agent package manager run the agent?"],
  },
  {
    path: "/guides/prompt-package-manager",
    title: "Prompt Package Manager for Teams",
    h1: "How do teams manage prompts like packages?",
    jsonLd: true,
    includes: ["Short answer", "Copy-paste does not scale", "Should every prompt become a package?"],
  },
  {
    path: "/guides/mcp-package-manager",
    title: "MCP Package Manager for AI Tool Setup",
    h1: "How can teams package MCP setup?",
    jsonLd: true,
    includes: ["Short answer", "MCP setup has many small parts", "Should MCP secrets go into a package?"],
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
  },
];

const privatePages = ["/login", "/cli/login", "/dashboard", "/dashboard/profile", "/dashboard/orgs/new"];

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

function extractJsonLd(html) {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  return Array.from(matches, (match) => match[1]?.trim()).filter(Boolean);
}

function packagePath(packageName, version) {
  const [scope, name] = packageName.replace(/^@/, "").split("/");
  return `/packages/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(name ?? "")}/${encodeURIComponent(version)}`;
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

for (const page of requiredPages) {
  const { response, text } = await fetchText(page.path);
  assertStatus(page.path, response);
  const renderedTitle = page.renderedTitle ?? `${page.title} | AIPM`;
  assertIncludes(page.path, text, `<title>${renderedTitle}</title>`);
  assertIncludes(page.path, text, page.h1);

  const canonical = `${expectedCanonicalUrl}${page.path === "/" ? "" : page.path}`;
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
assertIncludes("/", homePage.text, 'href="/guides/agent-package-manager"');
assertIncludes("/", homePage.text, 'href="/guides/version-ai-prompts"');

for (const path of privatePages) {
  const { response, text } = await fetchText(path);
  assertStatus(path, response);
  assertIncludes(path, text, "noindex");
  assertIncludes(path, text, "nofollow");
}

const robots = await fetchText("/robots.txt");
assertStatus("/robots.txt", robots.response);
assertIncludes("/robots.txt", robots.text, `Sitemap: ${expectedCanonicalUrl}/sitemap.xml`);
assertIncludes("/robots.txt", robots.text, `Sitemap: ${expectedCanonicalUrl}/package-sitemap.xml`);
assertIncludes("/robots.txt", robots.text, "Disallow: /dashboard");

const sitemap = await fetchText("/sitemap.xml");
assertStatus("/sitemap.xml", sitemap.response);
for (const path of [
  "/registry",
  "/skills",
  "/prompts",
  "/publish",
  "/publish/guide",
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
  "/guides/agent-package-manager",
  "/guides/prompt-package-manager",
  "/guides/mcp-package-manager",
  "/guides/version-ai-prompts",
  "/guides/share-cursor-rules",
  "/guides/reusable-claude-skills",
  "/guides/ai-agent-instructions-git",
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
  "/thanks",
]) {
  assertIncludes("/sitemap.xml", sitemap.text, `<loc>${expectedCanonicalUrl}${path}</loc>`);
}

const packageSitemap = await fetchText("/package-sitemap.xml");
assertStatus("/package-sitemap.xml", packageSitemap.response);
assertIncludes(
  "/package-sitemap.xml",
  packageSitemap.text,
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
);

const packageList = await fetchText("/v1/packages?limit=1");
if (packageList.response.ok) {
  const data = JSON.parse(packageList.text);
  const pkg = data.packages?.[0];
  if (pkg?.name && pkg?.version) {
    const path = packagePath(pkg.name, pkg.version);
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
    assertIncludes(path, jsonLd, '"@type":"FAQPage"');
  }
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
assertIncludes("/llms.txt", llms.text, "AIPM is a registry and command line workflow");
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
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/agent-package-manager`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/prompt-package-manager`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/mcp-package-manager`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/version-ai-prompts`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/share-cursor-rules`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/reusable-claude-skills`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/ai-agent-instructions-git`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/guides/components-of-an-ai-agent`);
assertIncludes("/llms.txt", llms.text, `${expectedCanonicalUrl}/compatibility`);
assertIncludes("/llms.txt", llms.text, "What are the main components of an AI agent?");

const securityPolicy = await readFile(resolve(repoRoot, "SECURITY.md"), "utf8");
assertIncludes("SECURITY.md", securityPolicy, "aipm publish preview");
assertIncludes("SECURITY.md", securityPolicy, "https://aipm-registry.com/security");

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
