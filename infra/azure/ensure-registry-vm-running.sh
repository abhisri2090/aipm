#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
VM_NAME="${VM_NAME:-aipm-registry-vm}"
API_URL="${API_URL:-https://api.aipm-registry.com}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required." >&2
  exit 1
fi

POWER_STATE="$(az vm get-instance-view \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VM_NAME}" \
  --query "instanceView.statuses[?starts_with(code,'PowerState/')].code" \
  --output tsv)"

case "${POWER_STATE}" in
  PowerState/running)
    echo "${VM_NAME} is already running."
    ;;
  PowerState/deallocated | PowerState/stopped)
    echo "${VM_NAME} is ${POWER_STATE#PowerState/}; starting..."
    az vm start --resource-group "${RESOURCE_GROUP}" --name "${VM_NAME}" --output none
    for _ in $(seq 1 24); do
      sleep 10
      POWER_STATE="$(az vm get-instance-view \
        --resource-group "${RESOURCE_GROUP}" \
        --name "${VM_NAME}" \
        --query "instanceView.statuses[?starts_with(code,'PowerState/')].code" \
        --output tsv)"
      if [[ "${POWER_STATE}" == "PowerState/running" ]]; then
        break
      fi
    done
    echo "Waiting for API health at ${API_URL}/health ..."
    for _ in $(seq 1 18); do
      if curl -fsS --max-time 10 "${API_URL%/}/health" >/dev/null 2>&1; then
        echo "API is healthy."
        exit 0
      fi
      sleep 10
    done
    echo "VM is running but ${API_URL}/health did not respond in time." >&2
    exit 2
    ;;
  *)
    echo "Unexpected power state for ${VM_NAME}: ${POWER_STATE:-unknown}" >&2
    exit 3
    ;;
esac

curl -fsS --max-time 10 "${API_URL%/}/health" >/dev/null
echo "API health check passed."
