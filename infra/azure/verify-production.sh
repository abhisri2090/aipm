#!/usr/bin/env bash
set -euo pipefail

REGISTRY_URL="${1:-${REGISTRY_URL:-https://aipm-registry.com}}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

REGISTRY_URL="${REGISTRY_URL%/}"
if [[ "${REGISTRY_URL}" != https://* ]]; then
  echo "Production verification requires an HTTPS URL." >&2
  exit 2
fi

echo "Checking health: ${REGISTRY_URL}/health"
curl -fsS "${REGISTRY_URL}/health"
echo

echo "Checking readiness: ${REGISTRY_URL}/ready"
curl -fsS "${REGISTRY_URL}/ready"
echo

echo "Checking security headers"
HEADERS="$(curl -fsSI "${REGISTRY_URL}/")"
printf "%s\n" "${HEADERS}" | grep -qi "^strict-transport-security:"
printf "%s\n" "${HEADERS}" | grep -qi "^x-content-type-options:"
printf "%s\n" "${HEADERS}" | grep -qi "^referrer-policy:"
printf "%s\n" "${HEADERS}" | grep -qi "^content-security-policy:"

echo "Checking auth config exposes email and GitHub toggles"
curl -fsS "${REGISTRY_URL}/v1/auth/config" | node -e '
let data = "";
process.stdin.on("data", (chunk) => data += chunk);
process.stdin.on("end", () => {
  const parsed = JSON.parse(data);
  if (typeof parsed.devAuth !== "boolean") throw new Error("devAuth must be boolean");
  if (typeof parsed.githubAuth !== "boolean") throw new Error("githubAuth must be boolean");
  if (typeof parsed.emailAuth !== "boolean") throw new Error("emailAuth must be boolean");
});
'

echo "Checking CLI auth endpoints are present and closed without a valid session"
CLI_AUTHORIZE_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" \
  -H "content-type: application/json" \
  -d '{"redirectUri":"http://127.0.0.1:49152/callback","state":"verify","codeChallenge":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}' \
  "${REGISTRY_URL}/v1/cli-auth/authorize")"
if [[ "${CLI_AUTHORIZE_STATUS}" != "401" ]]; then
  echo "Expected unauthenticated CLI authorize to return 401, got ${CLI_AUTHORIZE_STATUS}" >&2
  exit 1
fi

CLI_REFRESH_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" \
  -H "content-type: application/json" \
  -d '{"refreshToken":"aipm_cli_refresh_invalid"}' \
  "${REGISTRY_URL}/v1/cli-auth/refresh")"
if [[ "${CLI_REFRESH_STATUS}" != "401" ]]; then
  echo "Expected invalid CLI refresh to return 401, got ${CLI_REFRESH_STATUS}" >&2
  exit 1
fi

echo "Checking public package search"
curl -fsS "${REGISTRY_URL}/v1/packages?limit=1" | node -e '
let data = "";
process.stdin.on("data", (chunk) => data += chunk);
process.stdin.on("end", () => {
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed.packages)) throw new Error("packages must be an array");
});
'

echo "Checking unauthenticated publish is closed"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/aipm-prod-verify.XXXXXX")"
trap 'rm -rf "${TMP_ROOT}"' EXIT
SKILL_DIR="${TMP_ROOT}/@team/prod-verify"
mkdir -p "${SKILL_DIR}"
cat >"${SKILL_DIR}/aipm.manifest.json" <<JSON
{
  "schemaVersion": "0.1",
  "name": "@team/prod-verify",
  "version": "0.0.$(date +%s)",
  "type": "skill",
  "description": "Production verification skill",
  "entry": "SKILL.md",
  "targets": ["cursor"],
  "license": "Apache-2.0"
}
JSON
cat >"${SKILL_DIR}/SKILL.md" <<'EOF_SKILL'
# Production verifier

This package should not publish without a token.
EOF_SKILL

pushd "${SKILL_DIR}" >/dev/null
tar -czf "${TMP_ROOT}/package.tgz" .
popd >/dev/null

STATUS="$(curl -sS -o "${TMP_ROOT}/publish-response.json" -w "%{http_code}" \
  -F "tarball=@${TMP_ROOT}/package.tgz" \
  "${REGISTRY_URL}/v1/packages/%40team%2Fprod-verify/versions")"
if [[ "${STATUS}" != "401" ]]; then
  echo "Expected unauthenticated publish to return 401, got ${STATUS}" >&2
  cat "${TMP_ROOT}/publish-response.json" >&2
  exit 1
fi

echo "Checking install path with latest listed sample package when available"
pnpm --dir "${REPO_ROOT}" build >/dev/null
SAMPLE_VERSION="$(curl -fsS "${REGISTRY_URL}/v1/packages?q=sample&limit=1" | node -e '
let data = "";
process.stdin.on("data", (chunk) => data += chunk);
process.stdin.on("end", () => {
  const pkg = JSON.parse(data).packages?.[0];
  if (pkg) process.stdout.write(pkg.version);
});
')"
if [[ -n "${SAMPLE_VERSION}" ]]; then
  PROJECT_DIR="${TMP_ROOT}/project"
  mkdir -p "${PROJECT_DIR}/.cursor"
  pushd "${PROJECT_DIR}" >/dev/null
  node "${REPO_ROOT}/apps/cli/dist/bin.cjs" init --registry "${REGISTRY_URL}"
  node "${REPO_ROOT}/apps/cli/dist/bin.cjs" add "@team/sample-skill@${SAMPLE_VERSION}" --target cursor --ci
  popd >/dev/null
fi

echo "Production verification passed for ${REGISTRY_URL}"
