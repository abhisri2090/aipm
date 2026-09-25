# AIPM SEO strategy: Claude & agent skills marketplace (2026-09-25)

**Owner:** Abhishek Srivastava · **Written:** 2026-09-25 (IST) · **Window:** 15k-impression goal 2026-09-20 → 2026-10-20 (IST)
**Inputs:** `/workspace/aipm-seo/keyword-research-2026-09-25/KEYWORD_AUDIENCE_BRIEF_2026-09-25.md` (WordStream US volumes, Google Trends, autocomplete, GSC export 2026-06-23 → 2026-09-22), `gsc_queries.csv`, `gsc_pages.csv`, `volumes_wordstream_US_2026-09-25.csv`, progress checkpoint 2026-09-25.
**Supersedes for positioning:** the "AI package manager" framing in `SEO_STRATEGY.md` (2026-09-05). `SEO_15K_30_DAY.md` stays the checklist for the 30-day window; this doc is the plan of record for what we build and why.

Every number below comes from one of the inputs above. Anything that is judgement is marked **(inference)**.

---

## 1. Diagnosis

### What is right
- **The comparison/instruction-file cluster already ranks.** `/guides/cursor-rules-vs-agent-skills` (685 impressions, pos 9.3), `/guides/cursor-rules-vs-agents-md` (377, pos 9.8) and `/guides/agents-md-vs-skill-md` (210, pos 8.2) = **1,272 impressions** at positions 6–9. Google already sees the site as relevant here.
- **Small independent sites win mid-tail how-to and "X vs Y" queries** (getclaudeskills.com, capabase.ai, skillsboard.sh). That is where a low-authority site can compete **(inference from SERP map)**.
- **We have real registry data** (196 skills, install counts, source-repo GitHub stars, scan status) that listicles and awesome lists do not.
- Technical basics are in place: canonical URLs, content-aware `lastmod`, split sitemaps, IndexNow, JSON-LD on guides.

### What is wrong
| Problem | Evidence |
|---|---|
| **Positioning uses words nobody searches** | "ai package manager" = **10** US searches/month; "skill registry" = 140. People say *skills, marketplace, best, install*: "claude skills" 49.5K, "claude code skills" 14.8K, "agent skills" 9.9K, "claude skills marketplace" 5.4K. |
| **0% CTR on pages already on page 1** | All 17 "cursor rules vs skills" queries: 116 impressions, 0 clicks, avg pos 8.6. Cursor + AGENTS.md queries (e.g. "cursor agents.md" pos 8.9, "does cursor read agents.md" pos 5.8): 0 clicks. Titles did not answer the literal question. |
| **Install guide answers a narrower question than people ask** | 32 "install claude skills" variants average **pos 67.8**; `/guides/how-to-install-claude-code-skills` pos 43. The page only covers AIPM + Claude Code; many searchers use the Claude app (upload a ZIP in Customize → Skills), GitHub, or `npx skills add`. |
| **No page for big, winnable demand** | claude code plugins 6.6K, claude skills marketplace 5.4K, what are claude skills 1.9K, best claude skills 1.9K — no dedicated AIPM page. |
| **Thin inventory dilutes the site** | ~1,106 of ~1,170 known URLs are "not indexed" (GSC 2026-09-25). Most are templated prompt pages and imported skill pages with little unique text. |
| **Prompt hubs point at the wrong demand** | gemini prompts 4.4K, claude prompts 2.4K, nano banana prompts 2.9K vs midjourney prompts 880 (declining). The two live topic hubs are headshots and product photography; `/prompts` is titled "AI Prompt Directory". |
| **Pace** | Window-to-date ~220 impressions/day vs ~500/day needed for 15k by 2026-10-20. |

---

## 2. Strategy (agreed 2026-09-25)

1. **Reposition as a Claude & agent skills marketplace.** Lead with *Claude skills, agent skills, marketplace, best, install*. Keep "AI package manager" only on the brand page `/guides/ai-package-manager` (338 impressions, pos 5 — keep for entity clarity, do not build more on it).
2. **Fix CTR on pages that already rank** (Cursor rules vs skills / AGENTS.md / SKILL.md). Titles must answer the literal query ("Does Cursor read AGENTS.md?").
3. **Build pages for real searches:** broader install guide; What are Claude skills; Claude Code plugins vs skills; Claude skills marketplaces compared; Best Claude skills ranked by real registry data (never invented numbers).
4. **Depth over volume.** A documented, conservative rule to improve or noindex the thinnest skill/prompt pages. Never noindex a page with GSC impressions or clicks.
5. **Prompts are secondary.** Re-orient hubs toward Gemini and Claude prompts, keep every valid hub in the sitemap, no new mass pages.

Principles: one intent → one page; facts checked against official docs (Anthropic, Cursor, OpenAI) with a Sources section; fair, verifiable statements about other marketplaces; small CI-green PRs; Abhishek merges.

---

## 3. Phased implementation

Status values: `planned` → `PR open` → `CI green` → `merged` → `indexed`.

| PR | Pages | Target keywords (US vol) | Success metric (GSC, 28 days after merge) | Status |
|---|---|---|---|---|
| **A** – plan + CTR rewrites | this doc; `/guides/cursor-rules-vs-agent-skills`, `/guides/cursor-rules-vs-agents-md`, `/guides/agents-md-vs-skill-md`; sitemap hub test | cursor rules vs skills (110, CPC $10–21), cursor skills (2.9K), agents md (2.9K), does cursor read agents.md, agents.md vs skill.md | Cluster CTR 0% → **≥2%** at stable pos ≤10; ≥10 clicks/28d | [#36](https://github.com/abhisri2090/aipm/pull/36) · CI green |
| **B** – install guide | `/guides/how-to-install-claude-code-skills` (retitled "How to install Claude skills") | how to install claude skills (390) + ~30 variants, how to use claude skills (1.3K), claude skills download (170), install from github | Avg pos for install cluster 68 → **≤20**; ≥300 impressions/28d | [#37](https://github.com/abhisri2090/aipm/pull/37) · CI green |
| **C** – new guides | `/guides/what-are-claude-skills`, `/guides/claude-code-plugins-vs-skills`, `/guides/claude-skills-marketplaces` | what are claude skills (1.9K), claude skills tutorial (1.3K), claude code plugins (6.6K), claude code plugin marketplace (1.3K), claude skills marketplace (5.4K), skillsmp (1.9K), skills sh (3.6K) | All 3 indexed within 14 days; ≥500 combined impressions/28d | [#38](https://github.com/abhisri2090/aipm/pull/38) · CI green |
| **D** – best Claude skills | `/best-claude-skills` (live registry data: AIPM installs, source-repo GitHub stars) | best claude skills (1.9K), best claude code skills (720), awesome claude skills (1.6K), anthropic skills (6.6K) | Indexed; ranks top 30 for "best claude skills"; ≥300 impressions/28d | [#39](https://github.com/abhisri2090/aipm/pull/39) · CI green |
| **E** – site repositioning | `/` metadata + hero copy, root layout defaults, `/skills`, `/skills/claude` | claude skills (49.5K), claude skills marketplace (5.4K), agent skills (9.9K), claude code skills (14.8K) | Homepage impressions +50% vs prior 28d; non-brand share of homepage queries up | [#40](https://github.com/abhisri2090/aipm/pull/40) · CI green |
| **F** – thin-page rule | 69 near-duplicate prompt variants → `noindex, follow` + out of `/prompt-sitemap.xml` (rule: `docs/SEO_THIN_PAGE_RULE.md`); skills unchanged | (quality, not a keyword) | Indexed/known ratio improves; no drop in pages that had impressions | [#41](https://github.com/abhisri2090/aipm/pull/41) · CI green |
| **G** – prompt hub reorientation | `/prompts` title/meta/copy, topic hubs, Gemini/Claude hubs from existing prompts | gemini prompts (4.4K), claude prompts (2.4K), nano banana prompts (2.9K), prompt library (1.6K) | `/prompts` impressions +30%; hubs indexed | [#42](https://github.com/abhisri2090/aipm/pull/42) · CI green |

All seven branches were test-merged in this order on top of `main` (2026-09-25): no conflicts, and the combined tree passes typecheck, lint, vitest, `next build` and `verify:local`.

Suggested merge order: A → B → C → D → E → F → G (A/B lift pages that already have impressions; C/D add new demand; E changes site-wide signals once the destination pages exist; F and G are lower-risk cleanups).

---

## 4. Measurement plan

**Checkpoints:** Monday, Wednesday, Friday (IST), same routine as `/workspace/aipm-seo/progress-*`. Next: Mon 2026-09-28, Wed 2026-09-30, Fri 2026-10-02 …, final 2026-10-20.

Per checkpoint, record in `/workspace/aipm-seo/progress-<date>/` and `STATUS.md`:
1. **Window totals** (2026-09-20 → today): clicks, impressions, CTR, avg position, impressions/day vs 500/day target.
2. **Per cluster** (GSC → Performance → Queries, regex filters):
   | Cluster | Query regex |
   |---|---|
   | Cursor rules / AGENTS.md / SKILL.md | `cursor.*(rule|skill|agent)|agents?\.?md|skills?\.?md` |
   | Install Claude skills | `(install|add|upload|download|instalar|descargar).*skill` |
   | What/plugins/marketplace | `what (is|are) claude skill|claude code plugin|skills? marketplace|skillsmp|skills\.?sh` |
   | Best Claude skills | `best .*skill|awesome .*skill|top .*skill` |
   | Brand | `aipm` |
   | Prompts | `prompt` |
   For each: impressions, clicks, CTR, avg position.
3. **Per page** for pages touched by A–G: impressions, CTR, position (Pages tab filtered by URL).
4. **Indexing:** GSC Pages report indexed vs not indexed; URL Inspection for pages merged since the last checkpoint.
5. **After each merge:** IndexNow for the changed URLs and request indexing in GSC (not before merge — pages are not live).

Decision rules: if a rewritten title has 0 clicks after 14 days at pos ≤10, try a second variant; if a new page is not indexed after 14 days, add internal links from `/skills/claude`, `/`, and related guides before writing more pages.

---

## 5. Risks

| Risk | Mitigation |
|---|---|
| Title changes temporarily lose position | Keep URLs, H1 intent and body; change one cluster at a time; compare 14-day windows. |
| Facts about Claude/Cursor/Codex change fast | Each guide cites official docs in Sources and shows "Last reviewed"; re-check on each checkpoint week. |
| Competitor comparison is unfair or wrong | Only state what the other site/docs say about themselves, attributed and dated; no invented stats; include AIPM's own limits. |
| "Best" page looks thin or manipulative | Rank only by displayed, real data (AIPM installs, source-repo GitHub stars); explain the method; no paid placement; degrade gracefully if the API is down. |
| Noindex rule removes pages that earn traffic | Rule excludes every URL with GSC impressions/clicks and is conservative by design; counts listed in PR F; reversible by editing one list/rule. |
| Site-wide repositioning confuses brand searches ("aipm" 199 impressions) | Keep "AIPM" in the title template and brand page; brand page keeps "AI package manager". |
| 15k target may still be missed | Authority (AS ~2) is the ceiling; distribution/backlinks (see `SEO_15K_30_DAY.md` week 2) run in parallel. |

---

## 6. Status log

See `/workspace/aipm-seo/strategy-2026-09-25/STATUS.md` for the running log; the table in §3 is refreshed when PRs are opened.

2026-09-25: PRs #36–#42 opened, all CI green (build + Vercel preview). Follow-ups after merge:
- IndexNow + GSC request indexing for changed/new URLs (not run before merge; pages were not live).
- Bump `/prompts` lastmod in `app/sitemap.ts` to the G merge date (left out of #42 to avoid a conflict with #40).
- `/targets` still says Claude skills install to `.claude/aipm/skills/...`; the CLI adapter writes `.claude/skills/<name>/`. Fix page + verify assertion together.
- `/popular-skills` lists `@aipm-starters/*` ideas that are not registry packages; now links to `/best-claude-skills`. Decide whether to keep it as "ideas" or retire it.
- Product decisions from F: shared boilerplate across ~670 prompts (0.80–0.90 similarity) and whether to noindex the 17 indexable scan-`flagged` skills.
