#!/usr/bin/env bash
set -euo pipefail

EXPECTED_TENANT_ID="${EXPECTED_TENANT_ID:-}"
EXPECTED_TENANT_NAME="${EXPECTED_TENANT_NAME:-configured staging tenant}"
RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"

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

SUBSCRIPTION_ID="$(az account show --query id --output tsv)"
TENANT_ID="$(az account show --query tenantId --output tsv)"
NAME_SUFFIX="$(printf "%s" "${SUBSCRIPTION_ID}" | tr -d '-' | tr '[:upper:]' '[:lower:]' | cut -c1-10)"
WEBAPP_NAME="${WEBAPP_NAME:-aipm-registry-stg-${NAME_SUFFIX}}"

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
echo "  Web App:        ${WEBAPP_NAME}"
echo
echo "Free-plan-friendly create command:"
echo "  ACKNOWLEDGE_AZURE_COSTS=true ./infra/azure/create-staging.sh"
echo
echo "Direct deploy command after resources exist:"
echo "  ./infra/azure/deploy-registry.sh"
echo
echo "Verification command after deploy:"
echo "  ./infra/azure/verify-staging.sh https://${WEBAPP_NAME}.azurewebsites.net"
