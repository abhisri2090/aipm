#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
VM_NAME="${VM_NAME:-aipm-registry-vm}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-}"
DEPLOY_CONTAINER="${DEPLOY_CONTAINER:-deploy}"
ARTIFACT_BLOB="${ARTIFACT_BLOB:-}"
REGISTRY_URL="${REGISTRY_URL:-https://aipm-registry.com}"
EXPECTED_TENANT_ID="${EXPECTED_TENANT_ID:-}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required." >&2
  exit 1
fi

TENANT_ID="$(az account show --query tenantId --output tsv)"
if [[ -n "${EXPECTED_TENANT_ID}" && "${TENANT_ID}" != "${EXPECTED_TENANT_ID}" ]]; then
  echo "Refusing to rollback in tenant ${TENANT_ID}; expected ${EXPECTED_TENANT_ID}." >&2
  exit 3
fi

if [[ -z "${STORAGE_ACCOUNT}" ]]; then
  STORAGE_ACCOUNT="$(az storage account list \
    --resource-group "${RESOURCE_GROUP}" \
    --query "[0].name" \
    --output tsv)"
fi

if [[ -z "${STORAGE_ACCOUNT}" ]]; then
  echo "Set STORAGE_ACCOUNT or create a storage account in ${RESOURCE_GROUP}." >&2
  exit 2
fi

STORAGE_CONNECTION_STRING="$(az storage account show-connection-string \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT}" \
  --query connectionString \
  --output tsv)"

if [[ -z "${ARTIFACT_BLOB}" ]]; then
  ARTIFACT_BLOB="$(az storage blob list \
    --container-name "${DEPLOY_CONTAINER}" \
    --connection-string "${STORAGE_CONNECTION_STRING}" \
    --query "[?starts_with(name, 'registry-api-vm-') && name != 'registry-api-vm-latest.tgz'] | sort_by(@, &properties.lastModified)[-2].name" \
    --output tsv)"
fi

if [[ -z "${ARTIFACT_BLOB}" || "${ARTIFACT_BLOB}" == "None" ]]; then
  echo "No previous registry-api-vm artifact found. Set ARTIFACT_BLOB explicitly." >&2
  exit 4
fi

if date -u -v+2H "+%Y-%m-%dT%H:%MZ" >/dev/null 2>&1; then
  SAS_EXPIRY="$(date -u -v+2H "+%Y-%m-%dT%H:%MZ")"
else
  SAS_EXPIRY="$(date -u -d "+2 hours" "+%Y-%m-%dT%H:%MZ")"
fi

SAS="$(az storage blob generate-sas \
  --container-name "${DEPLOY_CONTAINER}" \
  --name "${ARTIFACT_BLOB}" \
  --permissions r \
  --expiry "${SAS_EXPIRY}" \
  --connection-string "${STORAGE_CONNECTION_STRING}" \
  --https-only \
  --output tsv)"

ARTIFACT_URL="https://${STORAGE_ACCOUNT}.blob.core.windows.net/${DEPLOY_CONTAINER}/${ARTIFACT_BLOB}?${SAS}"
ARTIFACT_B64="$(printf "%s" "${ARTIFACT_URL}" | base64 | tr -d "\n")"

az vm run-command invoke \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VM_NAME}" \
  --command-id RunShellScript \
  --scripts "set -eu
ARTIFACT_URL=\"\$(printf '%s' '${ARTIFACT_B64}' | base64 -d)\"
curl -fsSL \"\$ARTIFACT_URL\" -o /tmp/aipm-registry-rollback.tgz
sudo rm -rf /opt/aipm/registry/*
sudo tar -xzf /tmp/aipm-registry-rollback.tgz -C /opt/aipm/registry
sudo chown -R aipm:aipm /opt/aipm/registry
sudo systemctl restart aipm-registry
sleep 3
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/ready
" \
  --query "value[].message" \
  --output tsv

curl -fsS "${REGISTRY_URL%/}/health"
echo
curl -fsS "${REGISTRY_URL%/}/ready"
echo
echo "Rolled back ${VM_NAME} to ${ARTIFACT_BLOB}"
