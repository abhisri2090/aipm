# Thin / near-duplicate page rule (2026-09-25)

Phase F of `docs/SEO_STRATEGY_2026-09-25.md`. The aim is to stop Google spending crawl budget and
quality signals on pages that are near-copies of each other, without touching anything that already
earns impressions.

## What the data showed

- **Prompts (1,000 pages, all publisher `aipm`).** Every prompt has plenty of text: the median
  `promptText` is about 1,300 characters and the 10th percentile about 1,090. Most also have variables,
  examples and usage notes. So a length-based "thin" rule would catch almost nothing.
  The real problem is templating. Many prompts are the same template with one noun swapped
  (`mj-product-backpack`, `mj-product-candles`, `mj-product-hoodie` ...).
- **Best-match similarity per prompt** (word 5-gram Jaccard on `promptText`, `{{variables}}` removed),
  checked on 2026-09-25:

  | Threshold | Prompts with a twin at or above it |
  |---|---|
  | ≥ 0.95 | 37 |
  | ≥ 0.90 | 83 |
  | ≥ 0.85 | 386 |
  | ≥ 0.80 | 752 |
  | ≥ 0.70 | 827 |

  At ≥ 0.90 the matches are only entity-swap families: `mj-product-*` (product swapped),
  `career-*-{tech,design,finance,...}` (industry swapped), and a few `photo-*` and `mj-*` product-shot
  variants. Between 0.80 and 0.90 you get prompts with different intents that share a long boilerplate
  block, for example the `health-*`, `edu-*` and `code-*` series. Those are not duplicates, so they
  stay indexed.

## The rule (implemented)

1. Normalise `promptText`: lowercase it, remove `{{variables}}` and `[placeholders]`, and keep only `[a-z0-9]` words.
2. Compute the Jaccard similarity of the word 5-gram sets.
3. Walk the prompts in keep-priority order:
   1. protected URLs
   2. prompts with a sample image
   3. the earliest published
   4. path order

   A prompt is marked near-duplicate if it is **≥ 0.90** similar to a prompt that is already kept. There is no chaining, so every noindexed page has an indexable near-twin (`keptPath`).
4. **Protected URLs are never noindexed:**
   - Every prompt URL that appears in any Google Search Console export we have. These are the
     2026-09-11 and 2026-09-24 Performance `Pages.csv` files, `gsc_pages.csv`, and the
     2026-09-25 checkpoint. There are 12 prompt URLs in total, and the list is stored as `gscPaths`
     and kept across regenerations.
   - Every prompt curated on a `/prompts/topics/*` hub (`lib/prompt-topics.ts`, 22 URLs).
5. Near-duplicate pages still render, but with `<meta name="robots" content="noindex, follow">`, and they
   are left out of `/prompt-sitemap.xml`.

**Result (2026-09-25): 69 of 1,000 prompt pages are noindexed, across 13 kept "twins".**

| Family | Noindexed |
|---|---|
| `mj-product-*` | 34 |
| `career-*` (industry variants of 9 templates) | 26 |
| `mj-3d/amazon/cosmetic/lifestyle/sneaker` product shots | 5 |
| `photo-flatlay-*`, `photo-product-scale-*` | 4 |

The full list, with the kept twin and similarity for each entry, is in `apps/web/lib/prompt-noindex.json`.

## Regenerating

```bash
# fetches all prompt details from the public API (4 requests at a time)
node apps/web/scripts/generate-prompt-noindex.mjs \
  --protect path/to/Performance-Pages.csv   # optional: add new GSC exports
```

Regenerate after bulk prompt imports, then commit the JSON. The script refuses to write a partial list
if any prompt is missing `promptText`. To undo, set `"noindex": []` in the JSON.

## Checks

- `scripts/prompt-noindex.test.mjs`:
  - the rule itself;
  - GSC and hub URLs are never in the list;
  - every `keptPath` stays indexable;
  - the sitemap excludes listed paths.
- `verify-web.mjs`:
  - no listed path appears in `/prompt-sitemap.xml`;
  - a sample listed prompt renders `noindex, follow`.

## Not changed (needs a product decision)

- **Shared boilerplate between 0.80 and 0.90** (about 670 prompts). These prompts have distinct intents
  but carry the same long "context handling / face lock / output" blocks. The better fix is editorial:
  shorten the shared block, or move it into a variable or snippet, so the unique part dominates.
  Noindexing them would remove most of the prompt library from search.
- **Skills.** Skill pages already use `isIndexablePackage` (description ≥ 40 chars and a source URL,
  or ≥ 80 chars). Today 170 of 196 skills are indexable. 21 skills have scan status `flagged`, and 17 of
  those are indexable. Whether to noindex flagged skills is a trust and product call, not a thin-content
  call, so this PR leaves it alone. (`/best-claude-skills` already excludes them.)
- **Stale prompt families after GSC data grows.** Rerun the script with new `--protect` exports so any
  noindexed prompt that starts earning impressions is protected. Once protected, it stays indexable.
