# AIPM SEO: 15k GSC impressions in 30 days

**Target window:** 2026-09-20 → 2026-10-20 (Asia/Calcutta)  
**Baseline (early Sep docs):** ~1.2k impressions / ~12–17 clicks / ~1% CTR / pos ~13–14 / Semrush AS ~2  
**Goal:** ~15,000 Search Console impressions in 30 days (~12×)

## Shipped in code (2026-09-21 Asia/Calcutta)

Branch: `seo/15k-hubs-sitemap-lastmod`

- Homepage SERP head terms → Claude Code / Cursor / agent skills registry
- `/skills/claude` + `/skills/cursor`: unique FAQ, install snippets, related links, FAQ JSON-LD
- Main `sitemap.ts`: content-aware `lastmod` (no longer frozen 2026-09-04 for hubs)
- Comparison guide hardened for “skills.sh alternative” intent
- Internal links from homepage, `/skills`, `/prompts` to high-intent hubs

Still human: GSC sitemap resubmit + URL inspection for top hubs; Bing Webmaster; IndexNow after deploy.

## Honest feasibility

15k is aggressive from a low-authority site. It is achievable **only if** Google indexes a large share of the prompt + skill inventory and those pages match real queries. Content volume alone will not do it — competitors (skills.sh, skillmd, skillsmp) already own head terms with stronger link graphs.

**Math that can work:**
- Index 400–700 prompt pages that each earn 10–30 long-tail impressions → 4k–15k
- Hubs (`/skills/claude`, `/skills/cursor`, `/skills`, `/prompts`) each earning hundreds–thousands
- Distribution (PH, badges, awesome lists, X) feeding crawl + branded queries

## Diagnosis (2026-09-20)

| Finding | Evidence |
|--------|----------|
| Demand ≠ “AI package manager” | People search: Claude Code skills, Cursor skills, agent skills registry/marketplace, SKILL.md, npx skills add |
| Hubs already closer than homepage | Live: `/skills/claude` = “Claude Code Skills Marketplace…”; homepage still leads with “AI Package Manager” |
| Inventory is sitemap’d but under-indexed | `prompt-sitemap.xml` = **1000** URLs; historical GSC indexed far fewer |
| Crawl freshness lag | Main `sitemap.xml` lastmod still **2026-09-04** on many hubs |
| Authority is the ceiling | AS ~2; need backlinks + IndexNow + GSC coverage, not more thin pages |

**IndexNow (done 2026-09-20):** Submitted **1154** unique URLs (main + ai-skills + prompt + package sitemaps). Key live at `/{key}.txt`. Status 200.

## Keyword priorities

### Tier A (own or steal share)
1. Claude Code skills / Claude Code skills marketplace / library  
2. Cursor skills / Cursor agent skills  
3. AI agent skills registry / marketplace / directory  
4. Install Claude Code skills / install Cursor skills  
5. AIPM / aipm install / aipm registry (brand)

### Tier B (prompt long-tails — volume play)
- LinkedIn headshot / professional headshot AI prompt  
- Midjourney / Flux product photo prompts  
- Resume / CV photo prompts  
- Logo / KDP coloring (already published clusters)

### Tier C (comparison / alternatives)
- skills.sh alternative / vs skillmd / npx skills add vs aipm  
- Best Claude Code skills directory

## Week-by-week checklist

### Week 1 (Sep 20–26) — Index + align
- [x] Keyword/competitor gap analysis  
- [x] Bulk IndexNow for all sitemaps  
- [x] Refresh sitemap `lastmod` to real content dates; ensure prompts in sitemap after every publish  
- [x] Homepage + hub title/H1/meta: front-load Claude Code / Cursor / agent skills registry (keep package-manager as secondary)  
- [x] Strengthen `/skills/claude`, `/skills/cursor` with FAQ, install snippets, internal links to top packages  
- [x] Add or harden comparison guide: AIPM vs skills.sh / skillmd (intent: “alternative”)  
- [ ] GSC: resubmit all sitemaps; request indexing for top 20 hubs (manual if API unavailable)  
- [ ] Bing Webmaster: submit sitemaps if not already  
- [x] Internal links: prompts hub → top demand clusters; skills hub → Claude/Cursor/Codex  

### Week 2 (Sep 27–Oct 3) — Distribution + crawl fuel
- [ ] Product Hunt: schedule with demo + “Claude Code / Cursor skills registry” framing  
- [ ] Chase open awesome-list / directory PRs; follow up BACKLINK_TRACKER  
- [ ] Publisher badge outreach (5–10 repos with permission)  
- [ ] 2–3 technical posts or Dev.to/Hashnode: “Install Claude Code skills with AIPM”, “Cursor skills registry”  
- [ ] Prompt cluster hubs if missing (headshots, product photos) with unique copy + links to listings  
- [ ] GSC checkpoint #1 (day 7): impressions, indexed pages, top queries  

### Week 3 (Oct 4–10) — Double down on winners
- [ ] Expand pages that gained impressions; fix soft-404 / thin leftovers  
- [ ] More IndexNow after any batch publish  
- [ ] CTR pass: rewrite titles/metas for queries with impressions but low CTR  
- [ ] Outreach round 2 + LinkedIn/X distribution of hub URLs  
- [ ] GSC checkpoint #2 (day 14)  

### Week 4 (Oct 11–20) — Authority + close gap to 15k
- [ ] Product Hunt launch week if scheduled  
- [ ] Fill remaining indexing gaps (orphan prompts, missing lastmod)  
- [ ] Push comparison + install guides with backlinks  
- [ ] Final GSC checkpoint (day 28–30); document what worked for next cycle  

## Execution owners

| Workstream | How |
|------------|-----|
| On-page / sitemap / hubs | Shipped on branch `seo/15k-hubs-sitemap-lastmod` (local/box implementation; PR when push auth available) |
| IndexNow / publish hygiene | Box scripts + CLI after publishes |
| GSC / Bing / Semrush | Needs Abhishek login / access |
| Backlinks / PH / outreach | AIPM manager + drafts for Abhishek to send |
| Prompt long-tail | Already ~1000 in sitemap; focus indexing + cluster hubs |

## Success metrics

| Metric | Day 0 | Day 14 target | Day 30 target |
|--------|-------|---------------|---------------|
| GSC impressions (28d trailing or period) | ~1.2k | ≥5k | **≥15k** |
| Indexed URLs (Coverage / Pages) | low vs 1154 | ≥400 | ≥700 |
| Top query themes | brand-ish | Claude/Cursor skills appear | multiple Tier A queries |
| Clicks | ~15 | ≥80 | ≥200 |
| Avg position (informational) | ~13–14 | ≤12 | ≤10 on hubs |

## Do not

- Spam more near-duplicate prompts without unique samples/titles  
- Chase “AI package manager” as the primary homepage head term  
- Open badge PRs without publisher permission  
- Expect 15k from homepage alone  

## Artifacts

- IndexNow result: `INDEXNOW_SUBMITTED.json`  
- This plan: `30_DAY_15K_IMPRESSIONS_PLAN.md`  
- Repo context: `docs/SEO_STRATEGY.md`, `SEO_EXECUTION_PLAN.md`, `SEO_QUERY_MAP.md`
