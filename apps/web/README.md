# AIPM Web

Next.js public website for AIPM.

## Local development

Contributor setup is documented in [`docs/LOCAL_DEV.md`](../../docs/LOCAL_DEV.md).

```sh
pnpm local:setup
pnpm local:api    # terminal 1
pnpm local:web    # terminal 2
```

Copy env templates if needed:

```sh
cp apps/web/.env.local.example apps/web/.env.local
```

Local env points the web app at the registry API on `http://127.0.0.1:8080`.
Login uses dev auth (`AIPM_DEV_AUTH=1`) — no GitHub OAuth required.

Open `http://localhost:3000/login` and choose **Continue as local contributor**.

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

Production deployment and OAuth configuration: [`infra/azure/`](../../infra/azure/).
