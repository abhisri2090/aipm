#!/usr/bin/env bash
set -euo pipefail

REGISTRY_URL="${1:-${REGISTRY_URL:-}}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/aipm-staging-verify.XXXXXX")"

cleanup() {
  rm -rf "${TMP_ROOT}"
}
trap cleanup EXIT

if [[ -z "${REGISTRY_URL}" ]]; then
  echo "Usage: $0 https://<registry-url>" >&2
  exit 1
fi

REGISTRY_URL="${REGISTRY_URL%/}"
SKILL_DIR="${TMP_ROOT}/sample-skill"
PROJECT_DIR="${TMP_ROOT}/project"
VERSION="0.0.$(date +%s)"

cp -R "${REPO_ROOT}/examples/skills/@team/sample-skill" "${SKILL_DIR}"

node -e '
const fs = require("node:fs");
const path = process.argv[1];
const version = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path, "utf8"));
manifest.version = version;
fs.writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
' "${SKILL_DIR}/aipm.manifest.json" "${VERSION}"

mkdir -p "${PROJECT_DIR}/.cursor"

echo "Checking health: ${REGISTRY_URL}/health"
HEALTH="$(curl -fsS "${REGISTRY_URL}/health")"
echo "${HEALTH}"

echo "Publishing @team/sample-skill@${VERSION}"
PUBLISH_ARGS=(publish "${SKILL_DIR}" --registry "${REGISTRY_URL}")
if [[ -n "${AIPM_TOKEN:-}" ]]; then
  PUBLISH_ARGS+=(--token "${AIPM_TOKEN}")
fi
node "${REPO_ROOT}/apps/cli/dist/bin.cjs" "${PUBLISH_ARGS[@]}"

echo "Installing into ${PROJECT_DIR}"
(
  cd "${PROJECT_DIR}"
  node "${REPO_ROOT}/apps/cli/dist/bin.cjs" init --registry "${REGISTRY_URL}"
  node "${REPO_ROOT}/apps/cli/dist/bin.cjs" add "@team/sample-skill@${VERSION}" --target cursor --ci
  node "${REPO_ROOT}/apps/cli/dist/bin.cjs" list
)

INSTALLED_FILE="${PROJECT_DIR}/.cursor/aipm/skills/sample-skill.md"
if [[ ! -f "${INSTALLED_FILE}" ]]; then
  echo "Expected installed skill file missing: ${INSTALLED_FILE}" >&2
  exit 1
fi

if ! grep -q "Sample skill" "${INSTALLED_FILE}"; then
  echo "Installed skill file did not contain expected sample content." >&2
  exit 1
fi

echo "Staging verification passed for ${REGISTRY_URL}"
