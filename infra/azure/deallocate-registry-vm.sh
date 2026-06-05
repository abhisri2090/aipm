#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
VM_NAME="${VM_NAME:-aipm-registry-vm}"
CONFIRM_DEALLOCATE="${CONFIRM_DEALLOCATE:-false}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required." >&2
  exit 1
fi

POWER_STATE="$(az vm get-instance-view \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VM_NAME}" \
  --query "instanceView.statuses[?starts_with(code,'PowerState/')].displayStatus | [0]" \
  --output tsv)"

echo "VM: ${VM_NAME}"
echo "Resource group: ${RESOURCE_GROUP}"
echo "Power state: ${POWER_STATE:-unknown}"

if [[ "${POWER_STATE}" == "VM deallocated" ]]; then
  echo "VM is already deallocated."
  exit 0
fi

if [[ "${CONFIRM_DEALLOCATE}" != "true" ]]; then
  cat >&2 <<EOF
Refusing to deallocate without explicit confirmation.

Deallocating stops the registry API, dashboard actions, install, and publish.
The Vercel website can still serve static docs, but live registry calls will fail.

Run intentionally with:
  CONFIRM_DEALLOCATE=true ./infra/azure/deallocate-registry-vm.sh
EOF
  exit 2
fi

echo "Deallocating ${VM_NAME}..."
az vm deallocate --resource-group "${RESOURCE_GROUP}" --name "${VM_NAME}" --output none
echo "VM deallocated."
