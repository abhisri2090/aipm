const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export class LocalSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalSafetyError";
  }
}

function isProduction(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV === "production";
}

function parseDatabaseHost(databaseUrl: string): string | null {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      return null;
    }
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLocalDatabaseUrl(databaseUrl: string): boolean {
  const host = parseDatabaseHost(databaseUrl);
  if (!host) return false;
  return LOCAL_DB_HOSTS.has(host);
}

function isAllowedLocalAzureConnection(connectionString: string): boolean {
  return connectionString.includes("UseDevelopmentStorage=true");
}

export function assertSafeLocalRuntime(env: NodeJS.ProcessEnv = process.env): void {
  if (isProduction(env)) return;

  if (env.KEY_VAULT_NAME?.trim()) {
    throw new LocalSafetyError(
      "KEY_VAULT_NAME is not allowed in local development. Use docs/LOCAL_DEV.md for the isolated contributor setup.",
    );
  }

  const databaseUrl = env.DATABASE_URL?.trim();
  if (databaseUrl && !isLocalDatabaseUrl(databaseUrl)) {
    throw new LocalSafetyError(
      "Remote DATABASE_URL is not allowed in local development. Use Docker Postgres at postgresql://aipm:aipm@localhost:5432/aipm.",
    );
  }

  const storageConnection = env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  if (storageConnection && !isAllowedLocalAzureConnection(storageConnection)) {
    throw new LocalSafetyError(
      "AZURE_STORAGE_CONNECTION_STRING is not allowed in local development. Use filesystem storage via AIPM_DATA_DIR=./data.",
    );
  }
}

export { isLocalDatabaseUrl, parseDatabaseHost };
