#!/usr/bin/env bash
set -euo pipefail

WEB_URL="${WEB_URL:-https://aipm-registry.com}"
API_URL="${API_URL:-https://api.aipm-registry.com}"

WEB_URL="${WEB_URL%/}"
API_URL="${API_URL%/}"

if [[ "${WEB_URL}" != https://* || "${API_URL}" != https://* ]]; then
  echo "WEB_URL and API_URL must both be HTTPS URLs." >&2
  exit 2
fi

echo "Checking website headers: ${WEB_URL}/"
WEB_HEADERS="$(curl -fsSI "${WEB_URL}/")"
printf "%s\n" "${WEB_HEADERS}" | grep -qi "^strict-transport-security:"
printf "%s\n" "${WEB_HEADERS}" | grep -qi "^x-content-type-options:"
printf "%s\n" "${WEB_HEADERS}" | grep -qi "^referrer-policy:"
printf "%s\n" "${WEB_HEADERS}" | grep -qi "^content-security-policy:"

echo "Checking website SEO routes"
curl -fsS "${WEB_URL}/robots.txt" | grep -q "Sitemap: ${WEB_URL}/sitemap.xml"
curl -fsS "${WEB_URL}/sitemap.xml" | grep -q "<loc>${WEB_URL}/registry</loc>"
curl -fsS "${WEB_URL}/registry" | grep -q "<title>AI Skills Registry | AIPM"

echo "Checking direct API health: ${API_URL}/health"
curl -fsS "${API_URL}/health"
echo

echo "Checking direct API readiness: ${API_URL}/ready"
curl -fsS "${API_URL}/ready"
echo

echo "Checking API package search"
curl -fsS "${API_URL}/v1/packages?limit=1" | node -e '
let data = "";
process.stdin.on("data", (chunk) => data += chunk);
process.stdin.on("end", () => {
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed.packages)) throw new Error("packages must be an array");
});
'

echo "Checking Vercel rewrite to API"
curl -fsS "${WEB_URL}/v1/packages?limit=1" | node -e '
let data = "";
process.stdin.on("data", (chunk) => data += chunk);
process.stdin.on("end", () => {
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed.packages)) throw new Error("packages must be an array");
});
'

echo "Checking unauthenticated publish is closed"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/aipm-web-cutover.XXXXXX")"
trap 'rm -rf "${TMP_ROOT}"' EXIT
SKILL_DIR="${TMP_ROOT}/@team/cutover-verify"
mkdir -p "${SKILL_DIR}"
cat >"${SKILL_DIR}/aipm.manifest.json" <<JSON
{
  "schemaVersion": "0.1",
  "name": "@team/cutover-verify",
  "version": "0.0.$(date +%s)",
  "type": "skill",
  "description": "Cutover verification skill",
  "entry": "SKILL.md",
  "targets": ["cursor"],
  "license": "Apache-2.0"
}
JSON
cat >"${SKILL_DIR}/SKILL.md" <<'EOF_SKILL'
# Cutover verifier

This package should not publish without a token.
EOF_SKILL

pushd "${SKILL_DIR}" >/dev/null
tar -czf "${TMP_ROOT}/package.tgz" .
popd >/dev/null

STATUS="$(curl -sS -o "${TMP_ROOT}/publish-response.json" -w "%{http_code}" \
  -F "tarball=@${TMP_ROOT}/package.tgz" \
  "${API_URL}/v1/packages/%40team%2Fcutover-verify/versions")"
if [[ "${STATUS}" != "401" ]]; then
  echo "Expected unauthenticated publish to return 401, got ${STATUS}" >&2
  cat "${TMP_ROOT}/publish-response.json" >&2
  exit 1
fi

echo "Web cutover verification passed:"
echo "Website: ${WEB_URL}"
echo "API: ${API_URL}"
