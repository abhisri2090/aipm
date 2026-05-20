import type { PackageManifest } from "@aipm/schemas";

export function encodePackageName(name: string): string {
  return encodeURIComponent(name);
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

  const res = await fetch(url, { method: "POST", body: form });
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
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Package not found: ${name}@${version}`);
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
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tarball not found: ${name}@${version}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
