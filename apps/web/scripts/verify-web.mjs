#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_URL = "https://www.aipm-registry.com";
const positionalUrl = process.argv.find((arg, index) => index > 1 && !arg.startsWith("--"));
const baseUrl = new URL(positionalUrl ?? process.env.WEB_URL ?? DEFAULT_URL);
const expectedCanonicalUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_URL).replace(/\/$/, "");
const allowHttp = process.argv.includes("--allow-http") || baseUrl.hostname === "127.0.0.1" || baseUrl.hostname === "localhost";
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
    includes: [
      "What is AIPM?",
      "AIPM is an AI package manager",
      "Abhishek Srivastava",
      "aipm add @scope/name@version",
    ],
  },
  { path: "/registry", title: "AI Skills Registry", h1: "Search public skills.", jsonLd: true },
  {
    path: "/publish",
    title: "Publish and Distribute AI Skills, MCP, and Tool Packages",
    h1: "Publish AI skills so others can install them.",
    jsonLd: false,
    includes: [
      "AI package distribution",
      "MCP setup",
      "What teams can share",
      "/publish/guide",
    ],
  },
  {
    path: "/publish/guide",
    title: "Publishing Guide",
    h1: "Create a skill package and publish it.",
    jsonLd: false,
    includes: [
      "install guide",
      "skill templates guide",
      "aipm publish init",
    ],
  },
  { path: "/use", title: "Use AIPM", h1: "Install AI skills into your project.", jsonLd: false },
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
  { path: "/resources", title: "AI Skill Resources", h1: "Find the guide you need.", jsonLd: false },
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
    includes: ["Code review helper for Cursor", "Sentry issue summariser for Claude", "Import an existing Codex skill folder"],
  },
  {
    path: "/glossary",
    title: "AIPM Glossary",
    h1: "Simple definitions for AIPM terms.",
    jsonLd: true,
    includes: ["Publish token", "Org namespace", ".aipmignore"],
  },
  { path: "/ai-practices", title: "AI Best Practices for Reusable Skills", h1: "Build AI skills that are clear, safe, and reusable.", jsonLd: true },
  { path: "/discoverability", title: "AI Skill SEO and Discoverability Guide", h1: "Help users find and understand your skill.", jsonLd: true },
  {
    path: "/security",
    title: "AIPM Security and Privacy Guide",
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
    title: "AIPM Terms and Acceptable Use",
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
    title: "AIPM Product Roadmap",
    h1: "See what AIPM is building next.",
    jsonLd: true,
    includes: ["Available now", "Near term reliability", "Trust and registry depth"],
  },
  {
    path: "/changelog",
    title: "AIPM Changelog",
    h1: "See what changed in AIPM.",
    jsonLd: true,
    includes: ["Public trust and status pages", "Publisher account and dashboard", "@aipm-registry/cli"],
  },
  {
    path: "/templates",
    title: "AIPM Skill Templates",
    h1: "Start with a template, then edit it.",
    jsonLd: true,
    includes: ["--template code-review", "--template issue-summary", "--template release-notes"],
  },
  {
    path: "/thanks",
    title: "Special Thanks to the AI Community",
    h1: "AI tools are built on shared work.",
    jsonLd: true,
    includes: ["NeurIPS 2025 invited speakers", "ICLR 2026 keynotes", "CVPR 2025 keynotes"],
  },
  { path: "/faq", title: "AIPM FAQ", h1: "Common questions and fixes.", jsonLd: true },
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
for (const path of ["/registry", "/publish", "/publish/guide", "/install", "/use", "/commands", "/targets", "/resources", "/skills/cursor", "/skills/claude", "/skills/code-review", "/skills/issue-summarizer", "/skills/testing", "/skills/documentation", "/examples", "/glossary", "/discoverability", "/security", "/privacy", "/terms", "/status", "/roadmap", "/changelog", "/templates", "/thanks"]) {
  assertIncludes("/sitemap.xml", sitemap.text, `<loc>${expectedCanonicalUrl}${path}</loc>`);
}

const packageSitemap = await fetchText("/package-sitemap.xml");
assertStatus("/package-sitemap.xml", packageSitemap.response);
assertIncludes("/package-sitemap.xml", packageSitemap.text, '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

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

const securityPolicy = await readFile(resolve(repoRoot, "SECURITY.md"), "utf8");
assertIncludes("SECURITY.md", securityPolicy, "aipm publish preview");
assertIncludes("SECURITY.md", securityPolicy, "https://aipm-registry.com/security");

const readme = await readFile(resolve(repoRoot, "README.md"), "utf8");
assertIncludes("README.md", readme, "web/              → Next.js website, registry UI, docs, and publisher dashboard");
assertIncludes("README.md", readme, "GitHub sign-in, profile, org namespaces, package reservations, and 5-minute publish tokens");
assertIncludes("README.md", readme, "Public website: search, package pages, dashboard, docs, SEO pages, security/privacy/terms/status, and roadmap");

console.log("Web verification passed.");
