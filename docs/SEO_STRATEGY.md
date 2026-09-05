# AIPM SEO and AI Search Strategy

Updated: 5 September 2026

This is the main SEO roadmap for AIPM. It explains what we should do now, what needs more information, and what should wait until later.

The goal is not to create the largest number of pages. The goal is to help the right person find a useful AIPM page, understand the answer, inspect a package, and install or publish it.

## 1. Main Goals

AIPM should become the clearest answer for these topics:

- AI package manager
- Agent Skills package manager
- Agent Skills registry
- Install and manage Claude Code skills
- Install and manage Cursor skills
- Version prompts, rules, and AI instructions
- Review an Agent Skill before installing it
- Publish and share reusable AI workflows

Every important search should lead to one clear page. We should improve an existing page before creating another page for the same question.

## 2. Product Position

AIPM is not only a directory. It is a registry and package manager for versioned AI skills, prompts, rules, and tool files.

Our strongest differences are:

- A person can inspect the source and files before installation.
- A package has a clear version instead of changing without notice.
- The same package can support more than one AI tool.
- Publishers can share, claim, and maintain their packages.
- Teams can keep reusable AI instructions with their normal development workflow.

SEO pages should explain these differences with real examples. We should not compete only on the number of listed skills.

## 3. Audiences

### Technical users: first priority

These users already know terms such as `SKILL.md`, Claude Code skills, Cursor rules, MCP, prompts, and `AGENTS.md`. They want an exact answer, command, comparison, or package.

Important actions:

- Search for a skill
- Compare formats or tools
- Inspect package files
- Copy an install command
- Install a fixed version
- Publish or claim a package

### Non-technical users: second priority

These users know that AI may help them, but they may not know what a skill, prompt package, or MCP server is.

Their pages should begin with a normal problem, such as:

- Stop repeating the same instructions to AI
- Share one AI workflow with a team
- Make AI output more consistent
- Reuse a useful workflow in another project

The writing must use short sentences, normal words, and practical examples.

## 4. Current Baseline

The baseline period was 2 June to 1 September 2026.

| Metric | Value |
| --- | ---: |
| Google clicks | 17 |
| Google impressions | 1,312 |
| Click-through rate | 1.3% |
| Average position | 14.0 |
| Generative AI impressions | 109 |
| Indexed URLs in the last available report | 29 |

The September production crawl found 142 indexable sitemap URLs with no critical title, canonical, schema, sitemap, or index-directive errors. Google Search Console validation is running for URLs that were discovered but not indexed.

Detailed records:

- `docs/SEO_BASELINE_2026-09-04.md`
- `docs/SEO_POST_DEPLOY_2026-09-04.md`
- `docs/SEO_QUERY_MAP.md`
- `docs/BACKLINK_TRACKER.md`

## 5. Immediate Work: Now to 30 Days

### Priority 1: Measure the new pages correctly

We must not judge the September changes using data from before they were published.

Actions:

- Record Google Search Console results after 7, 14, and 28 days.
- Compare the same query groups at every checkpoint.
- Record clicks, impressions, click-through rate, average position, and indexed URLs.
- Record which pages appear in Google AI results and other answer engines.
- Track visits that lead to an install command copy, CLI install, account creation, package claim, or publish action.
- Keep deployment dates beside the measurements.

Success means:

- We can connect each important query to one preferred page.
- We know which pages receive impressions but no clicks.
- We know which landing pages lead to real product use.

Need more information:

- A fresh 28-day Search Console export after the September deployment.
- Analytics for install command copies, successful installs, package claims, and publishes.
- Bing Webmaster Tools data, if the site is connected.
- Referral data from Product Hunt, Hacker News, directories, GitHub, and publisher sites.

### Priority 2: Protect crawlability and index quality

Actions:

- Keep every sitemap URL canonical, indexable, useful, and available with HTTP 200.
- Keep private, empty, duplicate, search-filter, and low-information pages out of sitemaps.
- Keep weak package pages as `noindex, follow` until they contain enough useful information.
- Use the real content or package update time for sitemap `lastmod`.
- Run the same crawl check after every change to sitemap or routing code.
- Alert on sitemap URLs that return 404, redirect, time out, or contain `noindex`.
- Keep normal HTML links between hubs, guides, publishers, prompts, and packages.
- Watch Core Web Vitals and mobile rendering for listing and detail pages.

Success means:

- Zero broken sitemap URLs.
- Zero sitemap URLs with `noindex`.
- Zero accidental duplicate canonicals or titles.
- New public prompts and qualifying packages enter the correct sitemap automatically.
- Search engines can reach important pages through links, not only through a sitemap.

Possible improvement after measurement:

Split the current sitemaps into guides, prompts, packages, publishers, and discovery pages. AIPM does not need this for sitemap size yet. It may still help us compare indexation by page type in Search Console. We need Search Console data before deciding whether the extra sitemap structure is useful.

### Priority 3: Use search demand to choose pages

Actions:

- Protect the existing `AI package manager` page and improve it when new query data appears.
- Improve pages ranking between positions 6 and 20 before writing new pages.
- Rewrite titles and descriptions when a page receives impressions but has a weak click-through rate.
- Add missing sections when Search Console shows related questions that the preferred page does not answer.
- Keep one preferred page for each search intent in `docs/SEO_QUERY_MAP.md`.
- Research technical searches before creating more platform or role pages.

Queries to investigate next:

- Agent Skills package manager
- Agent Skills registry
- `SKILL.md` registry
- Install Agent Skills with a CLI
- Manage Claude Code skills
- Version Claude Code skills
- Manage Cursor skills
- Share Cursor rules across projects
- Audit or review an Agent Skill before installation
- Publish an Agent Skill
- Private Agent Skills registry
- Agent Skills for teams
- Codex skills directory
- Install skills in Codex

Need more information:

- Search Console query data for the new pages.
- Google Keyword Planner or another reliable demand estimate.
- Google Trends comparisons for closely related terms.
- The number of useful AIPM packages available for each platform or use case.
- The words current users use when they describe the problem.

Do not create a landing page only because a keyword exists. The page also needs useful inventory and a clear AIPM solution.

### Priority 4: Make every important page answer-ready

Every guide and discovery page should contain:

- A direct answer near the top.
- A clear title and one main heading.
- A simple example or command.
- Steps that a beginner can follow.
- Links to relevant packages or prompts.
- Links to the next useful guide.
- Primary sources for facts that may change.
- A visible reviewed or updated date.
- Appropriate structured data that matches visible content.

Every qualifying skill page should contain:

- A plain-English explanation of what the skill does.
- The publisher and original source.
- Version and publication date.
- License information when available.
- Supported tools and install targets.
- Files included in the package.
- A clear installation command.
- Security check status and its limitations.
- Related skills from the same publisher or category.
- Share and README badge controls.

Every qualifying prompt page should contain:

- The problem the prompt solves.
- The prompt or a useful preview.
- Simple usage steps.
- A real example of expected use.
- Publisher and update information.
- Related prompts, skills, or guides.
- A share control and stable canonical URL.

### Priority 5: Strengthen internal links

Actions:

- Link each guide to its preferred skill or prompt hub.
- Link each platform page to its installation and comparison guides.
- Link qualifying package pages to their publisher and related packages.
- Link publisher pages back to maintained package pages.
- Link glossary definitions to deeper guides.
- Use descriptive anchor text instead of repeated text such as "learn more."
- Keep the most important pages within a few normal links of the home page or skills hub.

Success means every priority page has useful incoming links from related AIPM pages.

### Priority 6: Build authority outside AIPM

Technical SEO is no longer the main critical gap. AIPM needs relevant sites and real publishers to mention it.

Actions:

- Ask publishers to review their AIPM listing.
- Ask for permission before proposing an AIPM README badge or package link.
- Share the State of AI Agent Skills report with researchers and maintainers who can use the dataset.
- Publish practical articles that demonstrate one complete workflow.
- Complete the Product Hunt launch after the demo video is ready.
- Monitor submitted directories and curated-list pull requests.
- Link outreach to the most relevant AIPM guide or package, not always the home page.

Success means:

- More relevant referring domains.
- More GitHub referral visits.
- More publisher claims and maintained packages.
- More installs from external pages.

The detailed plan is in `docs/GROWTH_PLAN.md` and `docs/BACKLINK_TRACKER.md`.

### Priority 7: Improve AI answer visibility

Actions:

- Keep `llms.txt` accurate and short enough to scan.
- Keep important definitions in clear, quotable paragraphs.
- Support factual claims with primary sources.
- Publish original data with a clear method, date, and limitations.
- Use stable URLs for research, guides, package pages, and machine-readable data.
- Keep organization, product, publisher, and package names consistent.
- Add author or reviewer information where it is honest and useful.
- Test important questions in multiple AI answer engines and record whether AIPM is mentioned or cited.

Possible improvement:

Add `llms-full.txt` with stable documentation, API information, package fields, and installation examples. We should do this after confirming which API routes and product rules are stable enough to promise publicly.

## 6. Next Work: 30 to 90 Days

### Controlled platform pages

Consider dedicated pages for Codex, Windsurf, GitHub Copilot, Cline, and other supported tools.

Create a platform page only when:

- Search demand is visible.
- AIPM has enough relevant, useful packages.
- The install instructions are accurate.
- The page can answer a different question from existing guides.
- The page will receive internal links.

Need more information:

- Package counts by supported target.
- Successful install data by target.
- Search demand by platform.
- Which targets AIPM can support and test reliably.

### Controlled use-case pages

Possible topics include code review, testing, documentation, issue summaries, release notes, research, and team prompts.

Keep or create a page only when it has enough relevant inventory and a useful introduction. Do not create hundreds of nearly identical profession or tool pages.

### Publisher and source pages

- Index publisher pages only when they contain public packages and useful source information.
- Show proof of account, organization, or repository control precisely.
- Do not use one vague verified badge for different checks.
- Encourage publishers to keep source links and package metadata current.

### Original research and tools

- Refresh the Agent Skills report on a clear schedule.
- Publish changes in package formats, compatibility, security signals, and maintenance.
- Build small tools only when they solve a real search problem, such as validating a manifest or checking a skill before publication.
- Make the method and limits easy to understand.

## 7. Later Work: After 90 Days

### International SEO

Do not create translated pages until we know which countries and languages have real demand and we can maintain accurate translations.

Need more information:

- Search Console performance by country.
- Countries producing installs and publisher activity.
- Languages requested by users.
- Whether support, documentation, and product messages can be maintained in each language.
- Whether important package descriptions are available in those languages.

When the information is available:

- Start with one or two proven languages.
- Use separate, stable language URLs.
- Translate the full useful page, not only the title.
- Add `hreflang` only between real equivalent pages.
- Use a correct `x-default` page.
- Keep canonical URLs within each language version.
- Review important technical words with a fluent speaker.
- Measure each country and language separately.

### Larger programmatic SEO

Only expand when the existing discovery pages earn impressions, clicks, links, or installs.

Later options:

- More platform pages.
- More task and use-case pages.
- Category pages based on real inventory.
- Repository or collection pages.
- Public compatibility reports.
- More research datasets and change reports.

Every generated page needs a quality threshold. Empty, duplicated, or very thin pages should stay out of the index.

### Larger sitemap architecture

When AIPM has thousands of qualifying URLs:

- Use a sitemap index.
- Split sitemaps by content type.
- Keep each child sitemap available and monitored.
- Include only canonical and indexable URLs.
- Use accurate `lastmod` values.
- Test every child sitemap before publishing the index.

## 8. Competitors

Competitor research is useful for finding search patterns and product expectations. It should not decide our strategy by itself.

| Competitor | Main search approach | What AIPM should learn | What AIPM should avoid |
| --- | --- | --- | --- |
| [AgentSkill](https://agentskill.sh/) | Large directory with platform, profession, tool, creator, skill, and plugin pages | Connect discovery pages to useful inventory, install actions, quality information, and machine-readable documentation | Broken sitemap entries, repeated pages, unclear route overlap, and inconsistent counts |
| [Skills.sh](https://skills.sh/) | Large Agent Skills directory with strong install and popularity signals | Keep installation simple and make package usefulness visible | Competing only on directory size |
| [SkillMD](https://skillmd.com/) | Platform-specific catalog pages with a safety and compatibility message | Create clear pages for supported tools when AIPM has evidence and inventory | Making safety claims stronger than the checks performed |
| [GuildSkills](https://guildskills.com/) | Platform catalogs, installation guides, and quality information | Combine education, discovery, and installation | Creating platform pages before AIPM can test the complete workflow |
| [Claude Market](https://www.claudemarket.ai/) | Broad directory covering skills, MCP servers, plugins, and other agent resources | Explain the relationship between different AI package types | Mixing unrelated asset types without clear labels or page intent |

AIPM should own the package-management position: inspect, version, install, update, publish, and share reusable AI setup.

## 9. Structured Data Rules

- Structured data must describe content that the user can see.
- Use `BreadcrumbList` for real navigation paths.
- Use `Article` or `TechArticle` for substantial guides and research where appropriate.
- Use software or product schema only when the page truly represents an installable package or application.
- Do not add FAQ schema only to chase a rich result.
- Keep names, URLs, dates, authors, and publishers consistent with the page.
- Validate structured data after template changes.

## 10. Content Quality Rules

- Write in plain English.
- Answer the main question before giving background.
- Use examples that a beginner can follow.
- Explain technical words when they first appear.
- Avoid unsupported claims such as "best," "safe," or "official."
- State what a security or verification check does not prove.
- Use primary sources for current tool behavior.
- Show original experience, data, examples, or analysis.
- Update the existing page instead of publishing a near-duplicate article.
- Remove or `noindex` pages that cannot provide useful information.

## 11. Measurement Schedule

### Weekly

- Review indexing problems and sitemap errors.
- Review new queries and pages receiving impressions.
- Check important URLs that unexpectedly lost impressions.
- Check external submission and backlink status.
- Test a small fixed set of AI answer-engine questions.

### Every 28 days

- Compare clicks, impressions, click-through rate, and average position with the previous period.
- Compare branded and non-branded searches.
- Compare technical, platform, comparison, and non-technical query groups.
- Compare organic visits with installs, claims, and publishes.
- Improve pages ranking between positions 6 and 20.
- Review pages with impressions and weak click-through rate.

### Every quarter

- Refresh the competitor review.
- Review which content produced links or installs.
- Merge or remove overlapping pages.
- Review target countries and languages.
- Update the research report when enough data has changed.

## 12. What We Should Not Do

- Do not buy links or use bulk backlink services.
- Do not publish hundreds of pages from a keyword list alone.
- Do not place empty filters or internal search results in the sitemap.
- Do not create separate pages for small wording changes.
- Do not claim a page is updated when its useful content did not change.
- Do not translate pages only to create more URLs.
- Do not treat `llms.txt` as a replacement for useful public content and authority.
- Do not measure success only by indexed URL count.

## 13. Definition of Success

The strategy is working when:

- Every priority query has one clear, answer-ready page.
- Important new pages are indexed without technical errors.
- Non-branded impressions and clicks grow across several query groups.
- Click-through rate improves on pages that already rank.
- Search visits lead to package inspection, installation, claims, and publishing.
- Relevant publishers and technical sources link to AIPM.
- AI answer engines mention or cite AIPM for questions it can answer well.
- Growth comes from useful pages and real adoption, not from index volume alone.

## 14. Reference Guidance

- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google structured data guidance](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- [Agent Skills specification](https://agentskills.io/specification)

