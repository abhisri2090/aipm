import type { PackageManifest } from "@aipm/schemas";

export function encodePackageName(name: string): string {
  return encodeURIComponent(name);
}

function registryFetchError(registry: string, cause: unknown): Error {
  const msg = cause instanceof Error ? cause.message : String(cause);
  if (msg === "fetch failed" || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
    return new Error(
      `Cannot reach registry at ${registry}. In the aipm repo run: pnpm registry (leave that terminal open)`,
    );
  }
  return new Error(`Registry request failed (${registry}): ${msg}`);
}

async function registryFetch(url: string, registry: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    throw registryFetchError(registry, e);
  }
}

/** Fail fast before install/publish if the registry API is not listening. */
export async function assertRegistryReachable(registry: string): Promise<void> {
  const base = registry.replace(/\/$/, "");
  const res = await registryFetch(`${base}/health`, base);
  if (!res.ok) {
    throw new Error(`Registry at ${base} returned ${res.status} on /health`);
  }
}

export async function publishPackage(
  registry: string,
  name: string,
  tarball: Buffer,
): Promise<{ version: string; integrity: string }> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/packages/${encodePackageName(name)}/versions`;
  const form = new FormData();
  form.append("tarball", new Blob([tarball]), "package.tgz");

  const res = await registryFetch(url, base, { method: "POST", body: form });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Publish failed: ${res.status}`);
  }
  return res.json() as Promise<{ version: string; integrity: string }>;
}

export async function fetchPackageMetadata(
  registry: string,
  name: string,
  version: string,
): Promise<{ manifest: PackageManifest; integrity: string }> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/packages/${encodePackageName(name)}/versions/${version}`;
  const res = await registryFetch(url, base);
  if (!res.ok) throw new Error(`Package not found: ${name}@${version} (${res.status})`);
  const data = (await res.json()) as {
    manifest: PackageManifest;
    integrity: string;
  };
  return { manifest: data.manifest, integrity: data.integrity };
}

export async function fetchPackageTarball(
  registry: string,
  name: string,
  version: string,
): Promise<Buffer> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/packages/${encodePackageName(name)}/versions/${version}/tarball`;
  const res = await registryFetch(url, base);
  if (!res.ok) throw new Error(`Tarball not found: ${name}@${version} (${res.status})`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
