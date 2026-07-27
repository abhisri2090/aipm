# AIPM Production Runbook

## Health Checks

```bash
curl https://api.aipm-registry.com/health
curl https://api.aipm-registry.com/ready
./infra/azure/verify-web-cutover.sh
pnpm prod:smoke
```

If `api.aipm-registry.com` times out, check the VM state without starting
anything:

```bash
./infra/azure/check-registry-api-status.sh
```

Production is expected to run on a regular, non-Spot VM. If the script reports
`VM deallocated`, the API is unexpectedly offline and the Vercel website can
only serve docs/static pages. Start the VM immediately:

```bash
./infra/azure/ensure-registry-vm-running.sh
```

Do not deallocate the production VM as a routine cost-saving step. Use the
deallocation script only for an intentional maintenance window or emergency
shutdown:

```bash
CONFIRM_DEALLOCATE=true CONFIRM_PRODUCTION_OUTAGE=true ./infra/azure/deallocate-registry-vm.sh
```

`/health` confirms the process is alive. `/ready` confirms the metadata and
package storage backends are reachable.

For CLI auth and private package readiness, run these from a clean shell after
the backend and web deploys:

```bash
aipm login --registry https://api.aipm-registry.com --site https://aipm-registry.com
aipm whoami --registry https://api.aipm-registry.com
aipm add @<org>/<private-package>@<version> --registry https://api.aipm-registry.com --target cursor --ci
aipm logout --registry https://api.aipm-registry.com
AIPM_TOKEN=<org-install-token> aipm add @<org>/<private-package>@<version> --registry https://api.aipm-registry.com --target cursor --ci
```

## Production Smoke Tests

Run the smoke script after production deploys, CLI releases, auth changes,
package file handling changes, or website cutovers:

```bash
pnpm prod:smoke
```

The default read-only smoke checks:

- Website HTTPS response, security headers, title, public routes, `robots.txt`,
  and `sitemap.xml`.
- Website rewrite to the registry API through `/v1/packages`.
- API `/health`, `/ready`, auth config, and public package search.
- Public package detail, package file listing, entry file content, tarball
  download, and website package page.
- Publish auth: unauthenticated publish must return `401` or `403`.
- CLI clone/install path: `aipm init` plus `aipm add` into a clean project with
  a Cursor target.

Print the checklist without running network checks:

```bash
pnpm prod:smoke:list
```

For staging or local checks:

```bash
WEB_URL=https://staging.example.com API_URL=https://api-staging.example.com pnpm prod:smoke
WEB_URL=http://127.0.0.1:3000 API_URL=http://127.0.0.1:8080 pnpm prod:smoke -- --allow-http
```

Publish smoke is intentionally opt-in because published versions are immutable.
Reserve a dedicated package such as `@aipm/prod-smoke`, generate a fresh
5-minute publish token for that exact package, then run:

```bash
AIPM_SMOKE_PACKAGE=@aipm/prod-smoke \
AIPM_TOKEN=<fresh-publish-token> \
pnpm prod:smoke -- --require-publish
```

The script publishes a timestamped `0.0.<epoch>` version and installs that exact
version into a temporary project.

Private package install smoke is also optional:

```bash
AIPM_PRIVATE_PACKAGE=@org/private-skill@1.0.0 \
AIPM_INSTALL_TOKEN=<org-install-token> \
pnpm prod:smoke
```

Do not paste tokens into chat, logs, or committed files.

## Deploy

```bash
CUSTOM_DOMAIN=aipm-registry.com \
LETSENCRYPT_EMAIL=<email> \
AIPM_PUBLISH_TOKEN=<admin-token> \
./infra/azure/deploy-registry-vm.sh
```

Deploy the backend before publishing or announcing a CLI build that uses
`aipm login`. The CLI login command requires the production API to expose the
`/v1/cli-auth/*` endpoints and to have the CLI auth tables created in
PostgreSQL by schema bootstrap.

If `AIPM_PUBLISH_TOKEN` is omitted, the script preserves the existing token
hash from `/etc/aipm-registry.env`. On the first deploy only, it generates and
prints a token once.

Production currently uses:

- VM: `aipm-registry-vm`
- Resource group: `aipm-staging`
- Metadata: Azure Database for PostgreSQL Flexible Server
- Package storage: Azure Blob Storage
- Runtime secret source: Azure Key Vault

Preferred production deploy path:

```bash
KEY_VAULT_NAME=<key-vault-name> \
CUSTOM_DOMAIN=aipm-registry.com \
./infra/azure/deploy-registry-vm.sh
```

The Key Vault must contain:

```txt
aipm-storage-connection-string
aipm-database-url
aipm-publish-token-sha256
```

Optional secrets for account login and the admin usage dashboard:

```txt
aipm-github-client-id
aipm-github-client-secret
aipm-session-secret
AIPM-ADMIN-PASSWORD-SHA256 (Key Vault secret name)
AIPM-ADMIN-ALLOWED-USERNAMES (Key Vault secret name)
```

The deploy script maps those vault secrets onto runtime env vars
`AIPM_ADMIN_PASSWORD_SHA256` and `AIPM_ADMIN_ALLOWED_USERNAMES` because systemd
cannot load hyphenated environment variable names.

Generate the admin password hash with:

```bash
printf '%s' 'your-admin-password' | shasum -a 256 | awk '{print $1}'
```

Store allowlisted AIPM usernames as a comma-separated value, for example
`abhisrivastava,teammate-user`. Each user gets an AIPM username automatically on
first GitHub sign-in. Find yours on the dashboard profile or in `GET /v1/me`.

The admin page lives at `/admin`. Users sign in with GitHub, enter the shared
admin password, and the API checks both the hash and the allowlist before
issuing a short-lived admin session cookie.

The VM's system-assigned managed identity needs `Key Vault Secrets User` on the
vault. The deploy script installs a secrets refresh service that writes
`/run/aipm-registry-secrets.env` as `root:aipm` before PM2 starts the API.

## Rollback

```bash
./infra/azure/rollback-registry-vm.sh
./infra/azure/verify-production.sh https://aipm-registry.com
```

Set `ARTIFACT_BLOB=<blob-name>` to roll back to a specific retained deploy
artifact.

## Metadata Restore

1. Restore the VM from Azure VM Backup in the
   `aipm-registry-recovery-vault` Recovery Services vault if the machine is
   lost.
2. If PostgreSQL metadata is damaged, use the PostgreSQL flexible server
   point-in-time restore flow, then update `aipm-database-url` in Key Vault and
   redeploy with `KEY_VAULT_NAME=<key-vault-name>`.
3. If only file metadata is damaged during a temporary file-backend fallback,
   download the latest
   `metadata-backups/package-index-*.json` blob from the package storage
   container.
4. Copy it to `/var/lib/aipm/package-index.json`.
5. Restart the service:

```bash
sudo pm2 restart aipm-registry
curl http://127.0.0.1:8080/ready
```

6. Run production verification from the repo.

## Certificate Renewal

Certbot installs a renewal timer. Check it with:

```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

## Azure Protection

- VM Backup is enabled for `aipm-registry-vm` with `DefaultPolicy`.
- Azure Blob soft delete, container soft delete, and blob versioning are enabled
  on the package storage account.
- Azure Monitor Agent is installed on the VM.
- Metric alert `aipm-registry-vm-cpu-high` watches for sustained CPU above 80%.

## Useful VM Commands

```bash
sudo systemctl status pm2-root
sudo pm2 status
sudo pm2 logs aipm-registry --lines 200
sudo pm2 monit
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
sudo systemctl status aipm-metadata-backup.timer
```

## PM2 Runtime

Production runs PM2 under `pm2-root.service`; the app process itself drops to
the `aipm` user through the PM2 ecosystem `uid`/`gid` settings. The old direct
`aipm-registry.service` is disabled by the deploy script to avoid two Node
processes fighting for port 8080.

Typical PM2 commands:

```bash
sudo systemctl status pm2-root
sudo systemctl restart pm2-root
sudo systemctl status aipm-registry-secrets
sudo systemctl start aipm-registry-secrets
sudo pm2 status
sudo pm2 logs aipm-registry --lines 200
sudo pm2 restart aipm-registry
sudo pm2 save
```
