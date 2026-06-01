#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
WEBAPP_NAME="${WEBAPP_NAME:-}"
EXPECTED_TENANT_ID="${EXPECTED_TENANT_ID:-}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="${REPO_ROOT}/deploy/registry-api"
ZIP_PATH="${REPO_ROOT}/deploy/registry-api.zip"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required. Run this from Azure Cloud Shell or install az locally." >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required to create the App Service package." >&2
  exit 1
fi

if ! az account show --output none 2>/dev/null; then
  cat >&2 <<EOF
No active Azure subscription is available to Azure CLI.

Sign in to the staging tenant and make sure it has an active subscription:
  az login --tenant ${EXPECTED_TENANT_ID}

This script will not deploy until Azure CLI has a subscription context.
EOF
  exit 2
fi

echo "Using subscription:"
az account show --query "{name:name,id:id,tenantId:tenantId}" --output table
SUBSCRIPTION_ID="$(az account show --query id --output tsv)"
TENANT_ID="$(az account show --query tenantId --output tsv)"
NAME_SUFFIX="$(printf "%s" "${SUBSCRIPTION_ID}" | tr -d '-' | tr '[:upper:]' '[:lower:]' | cut -c1-10)"

if [[ -n "${EXPECTED_TENANT_ID}" && "${TENANT_ID}" != "${EXPECTED_TENANT_ID}" ]]; then
  cat >&2 <<EOF

Refusing to deploy in tenant ${TENANT_ID}.
Expected staging tenant ${EXPECTED_TENANT_ID}.

Switch Azure directory/subscription first, then re-run this script.

EOF
  exit 3
fi

WEBAPP_NAME="${WEBAPP_NAME:-aipm-registry-stg-${NAME_SUFFIX}}"

echo "Deploying registry API to ${WEBAPP_NAME} in ${RESOURCE_GROUP}..."

cd "${REPO_ROOT}"
pnpm build
rm -rf "${DEPLOY_DIR}" "${ZIP_PATH}"
pnpm --filter @aipm/registry-api deploy --prod "${DEPLOY_DIR}"

(
  cd "${DEPLOY_DIR}"
  zip -qr "${ZIP_PATH}" .
)

az webapp deploy \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${WEBAPP_NAME}" \
  --src-path "${ZIP_PATH}" \
  --type zip \
  --async false \
  --output none

echo "Deploy complete: https://${WEBAPP_NAME}.azurewebsites.net"
echo "Health check:    https://${WEBAPP_NAME}.azurewebsites.net/health"
