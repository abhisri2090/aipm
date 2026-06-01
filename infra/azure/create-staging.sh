#!/usr/bin/env bash
set -euo pipefail

LOCATION="${LOCATION:-eastus}"
RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
POSTGRES_DB="${POSTGRES_DB:-aipm}"
POSTGRES_ADMIN="${POSTGRES_ADMIN:-aipmadmin}"
STORAGE_CONTAINER="${STORAGE_CONTAINER:-packages}"
APP_SERVICE_PLAN="${APP_SERVICE_PLAN:-aipm-registry-staging-plan}"
SKU="${SKU:-F1}"
CREATE_BILLABLE_POSTGRES="${CREATE_BILLABLE_POSTGRES:-false}"
EXPECTED_TENANT_ID="${EXPECTED_TENANT_ID:-}"
ACKNOWLEDGE_AZURE_COSTS="${ACKNOWLEDGE_AZURE_COSTS:-false}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required. Run this from Azure Cloud Shell or install az locally." >&2
  exit 1
fi

if ! az account show --output none 2>/dev/null; then
  cat >&2 <<EOF
No active Azure subscription is available to Azure CLI.

Sign in to the staging tenant and make sure it has an active subscription:
  az login --tenant ${EXPECTED_TENANT_ID}

This script will not create resources until Azure CLI has a subscription context.
EOF
  exit 2
fi

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  if [[ "${CREATE_BILLABLE_POSTGRES}" == "true" ]]; then
    read -r -s -p "Postgres admin password: " POSTGRES_PASSWORD
    echo
  else
    POSTGRES_PASSWORD=""
  fi
fi

echo "Using subscription:"
az account show --query "{name:name,id:id,tenantId:tenantId}" --output table
SUBSCRIPTION_ID="$(az account show --query id --output tsv)"
TENANT_ID="$(az account show --query tenantId --output tsv)"
NAME_SUFFIX="$(printf "%s" "${SUBSCRIPTION_ID}" | tr -d '-' | tr '[:upper:]' '[:lower:]' | cut -c1-10)"

if [[ -n "${EXPECTED_TENANT_ID}" && "${TENANT_ID}" != "${EXPECTED_TENANT_ID}" ]]; then
  cat >&2 <<EOF

Refusing to create Azure resources in tenant ${TENANT_ID}.
Expected staging tenant ${EXPECTED_TENANT_ID}.

Switch Azure directory/subscription first, then re-run this script.

EOF
  exit 3
fi

if [[ "${ACKNOWLEDGE_AZURE_COSTS}" != "true" ]]; then
  cat >&2 <<EOF

Refusing to create Azure resources until costs are acknowledged.
The default path avoids PostgreSQL and uses App Service F1, but storage and
usage can still incur charges depending on your Azure free-plan status.

Re-run with ACKNOWLEDGE_AZURE_COSTS=true after checking Cost Management.

EOF
  exit 4
fi

POSTGRES_SERVER="${POSTGRES_SERVER:-aipm-registry-stg-pg-${NAME_SUFFIX}}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-aipmstg${NAME_SUFFIX}}"
WEBAPP_NAME="${WEBAPP_NAME:-aipm-registry-stg-${NAME_SUFFIX}}"

echo "Resolved resource names:"
echo "  PostgreSQL server: ${POSTGRES_SERVER}"
echo "  Storage account:   ${STORAGE_ACCOUNT}"
echo "  Web App:           ${WEBAPP_NAME}"
echo "  App Service SKU:   ${SKU}"
echo "  PostgreSQL opt-in: ${CREATE_BILLABLE_POSTGRES}"

echo "Ensuring required Azure resource providers are registered..."
az provider register --namespace Microsoft.Storage --wait --output none
az provider register --namespace Microsoft.Web --wait --output none

if az group show --name "${RESOURCE_GROUP}" --output none 2>/dev/null; then
  GROUP_LOCATION="$(az group show --name "${RESOURCE_GROUP}" --query location --output tsv)"
  echo "Using existing resource group ${RESOURCE_GROUP} in ${GROUP_LOCATION}."
else
  echo "Creating resource group ${RESOURCE_GROUP} in ${LOCATION}..."
  az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --output none
fi

DATABASE_URL=""
METADATA_BACKEND="file"

if [[ "${CREATE_BILLABLE_POSTGRES}" == "true" ]]; then
  echo "Creating PostgreSQL Flexible Server ${POSTGRES_SERVER}..."
  if ! az postgres flexible-server show \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${POSTGRES_SERVER}" \
    --output none 2>/dev/null; then
    az postgres flexible-server create \
      --resource-group "${RESOURCE_GROUP}" \
      --name "${POSTGRES_SERVER}" \
      --location "${LOCATION}" \
      --admin-user "${POSTGRES_ADMIN}" \
      --admin-password "${POSTGRES_PASSWORD}" \
      --sku-name Standard_B1ms \
      --tier Burstable \
      --storage-size 32 \
      --version 16 \
      --public-access 0.0.0.0 \
      --yes \
      --output none
  fi

  echo "Ensuring PostgreSQL database ${POSTGRES_DB}..."
  az postgres flexible-server db create \
    --resource-group "${RESOURCE_GROUP}" \
    --server-name "${POSTGRES_SERVER}" \
    --database-name "${POSTGRES_DB}" \
    --output none

  POSTGRES_HOST="$(az postgres flexible-server show \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${POSTGRES_SERVER}" \
    --query fullyQualifiedDomainName \
    --output tsv)"
  DATABASE_URL="postgresql://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?sslmode=require"
  METADATA_BACKEND="postgres"
else
  echo "Skipping PostgreSQL because CREATE_BILLABLE_POSTGRES is not true."
  echo "The Web App will use file metadata at /home/site/data/package-index.json."
fi

echo "Creating storage account ${STORAGE_ACCOUNT}..."
if ! az storage account show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT}" \
  --output none 2>/dev/null; then
  az storage account create \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${STORAGE_ACCOUNT}" \
    --location "${LOCATION}" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --https-only true \
    --min-tls-version TLS1_2 \
    --allow-blob-public-access false \
    --output none
fi

STORAGE_CONNECTION_STRING="$(az storage account show-connection-string \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT}" \
  --query connectionString \
  --output tsv)"

echo "Ensuring storage container ${STORAGE_CONTAINER}..."
az storage container create \
  --name "${STORAGE_CONTAINER}" \
  --connection-string "${STORAGE_CONNECTION_STRING}" \
  --public-access off \
  --output none

echo "Creating App Service plan ${APP_SERVICE_PLAN}..."
az appservice plan create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${APP_SERVICE_PLAN}" \
  --location "${LOCATION}" \
  --is-linux \
  --sku "${SKU}" \
  --output none

echo "Creating Web App ${WEBAPP_NAME}..."
if ! az webapp show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${WEBAPP_NAME}" \
  --output none 2>/dev/null; then
  az webapp create \
    --resource-group "${RESOURCE_GROUP}" \
    --plan "${APP_SERVICE_PLAN}" \
    --name "${WEBAPP_NAME}" \
    --runtime "NODE:20-lts" \
    --output none
fi

echo "Configuring Web App settings..."
az webapp config appsettings set \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${WEBAPP_NAME}" \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    AIPM_METADATA_BACKEND="${METADATA_BACKEND}" \
    AIPM_DATA_DIR=/home/site/data \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
    DATABASE_URL="${DATABASE_URL}" \
    AZURE_STORAGE_CONNECTION_STRING="${STORAGE_CONNECTION_STRING}" \
    AZURE_STORAGE_CONTAINER="${STORAGE_CONTAINER}" \
  --output none

az webapp config set \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${WEBAPP_NAME}" \
  --startup-file "node dist/index.js" \
  --output none

echo
echo "Staging resources are configured."
echo "Web App URL: https://${WEBAPP_NAME}.azurewebsites.net"
echo "Health check after deploy: https://${WEBAPP_NAME}.azurewebsites.net/health"
echo
echo "Next: download the Web App publish profile and add it to GitHub environment"
echo "secret AZURE_WEBAPP_PUBLISH_PROFILE, then run deploy-registry-staging.yml."
