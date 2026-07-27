#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
VM_NAME="${VM_NAME:-aipm-registry-vm}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-}"
DEPLOY_CONTAINER="${DEPLOY_CONTAINER:-deploy}"
PACKAGE_CONTAINER="${PACKAGE_CONTAINER:-packages}"
NSG_NAME="${NSG_NAME:-aipm-registry-vm-nsg}"
REGISTRY_PORT="${REGISTRY_PORT:-8080}"
WEB_PORT="${WEB_PORT:-80}"
TLS_PORT="${TLS_PORT:-443}"
CUSTOM_DOMAIN="${CUSTOM_DOMAIN:-aipm-registry.com}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
AIPM_PUBLISH_TOKEN="${AIPM_PUBLISH_TOKEN:-}"
AIPM_PUBLISH_TOKEN_SHA256="${AIPM_PUBLISH_TOKEN_SHA256:-}"
DATABASE_URL="${DATABASE_URL:-}"
AIPM_METADATA_BACKEND="${AIPM_METADATA_BACKEND:-}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-}"
AIPM_PUBLIC_SITE_URL="${AIPM_PUBLIC_SITE_URL:-https://aipm-registry.com}"
AIPM_API_URL="${AIPM_API_URL:-https://api.aipm-registry.com}"
AIPM_COOKIE_DOMAIN="${AIPM_COOKIE_DOMAIN:-.aipm-registry.com}"
AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING="${AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING:-}"
AIPM_EMAIL_SENDER_ADDRESS="${AIPM_EMAIL_SENDER_ADDRESS:-}"
AIPM_EMAIL_FROM_NAME="${AIPM_EMAIL_FROM_NAME:-AIPM Registry}"
EXPECTED_TENANT_ID="${EXPECTED_TENANT_ID:-}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="${REPO_ROOT}/deploy/registry-api"
ARCHIVE_PATH="${REPO_ROOT}/deploy/registry-api-vm.tgz"
ARCHIVE_BLOB="registry-api-vm-$(date -u +%Y%m%d%H%M%S).tgz"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required." >&2
  exit 1
fi

TENANT_ID="$(az account show --query tenantId --output tsv)"
if [[ -n "${EXPECTED_TENANT_ID}" && "${TENANT_ID}" != "${EXPECTED_TENANT_ID}" ]]; then
  echo "Refusing to deploy in tenant ${TENANT_ID}; expected ${EXPECTED_TENANT_ID}." >&2
  exit 3
fi

if [[ -z "${STORAGE_ACCOUNT}" ]]; then
  STORAGE_ACCOUNT="$(az storage account list \
    --resource-group "${RESOURCE_GROUP}" \
    --query "[0].name" \
    --output tsv)"
fi

if [[ -z "${STORAGE_ACCOUNT}" ]]; then
  echo "Set STORAGE_ACCOUNT or create a storage account in ${RESOURCE_GROUP}." >&2
  exit 2
fi

if date -u -v+2H "+%Y-%m-%dT%H:%MZ" >/dev/null 2>&1; then
  SAS_EXPIRY="$(date -u -v+2H "+%Y-%m-%dT%H:%MZ")"
else
  SAS_EXPIRY="$(date -u -d "+2 hours" "+%Y-%m-%dT%H:%MZ")"
fi

cd "${REPO_ROOT}"
pnpm build
rm -rf "${DEPLOY_DIR}" "${ARCHIVE_PATH}"
pnpm --filter @aipm-registry/registry-api deploy --prod "${DEPLOY_DIR}"
COPYFILE_DISABLE=1 tar -czf "${ARCHIVE_PATH}" -C "${DEPLOY_DIR}" .

STORAGE_CONNECTION_STRING="$(az storage account show-connection-string \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT}" \
  --query connectionString \
  --output tsv)"

az storage container create \
  --name "${DEPLOY_CONTAINER}" \
  --connection-string "${STORAGE_CONNECTION_STRING}" \
  --public-access off \
  --output none

az storage blob upload \
  --container-name "${DEPLOY_CONTAINER}" \
  --name "${ARCHIVE_BLOB}" \
  --file "${ARCHIVE_PATH}" \
  --connection-string "${STORAGE_CONNECTION_STRING}" \
  --overwrite \
  --output none

az storage blob upload \
  --container-name "${DEPLOY_CONTAINER}" \
  --name registry-api-vm-latest.tgz \
  --file "${ARCHIVE_PATH}" \
  --connection-string "${STORAGE_CONNECTION_STRING}" \
  --overwrite \
  --output none

SAS="$(az storage blob generate-sas \
  --container-name "${DEPLOY_CONTAINER}" \
  --name "${ARCHIVE_BLOB}" \
  --permissions r \
  --expiry "${SAS_EXPIRY}" \
  --connection-string "${STORAGE_CONNECTION_STRING}" \
  --https-only \
  --output tsv)"

ARTIFACT_URL="https://${STORAGE_ACCOUNT}.blob.core.windows.net/${DEPLOY_CONTAINER}/${ARCHIVE_BLOB}?${SAS}"
ARTIFACT_B64="$(printf "%s" "${ARTIFACT_URL}" | base64 | tr -d "\n")"
STORAGE_B64="$(printf "%s" "${STORAGE_CONNECTION_STRING}" | base64 | tr -d "\n")"
PUBLISH_TOKEN_B64="$(printf "%s" "${AIPM_PUBLISH_TOKEN}" | base64 | tr -d "\n")"
PUBLISH_TOKEN_SHA_B64="$(printf "%s" "${AIPM_PUBLISH_TOKEN_SHA256}" | base64 | tr -d "\n")"
DATABASE_URL_B64="$(printf "%s" "${DATABASE_URL}" | base64 | tr -d "\n")"
METADATA_BACKEND_B64="$(printf "%s" "${AIPM_METADATA_BACKEND}" | base64 | tr -d "\n")"
KEY_VAULT_NAME_B64="$(printf "%s" "${KEY_VAULT_NAME}" | base64 | tr -d "\n")"
PUBLIC_SITE_URL_B64="$(printf "%s" "${AIPM_PUBLIC_SITE_URL}" | base64 | tr -d "\n")"
API_URL_B64="$(printf "%s" "${AIPM_API_URL}" | base64 | tr -d "\n")"
COOKIE_DOMAIN_B64="$(printf "%s" "${AIPM_COOKIE_DOMAIN}" | base64 | tr -d "\n")"
EMAIL_CONNECTION_STRING_B64="$(printf "%s" "${AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING}" | base64 | tr -d "\n")"
EMAIL_SENDER_ADDRESS_B64="$(printf "%s" "${AIPM_EMAIL_SENDER_ADDRESS}" | base64 | tr -d "\n")"
EMAIL_FROM_NAME_B64="$(printf "%s" "${AIPM_EMAIL_FROM_NAME}" | base64 | tr -d "\n")"

RUN_COMMAND_SCRIPT="${REPO_ROOT}/deploy/registry-run-command.sh"
umask 077
trap 'rm -f "${RUN_COMMAND_SCRIPT}"' EXIT
cat > "${RUN_COMMAND_SCRIPT}" <<SCRIPT
set -eu
ARTIFACT_URL="\$(printf '%s' '${ARTIFACT_B64}' | base64 -d)"
STORAGE_CONNECTION_STRING="\$(printf '%s' '${STORAGE_B64}' | base64 -d)"
PUBLISH_TOKEN="\$(printf '%s' '${PUBLISH_TOKEN_B64}' | base64 -d)"
PUBLISH_TOKEN_SHA256="\$(printf '%s' '${PUBLISH_TOKEN_SHA_B64}' | base64 -d)"
DATABASE_URL_INPUT="\$(printf '%s' '${DATABASE_URL_B64}' | base64 -d)"
METADATA_BACKEND_INPUT="\$(printf '%s' '${METADATA_BACKEND_B64}' | base64 -d)"
KEY_VAULT_NAME="\$(printf '%s' '${KEY_VAULT_NAME_B64}' | base64 -d)"
PUBLIC_SITE_URL="\$(printf '%s' '${PUBLIC_SITE_URL_B64}' | base64 -d)"
API_URL="\$(printf '%s' '${API_URL_B64}' | base64 -d)"
COOKIE_DOMAIN="\$(printf '%s' '${COOKIE_DOMAIN_B64}' | base64 -d)"
EMAIL_CONNECTION_STRING="\$(printf '%s' '${EMAIL_CONNECTION_STRING_B64}' | base64 -d)"
EMAIL_SENDER_ADDRESS="\$(printf '%s' '${EMAIL_SENDER_ADDRESS_B64}' | base64 -d)"
EMAIL_FROM_NAME="\$(printf '%s' '${EMAIL_FROM_NAME_B64}' | base64 -d)"
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get install -y ca-certificates certbot curl nginx python3-certbot-nginx tar
NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=\$(node -p 'Number(process.versions.node.split(".")[0])')
fi
if [ "\$NODE_MAJOR" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
if ! id aipm >/dev/null 2>&1; then
  sudo useradd --system --home /opt/aipm --shell /usr/sbin/nologin aipm
fi
fetch_key_vault_secret() {
  secret_name="\$1"
  token="\$(curl -fsS -H Metadata:true 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fvault.azure.net' | node -e 'let data=""; process.stdin.on("data", c => data += c); process.stdin.on("end", () => process.stdout.write(JSON.parse(data).access_token));')"
  curl -fsS -H "Authorization: Bearer \$token" "https://\${KEY_VAULT_NAME}.vault.azure.net/secrets/\${secret_name}?api-version=7.4" | node -e 'let data=""; process.stdin.on("data", c => data += c); process.stdin.on("end", () => process.stdout.write(JSON.parse(data).value));'
}
if [ -n "\$KEY_VAULT_NAME" ]; then
  STORAGE_CONNECTION_STRING="\$(fetch_key_vault_secret aipm-storage-connection-string)"
  DATABASE_URL_INPUT="\$(fetch_key_vault_secret aipm-database-url)"
  PUBLISH_TOKEN_SHA256="\$(fetch_key_vault_secret aipm-publish-token-sha256)"
  METADATA_BACKEND_INPUT=postgres
fi
sudo mkdir -p /opt/aipm/registry /var/lib/aipm
curl -fsSL "\$ARTIFACT_URL" -o /tmp/aipm-registry.tgz
sudo rm -rf /opt/aipm/registry/*
sudo tar -xzf /tmp/aipm-registry.tgz -C /opt/aipm/registry
sudo chown -R aipm:aipm /opt/aipm /var/lib/aipm
EXISTING_TOKEN_SHA256=""
EXISTING_DATABASE_URL=""
EXISTING_METADATA_BACKEND=""
if [ -f /etc/aipm-registry.env ]; then
  EXISTING_TOKEN_SHA256="\$(sudo sed -n 's/^AIPM_PUBLISH_TOKEN_SHA256=//p' /etc/aipm-registry.env | tail -n 1)"
  EXISTING_DATABASE_URL="\$(sudo sed -n 's/^DATABASE_URL=//p' /etc/aipm-registry.env | tail -n 1)"
  EXISTING_METADATA_BACKEND="\$(sudo sed -n 's/^AIPM_METADATA_BACKEND=//p' /etc/aipm-registry.env | tail -n 1)"
fi
GENERATED_TOKEN=""
if [ -n "\$PUBLISH_TOKEN_SHA256" ]; then
  EFFECTIVE_TOKEN_SHA256="\$PUBLISH_TOKEN_SHA256"
elif [ -n "\$PUBLISH_TOKEN" ]; then
  EFFECTIVE_TOKEN_SHA256="\$(printf '%s' "\$PUBLISH_TOKEN" | sha256sum | awk '{print \$1}')"
elif [ -n "\$EXISTING_TOKEN_SHA256" ]; then
  EFFECTIVE_TOKEN_SHA256="\$EXISTING_TOKEN_SHA256"
else
  GENERATED_TOKEN="\$(openssl rand -base64 32 | tr -d '\n')"
  EFFECTIVE_TOKEN_SHA256="\$(printf '%s' "\$GENERATED_TOKEN" | sha256sum | awk '{print \$1}')"
fi
EFFECTIVE_DATABASE_URL="\${DATABASE_URL_INPUT:-\$EXISTING_DATABASE_URL}"
EFFECTIVE_METADATA_BACKEND="\${METADATA_BACKEND_INPUT:-\$EXISTING_METADATA_BACKEND}"
if [ -z "\$EFFECTIVE_METADATA_BACKEND" ]; then
  if [ -n "\$EFFECTIVE_DATABASE_URL" ]; then
    EFFECTIVE_METADATA_BACKEND=postgres
  else
    EFFECTIVE_METADATA_BACKEND=file
  fi
fi
if [ -n "\$KEY_VAULT_NAME" ]; then
  sudo tee /etc/aipm-registry.env >/dev/null <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=${REGISTRY_PORT}
AIPM_METADATA_BACKEND=\$EFFECTIVE_METADATA_BACKEND
AIPM_DATA_DIR=/var/lib/aipm
KEY_VAULT_NAME=\$KEY_VAULT_NAME
AIPM_PUBLIC_SITE_URL=\$PUBLIC_SITE_URL
AIPM_API_URL=\$API_URL
AIPM_COOKIE_DOMAIN=\$COOKIE_DOMAIN
AIPM_EMAIL_FROM_NAME=\$EMAIL_FROM_NAME
AZURE_STORAGE_CONTAINER=${PACKAGE_CONTAINER}
AIPM_REQUIRE_PUBLISH_TOKEN=true
EOF
else
  sudo tee /etc/aipm-registry.env >/dev/null <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=${REGISTRY_PORT}
AIPM_METADATA_BACKEND=\$EFFECTIVE_METADATA_BACKEND
AIPM_DATA_DIR=/var/lib/aipm
DATABASE_URL=\$EFFECTIVE_DATABASE_URL
KEY_VAULT_NAME=
AIPM_PUBLIC_SITE_URL=\$PUBLIC_SITE_URL
AIPM_API_URL=\$API_URL
AIPM_COOKIE_DOMAIN=\$COOKIE_DOMAIN
AIPM_EMAIL_FROM_NAME=\$EMAIL_FROM_NAME
AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING=\$EMAIL_CONNECTION_STRING
AIPM_EMAIL_SENDER_ADDRESS=\$EMAIL_SENDER_ADDRESS
AZURE_STORAGE_CONNECTION_STRING=\$STORAGE_CONNECTION_STRING
AZURE_STORAGE_CONTAINER=${PACKAGE_CONTAINER}
AIPM_REQUIRE_PUBLISH_TOKEN=true
AIPM_PUBLISH_TOKEN_SHA256=\$EFFECTIVE_TOKEN_SHA256
EOF
fi
sudo chmod 600 /etc/aipm-registry.env
if [ "\$EFFECTIVE_METADATA_BACKEND" = "postgres" ]; then
  DATABASE_URL="\$EFFECTIVE_DATABASE_URL" AIPM_DATA_DIR=/var/lib/aipm node /opt/aipm/registry/dist/migrate-file-to-postgres.js
fi
sudo npm install -g pm2@latest
sudo tee /usr/local/bin/aipm-refresh-secrets >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

KEY_VAULT_NAME="\$(sed -n 's/^KEY_VAULT_NAME=//p' /etc/aipm-registry.env | tail -n 1)"
if [ -z "\$KEY_VAULT_NAME" ]; then
  rm -f /run/aipm-registry-secrets.env
  exit 0
fi

fetch_secret() {
  local secret_name="\$1"
  local token
  token="\$(curl -fsS -H Metadata:true 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fvault.azure.net' | node -e 'let data=""; process.stdin.on("data", c => data += c); process.stdin.on("end", () => process.stdout.write(JSON.parse(data).access_token));')"
  curl -fsS -H "Authorization: Bearer \$token" "https://\${KEY_VAULT_NAME}.vault.azure.net/secrets/\${secret_name}?api-version=7.4" | node -e 'let data=""; process.stdin.on("data", c => data += c); process.stdin.on("end", () => process.stdout.write(JSON.parse(data).value));'
}

fetch_secret_optional() {
  local secret_name="\$1"
  fetch_secret "\$secret_name" 2>/dev/null || true
}

umask 077
tmp="\$(mktemp /run/aipm-registry-secrets.env.XXXXXX)"
{
  printf 'DATABASE_URL=%s\n' "\$(fetch_secret aipm-database-url)"
  printf 'AZURE_STORAGE_CONNECTION_STRING=%s\n' "\$(fetch_secret aipm-storage-connection-string)"
  printf 'AIPM_PUBLISH_TOKEN_SHA256=%s\n' "\$(fetch_secret aipm-publish-token-sha256)"
  github_client_id="\$(fetch_secret_optional aipm-github-client-id)"
  github_client_secret="\$(fetch_secret_optional aipm-github-client-secret)"
  session_secret="\$(fetch_secret_optional aipm-session-secret)"
  admin_password_sha256="\$(fetch_secret_optional AIPM-ADMIN-PASSWORD-SHA256)"
  admin_allowed_usernames="\$(fetch_secret_optional AIPM-ADMIN-ALLOWED-USERNAMES)"
  email_connection_string="\$(fetch_secret_optional aipm-email-connection-string)"
  email_sender_address="\$(fetch_secret_optional aipm-email-sender-address)"
  email_from_name="\$(fetch_secret_optional aipm-email-from-name)"
  if [ -n "\$github_client_id" ]; then printf 'GITHUB_CLIENT_ID=%s\n' "\$github_client_id"; fi
  if [ -n "\$github_client_secret" ]; then printf 'GITHUB_CLIENT_SECRET=%s\n' "\$github_client_secret"; fi
  if [ -n "\$session_secret" ]; then printf 'AIPM_SESSION_SECRET=%s\n' "\$session_secret"; fi
  if [ -n "\$admin_password_sha256" ]; then printf 'AIPM_ADMIN_PASSWORD_SHA256=%s\n' "\$admin_password_sha256"; fi
  if [ -n "\$admin_allowed_usernames" ]; then printf 'AIPM_ADMIN_ALLOWED_USERNAMES=%s\n' "\$admin_allowed_usernames"; fi
  if [ -n "\$email_connection_string" ]; then printf 'AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING=%s\n' "\$email_connection_string"; fi
  if [ -n "\$email_sender_address" ]; then printf 'AIPM_EMAIL_SENDER_ADDRESS=%s\n' "\$email_sender_address"; fi
  if [ -n "\$email_from_name" ]; then printf 'AIPM_EMAIL_FROM_NAME=%s\n' "\$email_from_name"; fi
  printf 'AIPM_METADATA_BACKEND=postgres\n'
} > "\$tmp"
mv "\$tmp" /run/aipm-registry-secrets.env
chown root:aipm /run/aipm-registry-secrets.env
chmod 640 /run/aipm-registry-secrets.env
EOF
sudo chmod 750 /usr/local/bin/aipm-refresh-secrets
sudo tee /usr/local/bin/aipm-registry-start.mjs >/dev/null <<'EOF'
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

for (const file of ['/etc/aipm-registry.env', '/run/aipm-registry-secrets.env']) {
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index <= 0) continue;
    process.env[line.slice(0, index)] = line.slice(index + 1);
  }
}

process.chdir('/opt/aipm/registry');
const child = spawn('/usr/bin/node', ['/opt/aipm/registry/dist/index.js'], {
  cwd: '/opt/aipm/registry',
  env: process.env,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
EOF
sudo chmod 755 /usr/local/bin/aipm-registry-start.mjs
sudo mkdir -p /var/log/aipm-registry
sudo chown -R aipm:aipm /var/log/aipm-registry
sudo tee /opt/aipm/aipm-registry.ecosystem.config.cjs >/dev/null <<'EOF'
module.exports = {
  apps: [
    {
      name: "aipm-registry",
      cwd: "/opt/aipm/registry",
      script: "/usr/local/bin/aipm-registry-start.mjs",
      interpreter: "/usr/bin/node",
      exec_mode: "fork",
      instances: 1,
      time: true,
      max_memory_restart: "512M",
      out_file: "/var/log/aipm-registry/out.log",
      error_file: "/var/log/aipm-registry/error.log",
      uid: "aipm",
      gid: "aipm",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
EOF
sudo chown aipm:aipm /opt/aipm/aipm-registry.ecosystem.config.cjs
sudo tee /etc/systemd/system/aipm-registry-secrets.service >/dev/null <<'EOF'
[Unit]
Description=Refresh AIPM registry runtime secrets
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/aipm-refresh-secrets

[Install]
WantedBy=multi-user.target
EOF
sudo tee /usr/local/bin/aipm-backup-metadata >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if [ ! -f /var/lib/aipm/package-index.json ]; then
  exit 0
fi
cd /opt/aipm/registry
node --input-type=module <<'NODE'
import { readFile } from 'node:fs/promises';
import { BlobServiceClient } from '@azure/storage-blob';

const env = {};
for (const file of ['/etc/aipm-registry.env', '/run/aipm-registry-secrets.env']) {
  let envText = '';
  try {
    envText = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  Object.assign(env, Object.fromEntries(
    envText
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
  ));
}
const connectionString = env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = env.AZURE_STORAGE_CONTAINER ?? 'packages';
if (!connectionString) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
const service = BlobServiceClient.fromConnectionString(connectionString);
const container = service.getContainerClient(containerName);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const blob = container.getBlockBlobClient('metadata-backups/package-index-' + stamp + '.json');
const data = await readFile('/var/lib/aipm/package-index.json');
await blob.uploadData(data, {
  blobHTTPHeaders: { blobContentType: 'application/json' },
});
NODE
EOF
sudo chmod 750 /usr/local/bin/aipm-backup-metadata
sudo tee /etc/systemd/system/aipm-metadata-backup.service >/dev/null <<'EOF'
[Unit]
Description=Back up AIPM file metadata to Azure Blob

[Service]
Type=oneshot
ExecStart=/usr/local/bin/aipm-backup-metadata
EOF
sudo tee /etc/systemd/system/aipm-metadata-backup.timer >/dev/null <<'EOF'
[Unit]
Description=Daily AIPM metadata backup

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF
sudo systemctl daemon-reload
sudo systemctl stop aipm-registry >/dev/null 2>&1 || true
sudo systemctl disable aipm-registry >/dev/null 2>&1 || true
sudo systemctl stop pm2-aipm >/dev/null 2>&1 || true
sudo systemctl disable pm2-aipm >/dev/null 2>&1 || true
sudo systemctl enable aipm-registry-secrets >/dev/null
sudo systemctl start aipm-registry-secrets
sudo env PATH="\$PATH:/usr/bin:/usr/local/bin" pm2 startup systemd -u root --hp /root >/dev/null
sudo mkdir -p /etc/systemd/system/pm2-root.service.d
sudo tee /etc/systemd/system/pm2-root.service.d/override.conf >/dev/null <<'EOF'
[Unit]
After=network-online.target aipm-registry-secrets.service
Wants=network-online.target aipm-registry-secrets.service
EOF
sudo systemctl daemon-reload
sudo pm2 delete aipm-registry >/dev/null 2>&1 || true
sudo pm2 start /opt/aipm/aipm-registry.ecosystem.config.cjs --update-env
sudo pm2 save
sudo systemctl enable --now pm2-root >/dev/null
sudo systemctl enable --now aipm-metadata-backup.timer >/dev/null
sudo tee /etc/nginx/sites-available/aipm-registry >/dev/null <<'NGINX'
server {
    listen ${WEB_PORT} default_server;
    listen [::]:${WEB_PORT} default_server;
    server_name ${CUSTOM_DOMAIN} www.${CUSTOM_DOMAIN} _;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen ${TLS_PORT} ssl default_server;
    listen [::]:${TLS_PORT} ssl default_server;
    server_name ${CUSTOM_DOMAIN} www.${CUSTOM_DOMAIN} _;

    ssl_certificate /etc/letsencrypt/live/${CUSTOM_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CUSTOM_DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

    location / {
        proxy_pass http://127.0.0.1:${REGISTRY_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn /etc/nginx/sites-available/aipm-registry /etc/nginx/sites-enabled/aipm-registry
if [ ! -f /etc/letsencrypt/live/${CUSTOM_DOMAIN}/fullchain.pem ]; then
  sudo tee /etc/nginx/sites-available/aipm-registry >/dev/null <<'NGINX_BOOTSTRAP'
server {
    listen ${WEB_PORT} default_server;
    listen [::]:${WEB_PORT} default_server;
    server_name ${CUSTOM_DOMAIN} www.${CUSTOM_DOMAIN} _;

    location / {
        proxy_pass http://127.0.0.1:${REGISTRY_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_BOOTSTRAP
  sudo nginx -t
  sudo systemctl enable nginx >/dev/null
  sudo systemctl reload nginx
  CERTBOT_EMAIL_ARGS="--register-unsafely-without-email"
  if [ -n "${LETSENCRYPT_EMAIL}" ]; then
    CERTBOT_EMAIL_ARGS="--email ${LETSENCRYPT_EMAIL}"
  fi
  sudo certbot --nginx -d ${CUSTOM_DOMAIN} -d www.${CUSTOM_DOMAIN} --non-interactive --agree-tos \$CERTBOT_EMAIL_ARGS --redirect
  sudo tee /etc/nginx/sites-available/aipm-registry >/dev/null <<'NGINX'
server {
    listen ${WEB_PORT} default_server;
    listen [::]:${WEB_PORT} default_server;
    server_name ${CUSTOM_DOMAIN} www.${CUSTOM_DOMAIN} _;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen ${TLS_PORT} ssl default_server;
    listen [::]:${TLS_PORT} ssl default_server;
    server_name ${CUSTOM_DOMAIN} www.${CUSTOM_DOMAIN} _;

    ssl_certificate /etc/letsencrypt/live/${CUSTOM_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CUSTOM_DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

    location / {
        proxy_pass http://127.0.0.1:${REGISTRY_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
fi
sudo nginx -t
sudo systemctl enable nginx >/dev/null
sudo systemctl reload nginx
sudo certbot renew --dry-run || echo 'Certbot renewal dry run failed; certificate install remains valid. Retry later.'
sleep 3
curl -fsS http://127.0.0.1:${REGISTRY_PORT}/health
curl -fsS http://127.0.0.1:${REGISTRY_PORT}/ready
curl -fsS https://${CUSTOM_DOMAIN}/health
curl -fsS https://${CUSTOM_DOMAIN}/ready
if [ -n "\$GENERATED_TOKEN" ]; then
  echo "Generated AIPM publish token: \$GENERATED_TOKEN"
fi
SCRIPT

az vm run-command invoke \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VM_NAME}" \
  --command-id RunShellScript \
  --scripts @"${RUN_COMMAND_SCRIPT}" \
  --query "value[].message" \
  --output tsv

az network nsg rule create \
  --resource-group "${RESOURCE_GROUP}" \
  --nsg-name "${NSG_NAME}" \
  --name "Allow-AIPM-Registry-${REGISTRY_PORT}" \
  --priority 1010 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes Internet \
  --source-port-ranges "*" \
  --destination-address-prefixes "*" \
  --destination-port-ranges "${REGISTRY_PORT}" \
  --output none

az network nsg rule create \
  --resource-group "${RESOURCE_GROUP}" \
  --nsg-name "${NSG_NAME}" \
  --name "Allow-AIPM-Web-${WEB_PORT}" \
  --priority 1000 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes Internet \
  --source-port-ranges "*" \
  --destination-address-prefixes "*" \
  --destination-port-ranges "${WEB_PORT}" \
  --output none

az network nsg rule create \
  --resource-group "${RESOURCE_GROUP}" \
  --nsg-name "${NSG_NAME}" \
  --name "Allow-AIPM-TLS-${TLS_PORT}" \
  --priority 1001 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes Internet \
  --source-port-ranges "*" \
  --destination-address-prefixes "*" \
  --destination-port-ranges "${TLS_PORT}" \
  --output none

PUBLIC_IP="$(az vm show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VM_NAME}" \
  --show-details \
  --query publicIps \
  --output tsv)"

echo "Registry URL: https://${CUSTOM_DOMAIN}"
echo "DNS A record required: ${CUSTOM_DOMAIN} -> ${PUBLIC_IP}"
curl -fsS "https://${CUSTOM_DOMAIN}/health"
curl -fsS "https://${CUSTOM_DOMAIN}/ready"

az network nsg rule delete \
  --resource-group "${RESOURCE_GROUP}" \
  --nsg-name "${NSG_NAME}" \
  --name "Allow-AIPM-Registry-${REGISTRY_PORT}" \
  --output none 2>/dev/null || true
