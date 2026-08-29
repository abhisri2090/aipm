#!/usr/bin/env node
import { fileURLToPath } from "node:url";
const DEFAULT_PUBLIC_REGISTRY = "https://api.aipm-registry.com";
const DEFAULT_LOCAL_REGISTRY = "http://127.0.0.1:8080";
const DEFAULT_LIMIT = 20;

export function resolveSeedConfig(env = process.env) {
  return {
    publicRegistry: (env.PUBLIC_REGISTRY_URL ?? DEFAULT_PUBLIC_REGISTRY).replace(/\/$/, ""),
    localRegistry: (env.LOCAL_REGISTRY_URL ?? DEFAULT_LOCAL_REGISTRY).replace(/\/$/, ""),
    limit: Math.max(1, Number(env.LOCAL_SEED_LIMIT ?? DEFAULT_LIMIT) || DEFAULT_LIMIT),
  };
}

export async function fetchPublicPackages(publicRegistry, limit, fetchImpl = fetch) {
  const response = await fetchImpl(`${publicRegistry}/v1/packages?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to list public packages: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data.packages) ? data.packages : [];
}

export async function downloadTarball(publicRegistry, name, version, fetchImpl = fetch) {
  const response = await fetchImpl(
    `${publicRegistry}/v1/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}/tarball`,
  );
  if (!response.ok) {
    throw new Error(`Failed to download ${name}@${version}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export function buildPublishPayload(tarball) {
  const boundary = `aipm-seed-${Date.now()}`;
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="tarball"; filename="package.tgz"\r\nContent-Type: application/gzip\r\n\r\n`,
      ),
      tarball,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  };
}

export async function publishToLocalRegistry(localRegistry, name, tarball, fetchImpl = fetch) {
  const payload = buildPublishPayload(tarball);
  const response = await fetchImpl(
    `${localRegistry}/v1/packages/${encodeURIComponent(name)}/versions`,
    {
      method: "POST",
      headers: { "content-type": payload.contentType },
      body: payload.body,
    },
  );
  if (response.status === 409) {
    return { ok: true, skipped: true, status: response.status };
  }
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to publish ${name} locally: ${response.status} ${errorBody}`);
  }
  return { ok: true, skipped: false, status: response.status };
}

export async function seedFromPublicRegistry(config, deps = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const packages = await fetchPublicPackages(config.publicRegistry, config.limit, fetchImpl);
  const results = [];

  for (const pkg of packages) {
    const tarball = await downloadTarball(config.publicRegistry, pkg.name, pkg.version, fetchImpl);
    const published = await publishToLocalRegistry(config.localRegistry, pkg.name, tarball, fetchImpl);
    results.push({ name: pkg.name, version: pkg.version, ...published });
  }

  return results;
}

export async function main(env = process.env) {
  if (env.DATABASE_URL || env.AZURE_STORAGE_CONNECTION_STRING || env.KEY_VAULT_NAME) {
    throw new Error(
      "Seed script must not use DATABASE_URL, AZURE_STORAGE_CONNECTION_STRING, or KEY_VAULT_NAME.",
    );
  }

  const config = resolveSeedConfig(env);
  const results = await seedFromPublicRegistry(config);
  const imported = results.filter((row) => !row.skipped).length;
  const skipped = results.filter((row) => row.skipped).length;
  console.log(`Seeded ${imported} packages (${skipped} already existed) into ${config.localRegistry}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
