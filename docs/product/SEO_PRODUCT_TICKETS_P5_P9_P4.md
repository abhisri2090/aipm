# Product tickets: SEO discoverability (P5 → P9 → P4)

**Date:** 2026-09-21  
**Owner:** AiPM product  
**Repo:** `abhisri2090/aipm` (web app / registry site)  
**Context:** Week 1 thin/CTR punchlist + SEO strategy scan. Parallel track: SEO owns P1/P3/P6/P8 + GSC/Bing login; product owns this stack.  
**Out of scope:** skill imports, creator outreach, desktop, MCP server, dependency resolver, shipping empty Codex inventory.

---

## Priority order

| # | ID | Summary | Type |
|---|----|---------|------|
| 1 | **P5** | Human SERP fields on skill package pages | Product (metadata) |
| 2 | **P9** | Remove Codex hub promise until inventory exists | Product (IA / routing) |
| 3 | **P4** | Indexable prompt topic hubs | Product (routes + templates) |

Soft follow-ons (not blocking this brief): **P2** canonical/redirect once SEO sends winning twin map; **P7** FAQ JSON-LD on `/publish` if schema is product-owned.

---

## P5 — Skill package SERP fields (do first)

### Problem
Live skill URLs use `@scope/name@version | AIPM` titles, kebab H1s, and metas that dump raw SKILL.md trigger prose (“When the user wants…”). Weak CTR even when indexed.

### Outcome
Every public skill package page has **human-readable** title, H1, and meta that match how people search (tool + outcome), while still showing the package id in the body.

### Acceptance criteria
- [ ] **Title:** `{Human Name} — {Claude Code \| Cursor} Skill | AIPM` (≤ ~60 chars; pick primary supported tool, or “AI Agent” if multi)
- [ ] **H1:** human name (not kebab / not `@scope/name`)
- [ ] **Meta description:** one outcome line + “Install with AIPM” — **not** the agent trigger block
- [ ] Human name sourced from package manifest (preferred fields in order: `displayName` / `title` / `name` humanised from slug). Do **not** invent marketing fluff beyond the manifest
- [ ] Package id (`@scope/name@version`) remains visible on-page (subtitle or meta row)
- [ ] No change to install command or package identity
- [ ] Spot-check ≥10 live skill URLs after deploy (title/H1/meta)

### Non-goals
- Rewriting SKILL.md body content for SEO
- New package types or schema beyond optional `displayName` if missing

### Notes for eng
Prefer generating SERP fields at render time from existing package metadata. If `displayName` is absent, humanise the name segment (`frontend-design` → `Frontend Design`) rather than leaving the scoped id in the title.

---

## P9 — Codex hub: remove promise (do second; cheap trust fix)

### Problem
`https://www.aipm-registry.com/skills/codex` returns **404**, while plans / IA / copy still imply Claude + Cursor + **Codex** hubs.

### Outcome
No broken or empty Codex destination. Site only promises hubs that exist and have inventory.

### Acceptance criteria
- [ ] Audit nav, footer, homepage, `/skills`, sitemaps, internal links, and docs for `/skills/codex` or “Codex hub” promises
- [ ] Remove or rewrite those links/copy to Claude + Cursor only (until real Codex inventory)
- [ ] Do **not** ship an empty `/skills/codex` landing (thin hub is worse than silence)
- [ ] `/skills/codex` either stays 404 with **no inbound links**, or returns a soft non-indexed “not available yet” **only if** something must occupy the URL — prefer **no links** + leave 404
- [ ] Update any in-repo SEO/IA plans that list Codex as a live hub

### Non-goals
- Building Codex adapter inventory
- Ranking Codex in search this quarter

### Revisit when
There are enough real Codex-compatible packages to fill a hub with the same FAQ + install + listings bar as Claude/Cursor.

---

## P4 — Prompt topic hubs (do third)

### Problem
Tier-B demand (e.g. LinkedIn headshots, product photography) has no indexable cluster URL. `/prompts?q=…` is correctly `noindex` and cannot carry that demand.

### Outcome
A small set of **indexable** topic hubs with unique intros and links into existing prompt pages.

### Acceptance criteria
- [ ] Routes like `/prompts/topics/linkedin-headshots` and `/prompts/topics/product-photography` (slug pattern: `/prompts/topics/{topic}`)
- [ ] Each hub is **indexable** (`index,follow`) with unique `<title>`, H1, meta, and ≥1 short unique intro paragraph (not a copy-paste of `/prompts`)
- [ ] Hub lists / links top relevant prompts (internal links to existing `/prompts/aipm/{slug}` pages)
- [ ] Filtered `/prompts?q=` stays `noindex,follow` + canonical to `/prompts`
- [ ] Hubs appear in sitemap with honest `lastmod` after ship
- [ ] Start with **2 hubs** (headshots + product photography); add more only with distinct query intent

### Non-goals
- One URL per synonym / tool twin (that’s P2)
- Mass new prompt publishing for SEO count
- Changing noindex policy on query filters

### Content ownership
Product owns route + template + data wiring. SEO may supply title/H1/meta drafts and which prompts belong on each hub.

---

## Soft follow-ons

### P2 — Near-twin prompts (wait for SEO map)
When SEO sends the winning twin per intent, product implements: **301 redirect** or **canonical + noindex** on the weaker URL (prefer redirect if content is effectively the same). If both must stay, differentiate hard by tool in title/H1/meta only.

### P7 — `/publish` FAQ JSON-LD
If FAQ content already on page, emit FAQPage JSON-LD. SEO owns title/meta/H1 copy separately.

---

## Definition of done (this stack)

1. P5 live on production skill pages (spot-checked).  
2. P9: no Codex hub promises in IA; no empty hub shipped.  
3. P4: two topic hubs live, indexed, linked from `/prompts` and sitemap.  
4. SEO notified to IndexNow / lastmod bump for changed URLs only.

---

## References

- `/workspace/aipm-seo/WEEK1_THIN_CTR_PUNCHLIST_2026-09-21.md` (P4/P5/P9)
- `/workspace/aipm-seo/SEO_STRATEGY_SCAN_2026-09-21.md`
- Live site: https://www.aipm-registry.com
