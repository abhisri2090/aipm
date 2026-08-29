#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
LOCATION="${LOCATION:-global}"
DATA_LOCATION="${DATA_LOCATION:-unitedstates}"
COMMUNICATION_SERVICE_NAME="${COMMUNICATION_SERVICE_NAME:-aipm-registry-comm}"
EMAIL_SERVICE_NAME="${EMAIL_SERVICE_NAME:-aipm-registry-email}"
EMAIL_DOMAIN_NAME="${EMAIL_DOMAIN_NAME:-AzureManagedDomain}"
SENDER_USERNAME="${SENDER_USERNAME:-donotreply}"
SENDER_DISPLAY_NAME="${SENDER_DISPLAY_NAME:-AIPM Registry}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-}"
EXPECTED_TENANT_ID="${EXPECTED_TENANT_ID:-}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required." >&2
  exit 1
fi

az extension add --name communication --upgrade --only-show-errors >/dev/null

TENANT_ID="$(az account show --query tenantId --output tsv)"
if [[ -n "${EXPECTED_TENANT_ID}" && "${TENANT_ID}" != "${EXPECTED_TENANT_ID}" ]]; then
  echo "Refusing to create email resources in tenant ${TENANT_ID}; expected ${EXPECTED_TENANT_ID}." >&2
  exit 3
fi

echo "Creating Azure Email Communication Service: ${EMAIL_SERVICE_NAME}"
az communication email create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${EMAIL_SERVICE_NAME}" \
  --location "${LOCATION}" \
  --data-location "${DATA_LOCATION}" \
  --output none

echo "Creating Azure-managed email domain: ${EMAIL_DOMAIN_NAME}"
az communication email domain create \
  --resource-group "${RESOURCE_GROUP}" \
  --email-service-name "${EMAIL_SERVICE_NAME}" \
  --domain-name "${EMAIL_DOMAIN_NAME}" \
  --location "${LOCATION}" \
  --domain-management AzureManaged \
  --user-engmnt-tracking Disabled \
  --output none

DOMAIN_ID="$(az communication email domain show \
  --resource-group "${RESOURCE_GROUP}" \
  --email-service-name "${EMAIL_SERVICE_NAME}" \
  --domain-name "${EMAIL_DOMAIN_NAME}" \
  --query id \
  --output tsv)"

echo "Creating Communication Services resource and linking email domain: ${COMMUNICATION_SERVICE_NAME}"
az communication create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${COMMUNICATION_SERVICE_NAME}" \
  --location "${LOCATION}" \
  --data-location "${DATA_LOCATION}" \
  --linked-domains "${DOMAIN_ID}" \
  --output none

echo "Creating sender username: ${SENDER_USERNAME}"
az communication email domain sender-username create \
  --resource-group "${RESOURCE_GROUP}" \
  --email-service-name "${EMAIL_SERVICE_NAME}" \
  --domain-name "${EMAIL_DOMAIN_NAME}" \
  --sender-username "${SENDER_USERNAME}" \
  --username "${SENDER_USERNAME}" \
  --display-name "${SENDER_DISPLAY_NAME}" \
  --output none

CONNECTION_STRING="$(az communication list-key \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${COMMUNICATION_SERVICE_NAME}" \
  --query primaryConnectionString \
  --output tsv)"

DOMAIN_JSON="$(az communication email domain show \
  --resource-group "${RESOURCE_GROUP}" \
  --email-service-name "${EMAIL_SERVICE_NAME}" \
  --domain-name "${EMAIL_DOMAIN_NAME}" \
  --output json)"

SENDER_DOMAIN="$(printf "%s" "${DOMAIN_JSON}" | node -e '
let data = "";
process.stdin.on("data", (chunk) => data += chunk);
process.stdin.on("end", () => {
  const parsed = JSON.parse(data);
  const props = parsed.properties ?? {};
  process.stdout.write(
    props.mailFromSenderDomain ??
    props.fromSenderDomain ??
    parsed.mailFromSenderDomain ??
    parsed.fromSenderDomain ??
    ""
  );
});
')"

if [[ -n "${SENDER_DOMAIN}" ]]; then
  SENDER_ADDRESS="${SENDER_USERNAME}@${SENDER_DOMAIN}"
else
  SENDER_ADDRESS=""
fi

if [[ -n "${KEY_VAULT_NAME}" ]]; then
  echo "Saving email secrets to Key Vault: ${KEY_VAULT_NAME}"
  az keyvault secret set \
    --vault-name "${KEY_VAULT_NAME}" \
    --name aipm-email-connection-string \
    --value "${CONNECTION_STRING}" \
    --output none
  if [[ -n "${SENDER_ADDRESS}" ]]; then
    az keyvault secret set \
      --vault-name "${KEY_VAULT_NAME}" \
      --name aipm-email-sender-address \
      --value "${SENDER_ADDRESS}" \
      --output none
  fi
  az keyvault secret set \
    --vault-name "${KEY_VAULT_NAME}" \
    --name aipm-email-from-name \
    --value "${SENDER_DISPLAY_NAME}" \
    --output none
fi

cat <<EOF

Azure email service is ready.

GitHub/Vercel/VM env:
  AIPM_EMAIL_FROM_NAME=${SENDER_DISPLAY_NAME}
EOF

if [[ -n "${SENDER_ADDRESS}" ]]; then
  cat <<EOF
  AIPM_EMAIL_SENDER_ADDRESS=${SENDER_ADDRESS}
EOF
else
  cat <<EOF
  AIPM_EMAIL_SENDER_ADDRESS=<open Azure Email domain sender usernames and copy the full sender address>
EOF
fi

cat <<EOF

Secret:
  AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING=<stored in Key Vault if KEY_VAULT_NAME was set>

Recommended:
  Store the connection string as Key Vault secret 'aipm-email-connection-string'.
  Store the sender address as Key Vault secret 'aipm-email-sender-address'.
  Email turns on automatically when both secrets are present on the VM.
EOF
