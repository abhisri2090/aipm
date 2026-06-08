# Local Development

Contributor local setup is **fully isolated** from production. You do not need
GitHub OAuth, Azure credentials, Key Vault, or production database access.

## Prerequisites

- Node.js 20+
- pnpm 9 (`corepack enable`)
- Docker (for Postgres and full dashboard testing)

## Quick start

```bash
pnpm install
pnpm local:setup
pnpm local:api    # terminal 1
pnpm local:web    # terminal 2
```

Open:

- Website: http://localhost:3000
- Login: http://localhost:3000/login — use **Continue as local contributor**
- Registry API: http://127.0.0.1:8080/health

## What runs locally

| Component | URL / path |
|-----------|------------|
| Next.js web | http://localhost:3000 |
| Registry API | http://127.0.0.1:8080 |
| Postgres | Docker `localhost:5432` |
| Package storage | `./data/packages` (filesystem) |

The web app proxies `/v1/*` to the local registry API via `apps/web/.env.local`.

## Environment files

`pnpm local:setup` copies templates if missing:

- `.env` from [`.env.example`](../.env.example)
- `apps/web/.env.local` from [`apps/web/.env.local.example`](../apps/web/.env.local.example)

Key variables:

```txt
DATABASE_URL=postgresql://aipm:aipm@localhost:5432/aipm
AIPM_DEV_AUTH=1
AIPM_API_URL=http://localhost:3000
AIPM_PUBLIC_SITE_URL=http://localhost:3000
```

## Auth (no GitHub required)

With `AIPM_DEV_AUTH=1`, the registry API exposes dev login at `/v1/auth/dev/login`.
The login page shows **Continue as local contributor**, which creates a fixed
local user and session.

This is disabled in production and blocked when `NODE_ENV=production`.

## Admin (`/admin`)

Requires Docker Postgres (`pnpm local:setup`) and the local registry API (`pnpm local:api`).

1. Sign in at `/login` with **Continue as local contributor**
2. Open `/admin` and enter password: `local-admin`
3. Allowlisted local username: `dev-local`

## CLI workflow

```bash
pnpm build
pnpm registry
# or against local API explicitly:
node apps/cli/dist/bin.cjs publish examples/skills/@team/sample-skill \
  --registry http://127.0.0.1:8080
```

## Optional: seed public package data

To populate local registry with a few packages from the **public read API** (no prod DB):

```bash
pnpm local:seed
```

This downloads metadata and tarballs from `https://api.aipm-registry.com` and
republishes them to your local API. Set `LOCAL_SEED_LIMIT=20` to cap count.

## Minimal path (no Docker)

For CLI/registry-only work without dashboard or Postgres:

```bash
pnpm install && pnpm build && pnpm registry
```

The API falls back to file metadata if Postgres is unavailable.

## Safety rules

Local development must **never**:

- Connect to production Postgres
- Use Azure Blob storage connection strings
- Pull secrets from Key Vault for local dev

The registry API rejects remote `DATABASE_URL`, Azure Blob storage connection strings,
and Key Vault configuration when `NODE_ENV` is not `production`.

## Verification

```bash
pnpm --filter @aipm-registry/registry-api test
pnpm test:root
pnpm scan:secrets
pnpm local:check
pnpm --filter @aipm-registry/web verify:local
```

## Maintainers

Production deployment, OAuth, and cloud secrets are documented in
[`infra/azure/`](../infra/azure/). Maintainer-only local notes live in
`.maintainer-private/production-local-notes.md` (gitignored — create locally).
