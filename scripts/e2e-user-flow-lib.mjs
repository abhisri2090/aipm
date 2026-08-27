import { readFile } from "node:fs/promises";

export function normalizeUrl(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

export async function loadDotEnv(filePath, env = process.env) {
  let text = "";
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (env[key] === undefined) env[key] = value;
  }
}

export function requiredEnv(env = process.env) {
  const missing = ["AIPM_TEST_EMAIL", "AIPM_TEST_AUTH_PIN", "AIPM_TEST_ORG"].filter(
    (key) => !String(env[key] ?? "").trim(),
  );
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(", ")}. Copy .env.e2e.example to .env.e2e.`);
  }
  const pin = String(env.AIPM_TEST_AUTH_PIN).trim();
  if (!/^\d{6}$/.test(pin)) throw new Error("AIPM_TEST_AUTH_PIN must be exactly 6 digits.");
  return {
    email: String(env.AIPM_TEST_EMAIL).trim(),
    pin,
    org: String(env.AIPM_TEST_ORG).trim().replace(/^@/, ""),
    webUrl: normalizeUrl(env.WEB_URL ?? "https://www.aipm-registry.com"),
    apiUrl: normalizeUrl(env.API_URL ?? "https://api.aipm-registry.com"),
    installShUrl: String(env.AIPM_CLI_RELEASE_INSTALL_SH ?? "").trim(),
  };
}

export function packageNameForRun(org, unixSeconds) {
  return `@${org}/e2e-${unixSeconds}`;
}

export function packageVersionForRun(unixSeconds) {
  return `0.0.${unixSeconds}`;
}

export function publicPackagePath(packageName, version) {
  const [scope, name] = packageName.replace(/^@/, "").split("/");
  return `/packages/${encodeURIComponent(scope ?? "")}/${encodeURIComponent(name ?? "")}/${encodeURIComponent(version)}`;
}

export function dashboardPackagePath(packageName) {
  return `/dashboard/packages/${packageName.replace(/^@/, "")}`;
}

export function defaultInstallShUrl(cliVersion) {
  return `https://github.com/abhisri2090/aipm/releases/download/cli-v${cliVersion}/install.sh`;
}

/** Prefer an explicit URL, then the package version URL, then the newest GitHub release that ships install.sh. */
export async function resolveInstallShUrl({ explicitUrl, cliVersion, fetchImpl = fetch } = {}) {
  if (explicitUrl) return explicitUrl;
  const versioned = defaultInstallShUrl(cliVersion);
  const versionedHead = await fetchImpl(versioned, { method: "HEAD", redirect: "follow" }).catch(() => null);
  if (versionedHead?.ok) return versioned;

  const releases = await fetchImpl("https://api.github.com/repos/abhisri2090/aipm/releases?per_page=20", {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!releases.ok) {
    throw new Error(`Could not list CLI releases (${releases.status}); set AIPM_CLI_RELEASE_INSTALL_SH.`);
  }
  const items = await releases.json();
  for (const release of items) {
    const asset = (release.assets ?? []).find((item) => item.name === "install.sh");
    if (asset?.browser_download_url) return asset.browser_download_url;
  }
  throw new Error("No GitHub release with install.sh found; set AIPM_CLI_RELEASE_INSTALL_SH.");
}

export function cookieHeader(cookies) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

export function redactSecrets(text, secrets) {
  return secrets.reduce((current, secret) => {
    if (!secret) return current;
    return current.split(secret).join("<redacted>");
  }, text);
}
