#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-aipm-staging}"
VM_NAME="${VM_NAME:-aipm-registry-vm}"
NSG_NAME="${NSG_NAME:-aipm-registry-vm-nsg}"
API_DOMAIN="${API_DOMAIN:-api.aipm-registry.com}"
REGISTRY_PORT="${REGISTRY_PORT:-8080}"
WEB_PORT="${WEB_PORT:-80}"
TLS_PORT="${TLS_PORT:-443}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
EXPECTED_TENANT_ID="${EXPECTED_TENANT_ID:-}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required." >&2
  exit 1
fi

TENANT_ID="$(az account show --query tenantId --output tsv)"
if [[ -n "${EXPECTED_TENANT_ID}" && "${TENANT_ID}" != "${EXPECTED_TENANT_ID}" ]]; then
  echo "Refusing to configure ${API_DOMAIN} in tenant ${TENANT_ID}; expected ${EXPECTED_TENANT_ID}." >&2
  exit 3
fi

PUBLIC_IP="$(az vm show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VM_NAME}" \
  --show-details \
  --query publicIps \
  --output tsv)"

if [[ -z "${PUBLIC_IP}" ]]; then
  echo "Could not determine public IP for ${VM_NAME}." >&2
  exit 2
fi

echo "Before running this script, create this DNS record:"
echo "A     ${API_DOMAIN}     ${PUBLIC_IP}"
echo

RUN_COMMAND_SCRIPT="${REPO_ROOT}/deploy/configure-api-domain-run-command.sh"
umask 077
trap 'rm -f "${RUN_COMMAND_SCRIPT}"' EXIT

cat > "${RUN_COMMAND_SCRIPT}" <<SCRIPT
set -eu
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get install -y ca-certificates certbot curl nginx python3-certbot-nginx

sudo tee /etc/nginx/sites-available/aipm-registry-api >/dev/null <<'NGINX_BOOTSTRAP'
server {
    listen ${WEB_PORT};
    listen [::]:${WEB_PORT};
    server_name ${API_DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

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

sudo ln -sfn /etc/nginx/sites-available/aipm-registry-api /etc/nginx/sites-enabled/aipm-registry-api
sudo nginx -t
sudo systemctl enable nginx >/dev/null
sudo systemctl reload nginx

if [ ! -f /etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem ]; then
  CERTBOT_EMAIL_ARGS="--register-unsafely-without-email"
  if [ -n "${LETSENCRYPT_EMAIL}" ]; then
    CERTBOT_EMAIL_ARGS="--email ${LETSENCRYPT_EMAIL}"
  fi
  sudo certbot --nginx -d ${API_DOMAIN} --cert-name ${API_DOMAIN} --non-interactive --agree-tos \$CERTBOT_EMAIL_ARGS --redirect
fi

sudo tee /etc/nginx/sites-available/aipm-registry-api >/dev/null <<'NGINX'
server {
    listen ${WEB_PORT};
    listen [::]:${WEB_PORT};
    server_name ${API_DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen ${TLS_PORT} ssl;
    listen [::]:${TLS_PORT} ssl;
    server_name ${API_DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${API_DOMAIN}/privkey.pem;
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

sudo nginx -t
sudo systemctl reload nginx
curl -fsS http://127.0.0.1:${REGISTRY_PORT}/health
curl -fsS http://127.0.0.1:${REGISTRY_PORT}/ready
curl -fsS https://${API_DOMAIN}/health
curl -fsS https://${API_DOMAIN}/ready
SCRIPT

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

az vm run-command invoke \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VM_NAME}" \
  --command-id RunShellScript \
  --scripts @"${RUN_COMMAND_SCRIPT}" \
  --query "value[].message" \
  --output tsv

echo "API URL: https://${API_DOMAIN}"
echo "DNS A record: ${API_DOMAIN} -> ${PUBLIC_IP}"
