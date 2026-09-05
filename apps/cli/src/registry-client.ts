import type { PackageManifest } from "@aipm-registry/schemas";

export function encodePackageName(name: string): string {
  return encodeURIComponent(name);
}

function registryFetchError(registry: string, cause: unknown): Error {
  const msg = cause instanceof Error ? cause.message : String(cause);
  if (
    msg === "fetch failed" ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("timed out") ||
    msg.includes("aborted")
  ) {
    return new Error(
      `Cannot reach registry at ${registry}. Check your connection or pass --registry <url>.`,
    );
  }
  return new Error(`Registry request failed (${registry}): ${msg}`);
}

function registryAuthHeaders(token?: string): Record<string, string> | undefined {
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
}

async function registryFetch(url: string, registry: string, init?: RequestInit): Promise<Response> {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(10000)
      : undefined;
  try {
    return await fetch(url, { ...init, signal: init?.signal ?? timeoutSignal });
  } catch (e) {
    throw registryFetchError(registry, e);
  }
}

function privateInstallHint(name: string, status: number, token?: string): string {
  if (status !== 404 || !name.startsWith("@") || token) {
    return `Package not found: ${name} (${status})`;
  }
  return `Package not found: ${name} (${status}). If @org/pkg is private, run aipm login, or set AIPM_TOKEN for CI.`;
}

function publishTokenHint(name: string, error: string): string {
  if (error === "Publish token required") {
    return [
      `Publish token required for ${name}.`,
      `Generate a fresh 5-minute publish token for ${name} from the package dashboard, then retry with AIPM_TOKEN=<token> aipm publish push --yes.`,
    ].join(" ");
  }

  if (error === "Invalid publish token") {
    return [
      `Publish token was rejected for ${name}.`,
      `Generate a fresh 5-minute token for this exact package name, make sure aipm.manifest.json still says "${name}", and confirm your account can publish to that reserved package.`,
      "If you recently renamed the package or generated the token from another package page, create a new token from the matching package dashboard.",
    ].join(" ");
  }

  return error;
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
  token?: string,
): Promise<{ version: string; integrity: string }> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/packages/${encodePackageName(name)}/versions`;
  const form = new FormData();
  form.append("tarball", new Blob([tarball]), "package.tgz");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const res = await registryFetch(url, base, { method: "POST", body: form, headers });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ? publishTokenHint(name, err.error) : `Publish failed: ${res.status}`);
  }
  return res.json() as Promise<{ version: string; integrity: string }>;
}

export type PackageSummary = {
  name: string;
  version: string;
  description: string;
  targets: string[];
  license?: string | null;
  sizeBytes?: number;
  createdAt?: string;
  publisher?: {
    org: {
      slug: string;
      name: string;
    };
    user: {
      githubLogin: string;
      name: string | null;
      avatarUrl: string | null;
    };
  } | null;
};

export async function searchPackages(
  registry: string,
  query: string,
  limit = 20,
  token?: string,
): Promise<PackageSummary[]> {
  const base = registry.replace(/\/$/, "");
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("limit", String(limit));
  if (token) params.set("includePrivate", "true");
  const res = await registryFetch(`${base}/v1/packages?${params}`, base, {
    headers: registryAuthHeaders(token),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = (await res.json()) as { packages?: PackageSummary[] };
  return data.packages ?? [];
}

export type CliAuthUser = {
  userId?: string;
  username?: string | null;
  githubLogin?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

export type CliTokenResponse = {
  tokenType: "Bearer";
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
  userId?: string;
  user?: CliAuthUser | null;
};

export async function exchangeCliAuthCode(
  registry: string,
  input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    deviceName?: string;
  },
): Promise<CliTokenResponse> {
  const base = registry.replace(/\/$/, "");
  const res = await registryFetch(`${base}/v1/cli-auth/token`, base, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `CLI login failed: ${res.status}`);
  }
  return res.json() as Promise<CliTokenResponse>;
}

export async function refreshCliAuth(
  registry: string,
  refreshToken: string,
): Promise<CliTokenResponse> {
  const base = registry.replace(/\/$/, "");
  const res = await registryFetch(`${base}/v1/cli-auth/refresh`, base, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `CLI session refresh failed: ${res.status}`);
  }
  return res.json() as Promise<CliTokenResponse>;
}

export async function fetchCliAuthMe(
  registry: string,
  accessToken: string,
): Promise<{ user: CliAuthUser | null; orgs: Array<{ slug: string; name: string; role: string }> }> {
  const base = registry.replace(/\/$/, "");
  const res = await registryFetch(`${base}/v1/cli-auth/me`, base, {
    headers: registryAuthHeaders(accessToken),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `CLI auth check failed: ${res.status}`);
  }
  return res.json() as Promise<{ user: CliAuthUser | null; orgs: Array<{ slug: string; name: string; role: string }> }>;
}

export async function logoutCliAuth(registry: string, refreshToken: string): Promise<void> {
  const base = registry.replace(/\/$/, "");
  await registryFetch(`${base}/v1/cli-auth/logout`, base, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function fetchPackageMetadata(
  registry: string,
  name: string,
  version: string,
  token?: string,
): Promise<{
  manifest: PackageManifest;
  integrity: string;
  deprecated?: { at: string; message: string | null } | null;
}> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/packages/${encodePackageName(name)}/versions/${version}`;
  const res = await registryFetch(url, base, { headers: registryAuthHeaders(token) });
  if (!res.ok) throw new Error(privateInstallHint(`${name}@${version}`, res.status, token));
  const data = (await res.json()) as {
    manifest: PackageManifest;
    integrity: string;
    deprecated?: { at: string; message: string | null } | null;
  };
  return { manifest: data.manifest, integrity: data.integrity, deprecated: data.deprecated ?? null };
}

export async function fetchPackageTarball(
  registry: string,
  name: string,
  version: string,
  token?: string,
): Promise<Buffer> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/packages/${encodePackageName(name)}/versions/${version}/tarball`;
  const res = await registryFetch(url, base, { headers: registryAuthHeaders(token) });
  if (!res.ok) throw new Error(privateInstallHint(`${name}@${version}`, res.status, token));
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function recordPackageInstall(
  registry: string,
  name: string,
  token?: string,
): Promise<{ installCount: number }> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/packages/${encodePackageName(name)}/installs`;
  const res = await registryFetch(url, base, {
    method: "POST",
    headers: registryAuthHeaders(token),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Install recording failed: ${res.status}`);
  }
  return res.json() as Promise<{ installCount: number }>;
}

export type RegistryPromptVariable = {
  name: string;
  description: string;
  example: string;
  required: boolean;
};

export type RegistryPromptDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  inputTypes: string[];
  outputTypes: string[];
  effort: string;
  language: string;
  promptText: string;
  variables: RegistryPromptVariable[];
  exampleInput: string | null;
  exampleOutput: string | null;
  usageNotes: string | null;
  license: string;
  sourceUrl: string | null;
  updatedAt: string;
  path: string;
  publisher: {
    scope: string;
    kind: "individual" | "organization";
    org: { slug: string; name: string } | null;
    user: { username: string; name: string | null };
  };
};

export async function fetchPromptDetail(
  registry: string,
  publisher: string,
  slug: string,
): Promise<RegistryPromptDetail> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`;
  const res = await registryFetch(url, base);
  if (!res.ok) throw new Error(`Prompt not found: @${publisher}/${slug} (${res.status})`);
  return res.json() as Promise<RegistryPromptDetail>;
}

export async function recordPromptCopy(
  registry: string,
  publisher: string,
  slug: string,
): Promise<void> {
  const base = registry.replace(/\/$/, "");
  const url = `${base}/v1/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}/copy`;
  const res = await registryFetch(url, base, { method: "POST" });
  if (!res.ok) throw new Error(`Prompt copy recording failed: ${res.status}`);
}

export type PromptPublishInput = {
  slug: string;
  title: string;
  summary: string;
  promptText: string;
  category: string;
  tags: string[];
  inputTypes: string[];
  outputTypes: string[];
  testedModels?: string[];
  effort: "quick" | "guided" | "advanced";
  variables?: RegistryPromptVariable[];
  exampleInput?: string;
  exampleOutput?: string;
  usageNotes?: string;
  language: string;
  license: string;
  sourceUrl?: string;
  sampleImageAlt?: string;
  orgSlug?: string;
};

export async function publishPrompt(
  registry: string,
  input: PromptPublishInput,
  accessToken: string,
  sampleImage?: { data: Buffer; filename: string; contentType: string },
): Promise<RegistryPromptDetail> {
  const base = registry.replace(/\/$/, "");
  const form = new FormData();
  form.append("data", JSON.stringify(input));
  if (sampleImage) {
    form.append(
      "sampleImage",
      new Blob([sampleImage.data], { type: sampleImage.contentType }),
      sampleImage.filename,
    );
  }
  const res = await registryFetch(`${base}/v1/prompts`, base, {
    method: "POST",
    headers: registryAuthHeaders(accessToken),
    body: form,
  });
  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `Prompt publish failed: ${res.status}`);
  }
  return res.json() as Promise<RegistryPromptDetail>;
}
