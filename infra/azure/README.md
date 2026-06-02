# Azure Deployment

This is the staging path for the MVP registry API.

## Targets

- Azure App Service: runs `@aipm-registry/registry-api`
- Azure Database for PostgreSQL Flexible Server: package metadata
- Azure Blob Storage: package tarballs

## Suggested Staging Names

- Resource group: `aipm-staging`
- Region: `eastus` or another nearby App Service F1-supported region
- PostgreSQL database: `aipm`
- Storage container: `packages`
- Web App: `aipm-registry-staging`

Before creating resources, confirm the Azure Portal is using the intended
directory and subscription. The App Service, PostgreSQL server, storage account,
and GitHub deploy secret must all belong to the same subscription.

For private deployments, pin scripts to the intended tenant:

```bash
export EXPECTED_TENANT_ID=<tenant-id>
```

When `EXPECTED_TENANT_ID` is set, scripts abort before creating anything if
Azure CLI is not in that tenant.

Run the read-only preflight first:

```bash
./infra/azure/check-context.sh
```

It prints the active account/subscription, verifies the expected staging tenant
when `EXPECTED_TENANT_ID` is set, and shows the exact create, deploy, and verify
commands for the derived Web App name.

If Azure CLI says no active subscription is available, create or attach a
subscription in the staging directory first. The scripts cannot create resource
groups, storage accounts, or App Services without a subscription context.

## Cost Guardrails

- App Service uses `SKU=F1` by default. Microsoft lists App Service F1 as free
  for trials, experimentation, and learning, with 60 CPU minutes per day, 1 GB
  RAM, and 1 GB storage.
- Azure Database for PostgreSQL Flexible Server is billable for provisioned
  compute, storage, and backup storage. The setup script skips PostgreSQL by
  default and uses file metadata on App Service storage. Set
  `CREATE_BILLABLE_POSTGRES=true` only after confirming the active subscription,
  remaining credits, and expected cost.
- Storage accounts can incur small usage charges if usage exceeds free account
  allowances. Keep the staging registry empty or low-volume.
- Always verify the active subscription and remaining credits in Azure Cost
  Management before creating billable resources.
- New subscriptions may start with App Service compute quota at zero. If App
  Service plan creation fails with `Current Limit (Total VMs): 0`, request a
  quota increase to at least `1` for the subscription, then re-run the setup
  script.

## Create Staging Resources

After switching Azure Portal or Cloud Shell to the correct directory and
subscription, run the setup script:

```bash
cd /path/to/aipm
ACKNOWLEDGE_AZURE_COSTS=true ./infra/azure/create-staging.sh
```

Useful overrides:

```bash
LOCATION=eastus \
RESOURCE_GROUP=aipm-staging \
WEBAPP_NAME=aipm-registry-staging \
STORAGE_ACCOUNT=<globally-unique-storage-name> \
POSTGRES_SERVER=<globally-unique-postgres-name> \
CREATE_BILLABLE_POSTGRES=true \
ACKNOWLEDGE_AZURE_COSTS=true \
POSTGRES_PASSWORD='<strong-password>' \
./infra/azure/create-staging.sh
```

The script prints the active subscription before it creates anything. Stop if
that subscription is not the one intended for AIPM.

## App Service Settings

Set these application settings on the Web App:

```txt
NODE_ENV=production
PORT=8080
AIPM_METADATA_BACKEND=postgres
AIPM_DATA_DIR=/home/site/data
WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
DATABASE_URL=postgresql://<user>:<password>@<postgres-host>:5432/aipm?sslmode=require
AZURE_STORAGE_CONNECTION_STRING=<storage-account-connection-string>
AZURE_STORAGE_CONTAINER=packages
```

Use a Linux Node 20 App Service. Set the startup command to:

```bash
node dist/index.js
```

The registry reports its active backends at:

```bash
curl https://<app-name>.azurewebsites.net/health
```

Expected staging response after configuration:

```json
{"status":"ok","metadata":"postgres","storage":"azure-blob"}
```

If PostgreSQL is skipped for the free-plan-friendly path, expect:

```json
{"status":"ok","metadata":"file","storage":"azure-blob"}
```

The free-plan-friendly file metadata path uses `/home/site/data`, so the setup
script sets `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true`.

## GitHub Actions Deploy

The workflow `.github/workflows/deploy-registry-staging.yml` builds, tests,
creates a production package with `pnpm deploy`, and deploys that package to
Azure App Service.

Create a GitHub environment named `staging`, then add this secret:

```txt
AZURE_WEBAPP_PUBLISH_PROFILE
```

If the Web App is not named `aipm-registry-staging`, either set an environment
variable named `AZURE_WEBAPP_NAME` in the GitHub `staging` environment or pass
the `app_name` input when running the workflow manually.

To get the publish profile:

1. Open the Web App in Azure Portal.
2. Go to Overview.
3. Download the publish profile.
4. Paste the full XML contents into the GitHub environment secret.

Run the workflow manually from GitHub Actions, or push to `main` with registry
API changes.

## Direct Deploy

If Azure CLI is available locally or in Cloud Shell, you can deploy without
GitHub Actions:

```bash
./infra/azure/deploy-registry.sh
```

If the Web App name is not the deterministic default, pass it explicitly:

```bash
WEBAPP_NAME=<app-name> ./infra/azure/deploy-registry.sh
```

When `EXPECTED_TENANT_ID` is set, the direct deploy script verifies the active
Azure tenant before deploying and refuses to run outside that tenant.

## VM Deploy

The current production deployment runs on the VM `aipm-registry-vm` behind
Nginx and Let's Encrypt TLS for `aipm-registry.com`. It packages the registry
API, uploads the artifact to the private `deploy` blob container, and uses
Azure VM Run Command to install/update a `systemd` service on the VM.

```bash
STORAGE_ACCOUNT=<storage-account-name> ./infra/azure/deploy-registry-vm.sh
```

The production VM service uses:

```txt
NODE_ENV=production
HOST=127.0.0.1
PORT=8080
AIPM_METADATA_BACKEND=postgres
AIPM_DATA_DIR=/var/lib/aipm
DATABASE_URL=<postgres-url>
KEY_VAULT_NAME=<key-vault-name>
AZURE_STORAGE_CONTAINER=packages
AIPM_REQUIRE_PUBLISH_TOKEN=true
AIPM_PUBLISH_TOKEN_SHA256=<sha256-hex>
```

The deploy script configures Nginx as a reverse proxy, obtains a Let's Encrypt
certificate, redirects HTTP to HTTPS, and removes public access to the internal
registry port after verification. By default it expects the custom domain
`aipm-registry.com`; override it when needed:

```bash
CUSTOM_DOMAIN=aipm-registry.com LETSENCRYPT_EMAIL=<email> ./infra/azure/deploy-registry-vm.sh
```

Create these DNS records at the domain registrar:

```txt
A     @     <vm-public-ip>
CNAME www   aipm-registry.com
```

## Vercel Website Cutover

When the Next.js website is hosted on Vercel, keep the registry API on the VM
under a dedicated API hostname:

```txt
A     api   <vm-public-ip>
```

After creating the DNS record, configure Nginx and Let's Encrypt for the API
hostname:

```bash
API_DOMAIN=api.aipm-registry.com \
LETSENCRYPT_EMAIL=<email> \
./infra/azure/configure-api-domain-vm.sh
```

Then configure the Vercel app with these environment variables:

```txt
AIPM_API_BASE_URL=https://api.aipm-registry.com
AIPM_API_PROXY_ORIGIN=https://api.aipm-registry.com
NEXT_PUBLIC_SITE_URL=https://aipm-registry.com
```

Vercel should serve `aipm-registry.com` and `www.aipm-registry.com`. The VM
should serve `api.aipm-registry.com`. Keep `/v1/*`, `/health`, and `/ready`
rewritten from Vercel to the API hostname so the CLI can continue using
`https://aipm-registry.com` as the registry URL.

Publishing is closed by default. Pass `AIPM_PUBLISH_TOKEN=<raw-token>` or
`AIPM_PUBLISH_TOKEN_SHA256=<sha256-hex>` to the deploy script to set the admin
publish token. If neither is set on the first production deploy, the VM script
generates one and prints it once.

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

Generate `aipm-session-secret` with at least 32 random bytes, for example:

```bash
openssl rand -base64 32
```

Deploy using Key Vault:

```bash
KEY_VAULT_NAME=<key-vault-name> CUSTOM_DOMAIN=aipm-registry.com ./infra/azure/deploy-registry-vm.sh
```

The VM also enables a daily `aipm-metadata-backup.timer` that uploads
`/var/lib/aipm/package-index.json` to Azure Blob while the file metadata backend
is in use.

Rollback to the previous retained deployment artifact:

```bash
./infra/azure/rollback-registry-vm.sh
```

## Verify Staging

After the Web App or VM deploys, run:

```bash
./infra/azure/verify-staging.sh https://<app-name>.azurewebsites.net
# or
./infra/azure/verify-staging.sh https://aipm-registry.com
```

The verifier checks `/health`, publishes a timestamped sample skill version,
installs it into a temporary Cursor project, runs `aipm list`, and confirms the
installed skill file exists.

For production smoke checks, run:

```bash
./infra/azure/verify-production.sh https://aipm-registry.com
```

## Local Development

Local dev uses filesystem package storage unless `AZURE_STORAGE_CONNECTION_STRING`
is set:

```bash
pnpm registry
curl http://localhost:8080/health
```

Without Postgres, the registry falls back to file metadata unless
`AIPM_METADATA_BACKEND=postgres` is set.
