# SEO Post-deploy Benchmark

Run: 4 September 2026

Commit: `c0329af`

## Production crawl

- URLs discovered in both sitemaps: 142
- Successful pages: 142
- Sitemap URLs with `noindex`: 0
- Missing titles: 0
- Missing canonicals: 0
- Duplicate titles: 0
- Deprecated FAQPage schema: 0
- Thin package pages removed from the package sitemap: 2
- Thin package pages now marked `noindex, follow`: 2

The production web verifier and production smoke test also passed. The smoke test covered the website, API, package search, package details, package files, tarball download, and a clean-project CLI install.

## Google Search Console

Google's coverage report was last updated on 28 August 2026, before this deployment.

- Indexed: 29
- Not indexed: 44
- Discovered, currently not indexed: 34
- Redirect pages: 9
- Crawled, currently not indexed: 1

The one crawled exclusion is the old non-`www` terms URL. It now resolves to the canonical `www` version, so it is not a current technical problem.

Both sitemaps show `Success` in Search Console:

- Main sitemap: 103 discovered URLs
- Package sitemap: 39 discovered URLs

Validation was started for the 34 discovered pages. Priority indexing was requested for:

- `/research/state-of-agent-skills-2026`
- `/skills`
- `/guides/cursor-rules-vs-agent-skills`
- `/guides/agents-md-vs-skill-md`

All 142 sitemap URLs were also submitted to IndexNow.

## Search and answer-engine visibility

The current web-grounded benchmark surfaced AIPM for:

- `AI package manager` through the homepage
- `agent package manager` through the dedicated guide

AIPM did not yet surface prominently for these new or newly targeted queries:

- `agent skills registry`
- `Claude Code skills marketplace`
- `Cursor rules vs Agent Skills`
- `AGENTS.md vs SKILL.md`
- `SKILL.md template`

Google's Generative AI report still shows 109 impressions for the previous three-month window. The report has an eight-hour delay, and ranking/index data cannot measure a deployment made minutes earlier.

## Result

No critical crawl, index-directive, canonical, title, duplicate-content, sitemap, schema, or production-runtime issue remains in the current crawl.

The largest remaining SEO gap is off-site authority. AIPM needs relevant publisher links, citations to its open dataset, accepted directory listings, and real users who publish and share useful skills. Creating more similar guide pages now would be lower value and could split query intent.

## Checkpoints

- After 7 days: check whether the four priority URLs were crawled and whether query impressions begin.
- After 14 days: compare impressions and average position for each query cluster.
- After 28 days: compare clicks, click-through rate, indexed pages, referring domains, installs, and publisher claims against the baseline.
