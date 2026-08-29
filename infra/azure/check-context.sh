#!/usr/bin/env bash
set -euo pipefail

EXPECTED_TENANT_ID="${EXPECTED_TENANT_ID:-}"
EXPECTED_TENANT_NAME="${EXPECTED_TENANT_NAME:-configured staging tenant}"
RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
VM_NAME="${VM_NAME:-aipm-registry-vm}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required. Run this from Azure Cloud Shell or install az locally." >&2
  exit 1
fi

if ! az account show --output none 2>/dev/null; then
  cat >&2 <<EOF
No active Azure subscription is available to Azure CLI.

Sign in to the staging tenant and make sure it has an active subscription:
  az login --tenant ${EXPECTED_TENANT_ID}

If this is a new/free Azure account, create or attach the subscription in the
Azure portal before creating resources.
EOF
  exit 2
fi

echo "Active Azure account:"
az account show --query "{name:name,id:id,tenantId:tenantId,user:user.name}" --output table
echo

echo "Available subscriptions:"
az account list --query "[].{name:name,id:id,tenantId:tenantId,isDefault:isDefault,state:state}" --output table
echo

TENANT_ID="$(az account show --query tenantId --output tsv)"

if [[ -n "${EXPECTED_TENANT_ID}" && "${TENANT_ID}" != "${EXPECTED_TENANT_ID}" ]]; then
  cat >&2 <<EOF
Context check failed.

Active tenant:   ${TENANT_ID}
Expected tenant: ${EXPECTED_TENANT_ID} (${EXPECTED_TENANT_NAME})

Switch to the expected staging directory/subscription before creating or deploying resources.
EOF
  exit 3
fi

if [[ -n "${EXPECTED_TENANT_ID}" ]]; then
  echo "Context check passed for ${EXPECTED_TENANT_NAME}."
else
  echo "Context check passed. Set EXPECTED_TENANT_ID to pin deployments to one tenant."
fi
echo
echo "Default derived resource names:"
echo "  Resource group: ${RESOURCE_GROUP}"
echo "  VM:             ${VM_NAME}"
echo
echo "VM deploy command:"
echo "  STORAGE_ACCOUNT=<storage-account-name> ./infra/azure/deploy-registry-vm.sh"
echo
echo "Verification command after deploy:"
echo "  ./infra/azure/verify-production.sh https://api.aipm-registry.com"
