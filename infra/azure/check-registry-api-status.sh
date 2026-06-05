#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
VM_NAME="${VM_NAME:-aipm-registry-vm}"
API_URL="${API_URL:-https://api.aipm-registry.com}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-8}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required." >&2
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
echo "API URL: ${API_URL%/}"

if [[ "${POWER_STATE}" != "VM running" ]]; then
  echo
  echo "API checks skipped because the VM is not running."
  echo "Start intentionally with:"
  echo "  ./infra/azure/ensure-registry-vm-running.sh"
  exit 2
fi

check_endpoint() {
  local path="$1"
  local url="${API_URL%/}${path}"
  local status

  status="$(curl -sS --max-time "${TIMEOUT_SECONDS}" -o /dev/null -w "%{http_code}" "${url}" || true)"
  if [[ "${status}" =~ ^2[0-9][0-9]$ ]]; then
    echo "${path}: ok (${status})"
    return 0
  fi

  echo "${path}: failed (${status:-timeout})" >&2
  return 1
}

health_ok=0
ready_ok=0
check_endpoint "/health" || health_ok=$?
check_endpoint "/ready" || ready_ok=$?

if [[ "${health_ok}" -eq 0 && "${ready_ok}" -eq 0 ]]; then
  echo "Registry API is reachable."
  exit 0
fi

echo "Registry API needs attention." >&2
exit 3
