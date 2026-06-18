import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const AUTH_FILE = join(homedir(), ".aipm", "auth.json");

export type StoredAuthUser = {
  userId?: string;
  username?: string | null;
  githubLogin?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

export type StoredRegistryAuth = {
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
  user?: StoredAuthUser | null;
};

export type AuthStore = {
  registries: Record<string, StoredRegistryAuth>;
};

function normalizeRegistry(registry: string): string {
  return registry.replace(/\/$/, "");
}

async function readAuthStore(): Promise<AuthStore> {
  try {
    const raw = await readFile(AUTH_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AuthStore>;
    return { registries: parsed.registries ?? {} };
  } catch {
    return { registries: {} };
  }
}

async function writeAuthStore(store: AuthStore): Promise<void> {
  await mkdir(dirname(AUTH_FILE), { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(store, null, 2) + "\n", "utf8");
  await chmod(AUTH_FILE, 0o600).catch(() => undefined);
}

export async function getStoredRegistryAuth(registry: string): Promise<StoredRegistryAuth | null> {
  const store = await readAuthStore();
  return store.registries[normalizeRegistry(registry)] ?? null;
}

export async function setStoredRegistryAuth(
  registry: string,
  auth: StoredRegistryAuth,
): Promise<void> {
  const store = await readAuthStore();
  store.registries[normalizeRegistry(registry)] = auth;
  await writeAuthStore(store);
}

export async function clearStoredRegistryAuth(registry: string): Promise<StoredRegistryAuth | null> {
  const store = await readAuthStore();
  const key = normalizeRegistry(registry);
  const existing = store.registries[key] ?? null;
  delete store.registries[key];
  await writeAuthStore(store);
  return existing;
}

export function authFilePath(): string {
  return AUTH_FILE;
}

export function isAccessTokenFresh(auth: StoredRegistryAuth | null, skewMs = 60_000): boolean {
  if (!auth?.accessToken || !auth.accessTokenExpiresAt) return false;
  const expiresAt = Date.parse(auth.accessTokenExpiresAt);
  return Number.isFinite(expiresAt) && expiresAt - skewMs > Date.now();
}
