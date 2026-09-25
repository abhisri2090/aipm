# DeskTools overlay

Source overlay for an existing **Next.js 15 App Router + TypeScript + Tailwind** project (`src/app` structure). British English. Temporary smoke-test site with five SEO free tools.

## How to apply

1. Copy everything under this overlay onto your project root (merge paths).
2. Append `gitignore.append` into your project `.gitignore`.
3. Install extra deps from `package.json.deps.json` (do **not** reinstall next/react):

```bash
npm install jspdf
```

4. Copy `.env.example` → `.env.local` and fill values as needed.
5. Ensure `data/` exists (the API creates it if missing). Keep `/data/leads.json` out of git.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin for `robots.ts` / `sitemap.ts` (default `http://localhost:3000`) |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics measurement ID (`G-…`) |
| `FORMSPARK_URL` | Optional | If set, lead POSTs are also forwarded to Formspark |

## Routes

| Path | Description |
|---|---|
| `/` | Homepage listing five tools |
| `/bank-statement-to-excel` | CSV bank export → clean CSV (PDF OCR later) |
| `/construction-quote-generator` | Line items → branded PDF quote (jsPDF) |
| `/time-off-tracker` | Employees + balances + requests in localStorage |
| `/profit-and-loss-from-csv` | Bank CSV → simple P&L + CSV download |
| `/timesheet-to-invoice` | Timesheet rows → PDF invoice (jsPDF) |
| `/privacy` | Privacy policy |
| `/disclaimer` | Disclaimer |
| `/api/leads` | POST leads → `data/leads.json` (+ optional Formspark) |
| `/robots.txt` | From `src/app/robots.ts` |
| `/sitemap.xml` | From `src/app/sitemap.ts` |

## Wave status

### Wave 0 (this overlay) — done

- Shared layout, nav, footer, privacy, disclaimer
- Lead form + API (local JSON + optional Formspark)
- Five tool MVPs (client-side where possible)
- robots / sitemap / env example
- Neutral slate/teal styling (not purple AI slop)

### Wave 1 — planned

- Bank statement **PDF OCR**
- Logos on quotes/invoices
- VAT / retention fields
- Shared team sync for time-off tracker
- Stronger P&L categorisation and multi-currency
- Replace privacy contact placeholder

## Notes

- No login wall.
- Client components are marked `"use client"`.
- Path alias `@/` assumes standard Next.js `tsconfig` paths.
- Locale: `en-GB` (currency formatting uses GBP in PDF/P&L helpers).
