# AIPM Production Runbook

## Health Checks

```bash
curl https://api.aipm-registry.com/health
curl https://api.aipm-registry.com/ready
./infra/azure/verify-web-cutover.sh
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

## Deploy

```bash
CUSTOM_DOMAIN=aipm-registry.com \
LETSENCRYPT_EMAIL=<email> \
AIPM_PUBLISH_TOKEN=<admin-token> \
./infra/azure/deploy-registry-vm.sh
```

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
vault. The deploy script fetches the secrets through that identity during the
VM update and writes a root-readable environment file for the systemd service.

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
sudo systemctl restart aipm-registry
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
sudo systemctl status aipm-registry
sudo journalctl -u aipm-registry -n 200 --no-pager
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
sudo systemctl status aipm-metadata-backup.timer
```
