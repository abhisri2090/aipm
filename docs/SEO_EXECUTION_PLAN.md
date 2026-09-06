# AIPM SEO Execution Plan

Updated: 6 September 2026

This is the final working plan for improving AIPM's SEO, AI search visibility,
publisher growth, and product adoption. It clearly separates the work Codex will
do from the work Abhishek must do.

The main goal is not to create thousands of pages. The goal is to attract the
right users, help them install a useful package, and give publishers a reason to
share their AIPM pages.

## 1. Why This Is the Priority

Latest AIPM data:

| Metric                        | Current value |
| ----------------------------- | ------------: |
| Google clicks in 28 days      |            12 |
| Google impressions in 28 days |         1,212 |
| Google click-through rate     |          1.0% |
| Average Google position       |          13.2 |
| Semrush Authority Score       |             2 |
| Semrush ranking keywords      |             8 |
| Semrush referring domains     |            74 |
| Semrush backlinks             |            89 |
| Weekly AIPM CLI downloads     |           142 |

Important competitor benchmarks:

| Competitor | Organic traffic | Keywords | Authority Score | Referring domains |
| ---------- | --------------: | -------: | --------------: | ----------------: |
| skills.sh  |          12,600 |      922 |              35 |             5,600 |
| SkillsMP   |           9,500 |      629 |              33 |             1,500 |
| MCP.so     |          25,500 |   10,900 |              37 |             3,800 |
| SkillMD    |              45 |       62 |              10 |               254 |

SkillMD has almost 26,000 skill pages but only about 45 estimated organic visits.
This is clear evidence that creating more pages is not enough. AIPM first needs
useful packages, active publishers, relevant backlinks, product adoption, and
trustworthy package information.

## 2. The Strategy

We will work in this order:

1. Make every important package page complete and trustworthy.
2. Recruit real publishers and help them maintain useful packages.
3. Turn publisher pages and README badges into a natural backlink loop.
4. Improve pages that already receive Google impressions.
5. Publish and distribute practical content that earns relevant links.
6. Measure visits, command copies, installs, claims, and publishes.
7. Create new landing pages only when search data and package inventory support
   them.

## 3. What Codex Will Do

Codex owns the technical, research, writing, auditing, and measurement work below.

### A. Package trust and quality

- [x] Audit the current skill and prompt detail pages.
- [x] Show the original source, publisher, version, publication date, license,
      supported tools, and included files wherever the data is available.
- [x] Show a clear publisher state such as `GitHub account connected`, `Source
linked`, or `Organization owner`.
- [x] Avoid a vague `Verified` badge that could be misunderstood as a safety
      guarantee.
- [x] Show the automated registry check date, checks performed, result, and limits.
- [ ] Add malware and instruction-risk scanning before showing a security scan result.
- [x] Use `Automated checks passed` instead of claiming that a package is safe.
- [x] Define a package-completeness rule for search indexing and featured lists.
- [x] Keep incomplete, empty, duplicate, or low-information package pages out of the
      sitemap until they become useful.

### B. Publisher and GitHub growth loop

- [x] Audit the existing README badge and badge-copy workflow.
- [x] Make every qualifying package page offer correct badge Markdown.
- [x] Link the badge to the stable AIPM package or skill page.
- [x] Show the badge after publishing and explain it in simple English.
- [x] Track badge copies and visits that arrive from GitHub.
- [ ] Improve publisher profile pages so they show maintained packages, source
      identity, and update activity.
- [x] Prepare personalized outreach drafts for the first three priority publishers.
- [ ] Prepare personalized outreach drafts for the remaining priority publishers.
- [ ] Prepare a small badge pull-request change only after the publisher gives
      permission.

### C. High-priority SEO pages

- [x] Protect `/guides/ai-package-manager` as the preferred page for `AI package
manager` searches.
- [x] Check and improve internal links to this guide from the home, install,
      skills, prompts, and publish pages.
- [ ] Strengthen the Claude Code, Cursor, and Codex hubs with real packages,
      install steps, comparisons, and related guides.
- [ ] Create or improve content about reviewing, auditing, versioning, and safely
      installing Agent Skills.
- [ ] Keep titles, headings, canonical URLs, structured data, sources, and
      answer-first introductions correct.
- [ ] Use plain English that a beginner can understand.
- [ ] Do not create a category or use-case page until it has at least 5 useful
      matching packages.

### D. Technical SEO and indexing

- [x] Run the same production crawl after sitemap, routing, or metadata changes.
- [x] Check that every sitemap URL returns HTTP 200, is canonical, and can be
      indexed.
- [ ] Keep account, private, filtered search, empty, and duplicate pages out of
      the sitemap.
- [ ] Use real content update dates for sitemap `lastmod` values.
- [ ] Check Google Search Console indexing after the latest deployment has had
      enough time to be processed.
- [ ] Review Core Web Vitals and mobile rendering for listing and detail pages.
- [ ] Keep `robots.txt`, `llms.txt`, canonicals, and structured data accurate.

### E. Content and backlink support

- [ ] Write one practical technical article that naturally links to the AI
      package manager guide and a real package example.
- [ ] Prepare simple versions for DEV Community, Hashnode, or Medium without
      publishing duplicate copies on the same day.
- [ ] Create a list of relevant newsletters, developer sites, researchers, and
      open-source directories.
- [ ] Prioritize links from publisher READMEs, tutorials, research citations, and
      relevant developer resources.
- [ ] Keep the backlink tracker updated with submission, review, accepted, live,
      rejected, and follow-up states.
- [ ] Avoid paid links, bulk comments, unrelated directories, and repeated
      submissions.

### F. Analytics and reporting

- [ ] Track this funnel: landing page, package view, command copy, successful
      install, account creation, claim, publish, and return visit.
- [ ] Record Google Search Console results after 7, 14, and 28 days.
- [ ] Compare clicks, impressions, CTR, position, indexed pages, and Google AI
      visibility using the same date ranges.
- [ ] Record CLI downloads, active publishers, complete packages, badge copies,
      GitHub referrals, and successful installs each week.
- [ ] Review Semrush authority, keywords, backlinks, and competitors monthly.
- [ ] Recommend title or description tests only after new pages have enough
      impressions to judge them.

## 4. What Abhishek Must Do

These actions require the founder's identity, relationships, judgment, or access
to third-party accounts. Codex can prepare the material, but Abhishek owns the
final action.

### A. Publisher relationships

- [ ] Select the first 10 publishers to contact.
- [ ] Send each publisher a personal message from your own account.
- [ ] Mention one real package or repository in every message.
- [ ] Ask the publisher to review or claim the listing; do not imply endorsement.
- [ ] Ask permission before an AIPM badge or link is added to their README.
- [ ] Reply personally when a publisher asks about trust, ownership, or roadmap.

Priority starting group:

1. Orchestra Research
2. Matt Pocock
3. Murat Can Koylan
4. Morgan Van Horn
5. Philip Bankier
6. Addy Osmani
7. Jesse Vincent / obra

Add three smaller publishers who are likely to respond and already maintain a
useful public skill.

### B. Founder-led publishing and community work

- [ ] Record the 60-90 second product demo video.
- [ ] Add the video to Product Hunt and choose the launch date.
- [ ] Write and post the founder comment on Product Hunt.
- [ ] Publish the prepared technical article under your own name.
- [ ] Share one practical workflow on LinkedIn, X, YouTube, or a relevant
      developer community.
- [ ] Reply personally to useful Product Hunt, Hacker News, GitHub, and community
      comments.
- [ ] Follow every community's self-promotion rules.

### C. Product and trust decisions

- [ ] Approve the exact meaning and evidence required for every publisher badge.
- [ ] Decide who will review security-scan false positives and abuse reports.
- [ ] Approve any public comparison claim, user number, testimonial, or security
      claim before publication.
- [ ] Decide which package types and AI tools are the next product priority.

### D. Account-only steps

- [ ] Complete CAPTCHAs, verification emails, OTPs, or identity checks when a
      listing or account requires them.
- [ ] Provide access or exports when paid Semrush keyword-gap and backlink-gap
      data are needed.
- [ ] Connect Bing Webmaster Tools if it is not already connected.

## 5. Work We Will Do Together

- [ ] Choose the final list of 10 publishers.
- [ ] Review publisher feedback and decide what changes belong in the product.
- [ ] Review the Product Hunt launch package before scheduling.
- [ ] Select any new search page only after checking demand and inventory.
- [ ] Review the 30-day results and decide what to continue, change, or stop.

## 6. Execution Order

### Week 1: Trust and measurement

Codex:

- Audit package pages, publisher states, scan information, badges, internal links,
  sitemap rules, and analytics events.
- Implement the highest-impact missing trust and tracking elements.
- Prepare the first three publisher messages.

Abhishek:

- Confirm the first 10 publishers.
- Record the demo video.
- Approve badge and security wording.

### Week 2: Publishers and backlinks

Codex:

- Finish publisher-page and badge improvements.
- Prepare the practical article and publisher-specific materials.
- Prepare approved README badge changes.

Abhishek:

- Contact the first five publishers.
- Publish the technical article.
- Add the video and schedule Product Hunt.

### Week 3: Distribution

Codex:

- Contact or submit to relevant non-personal directories where account rules
  allow it.
- Improve the platform and safe-install content using the first new query data.
- Check accepted links and referral activity.

Abhishek:

- Contact the remaining five publishers.
- Publish the founder-led launch and community posts.
- Reply to feedback and introductions.

### Week 4: Measure and decide

Codex:

- Run the SEO crawl and Search Console benchmark again.
- Compare Google, AI search, backlinks, CLI downloads, installs, and publisher
  activity.
- Produce the next prioritized implementation list.

Abhishek:

- Report any private replies, publisher interest, and user feedback.
- Decide which partnership or product request should receive priority next.

## 7. Thirty-Day Targets

These are operating targets, not promises of Google rankings.

| Outcome                          |            Current | 30-day target |
| -------------------------------- | -----------------: | ------------: |
| Active or claimed publishers     |  Measure in week 1 |            10 |
| Complete high-quality packages   |  Measure in week 1 |           25+ |
| New relevant referring domains   | 0 during this plan |          5-10 |
| Weekly CLI downloads             |                142 |          300+ |
| Semrush ranking keywords         |                  8 |           25+ |
| AI package manager guide CTR     |               0.8% |      Above 2% |
| Critical sitemap/indexing errors |            0 known |             0 |

## 8. What We Will Not Do

- We will not publish thousands of weak pages to imitate large directories.
- We will not buy backlinks or use automated comment spam.
- We will not claim that an automated scan guarantees safety.
- We will not contact publishers with the same bulk message.
- We will not create pages for keywords that have no useful AIPM solution.
- We will not rewrite recently published pages before they collect enough data.
- We will not measure success using impressions alone.

## 9. Definition of Success

This phase is successful when:

- A new user can find, inspect, and install a trustworthy package easily.
- A publisher can claim a package and share a useful AIPM badge.
- AIPM receives relevant links from real repositories and developer resources.
- Search traffic leads to command copies, installs, claims, and publishes.
- Every priority query maps to one clear, answer-ready page.
- No critical crawlability, canonical, sitemap, or indexation issue remains.
- The next SEO decision is based on new data rather than page-count pressure.
