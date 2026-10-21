type CachedLookup = {
  expiresAt: number;
  status: number;
  body: string;
};

const CACHE_KEY = "__aipmPackageLookup";

function store(): Map<string, CachedLookup> {
  const host = globalThis as typeof globalThis & { [CACHE_KEY]?: Map<string, CachedLookup> };
  if (!host[CACHE_KEY]) host[CACHE_KEY] = new Map();
  return host[CACHE_KEY];
}

export function rememberPackageLookup(url: string, status: number, body: string, ttlMs = 120_000): void {
  store().set(url, { expiresAt: Date.now() + ttlMs, status, body });
}

export function readPackageLookup(url: string): { status: number; body: string } | null {
  const hit = store().get(url);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    store().delete(url);
    return null;
  }
  return { status: hit.status, body: hit.body };
}
