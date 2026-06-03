#!/usr/bin/env node
/* global AbortController, URL, clearTimeout, console, fetch, process, setTimeout */

const DEFAULT_URL = "https://aipm-registry.com";
const baseUrl = new URL(process.argv[2] ?? process.env.WEB_URL ?? DEFAULT_URL);
const allowHttp = process.argv.includes("--allow-http") || baseUrl.hostname === "127.0.0.1" || baseUrl.hostname === "localhost";
const timeoutMs = Number(process.env.VERIFY_TIMEOUT_MS ?? 8000);

if (baseUrl.protocol !== "https:" && !allowHttp) {
  fail(`Refusing to verify non-HTTPS URL ${baseUrl.href}. Pass --allow-http for local checks.`);
}

baseUrl.pathname = baseUrl.pathname.replace(/\/+$/, "");
baseUrl.search = "";
baseUrl.hash = "";

const requiredPages = [
  { path: "/", renderedTitle: "AIPM Registry", h1: "Install the right AI setup into every project.", jsonLd: true },
  { path: "/registry", title: "AI Skills Registry", h1: "Search published skills.", jsonLd: true },
  { path: "/publish", title: "Publishing Guide", h1: "Package AI skills once, then install them anywhere.", jsonLd: false },
  { path: "/use", title: "Use AIPM", h1: "Bind AI skills and tool files to your project.", jsonLd: false },
  { path: "/resources", title: "AI Skill Resources", h1: "Build better AI skills, then make them reusable.", jsonLd: false },
  { path: "/ai-practices", title: "AI Best Practices for Reusable Skills", h1: "Build AI skills that teams can trust, reuse, and improve.", jsonLd: true },
  { path: "/discoverability", title: "AI Skill SEO and Discoverability Guide", h1: "Make AI skills easy to find, understand, and trust.", jsonLd: true },
  { path: "/thanks", title: "Special Thanks to the AI Community", h1: "The AI world is built on shared work.", jsonLd: true },
  { path: "/faq", title: "AIPM FAQ", h1: "Common questions and fixes.", jsonLd: true },
];

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

  const canonical = `${DEFAULT_URL}${page.path === "/" ? "" : page.path}`;
  assertIncludes(page.path, text, `rel="canonical" href="${canonical}"`);

  if (page.jsonLd && extractJsonLd(text).length === 0) {
    fail(`${page.path} is missing JSON-LD structured data`);
  }
}

const robots = await fetchText("/robots.txt");
assertStatus("/robots.txt", robots.response);
assertIncludes("/robots.txt", robots.text, `Sitemap: ${DEFAULT_URL}/sitemap.xml`);
assertIncludes("/robots.txt", robots.text, `Sitemap: ${DEFAULT_URL}/package-sitemap.xml`);
assertIncludes("/robots.txt", robots.text, "Disallow: /dashboard");

const sitemap = await fetchText("/sitemap.xml");
assertStatus("/sitemap.xml", sitemap.response);
for (const path of ["/registry", "/publish", "/resources", "/discoverability", "/thanks"]) {
  assertIncludes("/sitemap.xml", sitemap.text, `<loc>${DEFAULT_URL}${path}</loc>`);
}

const packageSitemap = await fetchText("/package-sitemap.xml");
assertStatus("/package-sitemap.xml", packageSitemap.response);
assertIncludes("/package-sitemap.xml", packageSitemap.text, '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

const llms = await fetchText("/llms.txt");
assertStatus("/llms.txt", llms.response);
assertIncludes("/llms.txt", llms.text, "AIPM is a registry and command line workflow");

console.log("Web verification passed.");
