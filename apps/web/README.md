# AIPM Web

Next.js public website for AIPM.

## Local development

```sh
pnpm --filter @aipm-registry/web dev
```

### Local GitHub login

Login needs a local registry API plus Postgres. You can use Docker Postgres or the
production database.

#### Option A — production database (recommended)

```sh
az login
KEY_VAULT_NAME=<key-vault-name> ./infra/azure/pull-local-dev-secrets.sh
./infra/azure/allow-local-postgres-ip.sh
cp apps/web/.env.local.example apps/web/.env.local
```

Add this callback URL to the existing GitHub OAuth app (keep the production one too):

```txt
http://localhost:3000/v1/auth/github/callback
```

For `/admin`, set Key Vault secrets `AIPM-ADMIN-PASSWORD-SHA256` and
`AIPM-ADMIN-ALLOWED-USERNAMES` on the registry API. The web app proxies `/v1/admin/*`
through Next.js rewrites.

#### Option B — Docker Postgres

```sh
docker compose up -d postgres
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
```

Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AIPM_SESSION_SECRET`, and:

```txt
DATABASE_URL=postgresql://aipm:aipm@localhost:5432/aipm
AIPM_API_URL=http://localhost:3000
AIPM_PUBLIC_SITE_URL=http://localhost:3000
```

#### Run locally

```sh
pnpm --filter @aipm-registry/registry-api build
node --env-file=.env --watch apps/registry-api/dist/index.js
pnpm --filter @aipm-registry/web dev
```

Open `http://localhost:3000/login`.

Production DB access from your laptop writes to real users, orgs, and packages.
Use a separate staging database if you need safer experimentation.

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
