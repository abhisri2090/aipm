# Azure VM Deployment

The backend registry API is deployed on the Azure VM path only.

## Current Targets

- Frontend website: Vercel
- Backend registry API: Azure VM behind Nginx
- Primary API hostname: `https://api.aipm-registry.com`
- Public website hostname: `https://aipm-registry.com`
- VM service: `aipm-registry.service`

The old Azure App Service / Web App deployment path has been removed to avoid
publishing to the wrong target.

## Azure Context

Before running any Azure script, confirm Azure CLI is using the intended
directory and subscription:

```bash
./infra/azure/check-context.sh
```

For private deployments, pin scripts to the intended tenant:

```bash
export EXPECTED_TENANT_ID=<tenant-id>
```

When `EXPECTED_TENANT_ID` is set, scripts abort if Azure CLI is not in that
tenant.

## VM Deploy

The production deployment runs on the VM `aipm-registry-vm` behind Nginx and
Let's Encrypt TLS. The deploy script packages `@aipm-registry/registry-api`,
uploads the artifact to the private `deploy` blob container, and uses Azure VM
Run Command to install or update the `systemd` service on the VM.

```bash
STORAGE_ACCOUNT=<storage-account-name> ./infra/azure/deploy-registry-vm.sh
```

## GitHub Actions Deploy

The workflow `.github/workflows/deploy-api-vm.yml` deploys the registry API to
the VM only when an `api-v*` tag is pushed. It does not deploy on branch pushes.

Create a GitHub environment named `production`.

Secrets:

```txt
AZURE_CREDENTIALS
LETSENCRYPT_EMAIL
AIPM_PUBLISH_TOKEN
AIPM_PUBLISH_TOKEN_SHA256
```

Variables:

```txt
AZURE_RESOURCE_GROUP=aipm-staging
AZURE_VM_NAME=aipm-registry-vm
AZURE_STORAGE_ACCOUNT=<storage-account-name>
AZURE_DEPLOY_CONTAINER=deploy
AZURE_PACKAGE_CONTAINER=packages
AZURE_KEY_VAULT_NAME=<key-vault-name>
AZURE_TENANT_ID=<tenant-id>
AIPM_API_DOMAIN=api.aipm-registry.com
AIPM_API_URL=https://api.aipm-registry.com
AIPM_PUBLIC_SITE_URL=https://aipm-registry.com
AIPM_COOKIE_DOMAIN=.aipm-registry.com
```

`AZURE_CREDENTIALS` is the JSON credentials object consumed by `azure/login@v2`.
If Key Vault already stores `aipm-publish-token-sha256`, `AIPM_PUBLISH_TOKEN`
and `AIPM_PUBLISH_TOKEN_SHA256` can be omitted.

Create the API deploy tag from the commit you want to deploy:

```bash
git tag api-v0.2.0
git push origin api-v0.2.0
```

The workflow sets `apps/registry-api/package.json` to the tag version inside
the runner before packaging the API.

Common production options:

```bash
RESOURCE_GROUP=aipm-staging \
VM_NAME=aipm-registry-vm \
STORAGE_ACCOUNT=<storage-account-name> \
CUSTOM_DOMAIN=api.aipm-registry.com \
LETSENCRYPT_EMAIL=<email> \
KEY_VAULT_NAME=<key-vault-name> \
./infra/azure/deploy-registry-vm.sh
```

The VM service uses:

```txt
NODE_ENV=production
HOST=127.0.0.1
PORT=8080
AIPM_DATA_DIR=/var/lib/aipm
AIPM_METADATA_BACKEND=postgres
DATABASE_URL=<postgres-url>
KEY_VAULT_NAME=<key-vault-name>
AZURE_STORAGE_CONTAINER=packages
AIPM_REQUIRE_PUBLISH_TOKEN=true
AIPM_PUBLISH_TOKEN_SHA256=<sha256-hex>
```

Publishing is closed by default. Pass `AIPM_PUBLISH_TOKEN=<raw-token>` or
`AIPM_PUBLISH_TOKEN_SHA256=<sha256-hex>` to the deploy script to set the admin
publish token. If neither is set on the first production deploy, the VM script
generates one and prints it once.

## DNS

With the website hosted on Vercel, keep the registry API on the VM under a
dedicated API hostname:

```txt
A     api   <vm-public-ip>
```

Vercel should serve:

```txt
aipm-registry.com
www.aipm-registry.com
```

The VM should serve:

```txt
api.aipm-registry.com
```

After creating the DNS record, configure Nginx and Let's Encrypt for the API
hostname:

```bash
API_DOMAIN=api.aipm-registry.com \
LETSENCRYPT_EMAIL=<email> \
./infra/azure/configure-api-domain-vm.sh
```

Configure the Vercel app with:

```txt
AIPM_API_BASE_URL=https://api.aipm-registry.com
AIPM_API_PROXY_ORIGIN=https://api.aipm-registry.com
NEXT_PUBLIC_SITE_URL=https://aipm-registry.com
```

Keep `/v1/*`, `/health`, and `/ready` rewritten from Vercel to the API hostname
so the CLI can continue using `https://aipm-registry.com` as the registry URL.

## Secrets

For production, store runtime secrets in Azure Key Vault and deploy with the
vault name. The VM must have a system-assigned managed identity with the
`Key Vault Secrets User` role on the vault.

Required secret names:

```txt
aipm-storage-connection-string
aipm-database-url
aipm-publish-token-sha256
aipm-github-client-id
aipm-github-client-secret
aipm-session-secret
```

The GitHub OAuth app callback URL must be:

```txt
https://api.aipm-registry.com/v1/auth/github/callback
```

Generate `aipm-session-secret` with at least 32 random bytes:

```bash
openssl rand -base64 32
```

## Verify

For production smoke checks:

```bash
./infra/azure/verify-production.sh https://api.aipm-registry.com
```

For a publish/install staging-style verification against the VM, provide a valid
admin publish token:

```bash
AIPM_TOKEN=<raw-token> ./infra/azure/verify-staging.sh https://api.aipm-registry.com
```

If the API appears down, check VM and service state:

```bash
./infra/azure/check-registry-api-status.sh
```

Production is expected to run on a regular, non-Spot VM. If it reports
`VM deallocated`, the docs site on Vercel can still load but registry search,
dashboard actions, install, and publish calls will fail until the VM is started:

```bash
./infra/azure/ensure-registry-vm-running.sh
```

Do not deallocate production as a routine cost-saving step. Use this only for an
intentional maintenance window or emergency shutdown:

```bash
CONFIRM_DEALLOCATE=true CONFIRM_PRODUCTION_OUTAGE=true ./infra/azure/deallocate-registry-vm.sh
```

## Rollback

Rollback to the previous retained deployment artifact:

```bash
./infra/azure/rollback-registry-vm.sh
```

## Local Development

Local dev uses filesystem package storage unless
`AZURE_STORAGE_CONNECTION_STRING` is set:

```bash
pnpm registry
curl http://localhost:8080/health
```

Without Postgres, the registry falls back to file metadata unless
`AIPM_METADATA_BACKEND=postgres` is set.
