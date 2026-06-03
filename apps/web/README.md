# AIPM Web

Next.js public website for AIPM.

## Local development

```sh
pnpm --filter @aipm-registry/web dev
```

By default, server-rendered registry data is fetched from `https://api.aipm-registry.com`.
For preview deployments before DNS cutover, set:

```sh
AIPM_API_BASE_URL=https://api.aipm-registry.com
AIPM_API_PROXY_ORIGIN=https://api.aipm-registry.com
NEXT_PUBLIC_SITE_URL=https://aipm-registry.com
```

## Vercel routing

Deploy this app from the `apps/web` workspace. The website is served by Vercel,
while registry APIs remain on the Azure VM:

- `/v1/*` -> `https://api.aipm-registry.com/v1/*`
- `/health` -> `https://api.aipm-registry.com/health`
- `/ready` -> `https://api.aipm-registry.com/ready`

Before moving the apex domain to Vercel, create `api.aipm-registry.com` on the
VM and verify the API is healthy over HTTPS.

## Vercel project settings

Use these settings in the Vercel dashboard:

```txt
Framework Preset: Next.js
Root Directory: apps/web
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter @aipm-registry/web build
Output Directory: leave empty
```

If Vercel reports `No Output Directory named "public" found`, the project is
configured like a static site. Clear the Output Directory field and set the
Framework Preset to Next.js.

## Verification

After a local or production deploy, verify the public website surface:

```sh
pnpm --filter @aipm-registry/web verify
```

For a local dev server:

```sh
pnpm --filter @aipm-registry/web dev
pnpm --filter @aipm-registry/web verify:local
```

The verifier checks core pages, page titles, canonical URLs, JSON-LD on SEO
pages, `robots.txt`, `sitemap.xml`, `package-sitemap.xml`, `llms.txt`, and
production security headers when the target URL is HTTPS.
