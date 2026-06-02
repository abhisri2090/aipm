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
