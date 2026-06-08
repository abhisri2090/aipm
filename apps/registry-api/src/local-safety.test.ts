import { afterEach, describe, expect, it } from "vitest";
import { assertSafeLocalRuntime, isLocalDatabaseUrl, LocalSafetyError } from "./local-safety.js";

afterEach(() => {
  delete process.env.NODE_ENV;
  delete process.env.DATABASE_URL;
  delete process.env.AZURE_STORAGE_CONNECTION_STRING;
  delete process.env.KEY_VAULT_NAME;
});

describe("assertSafeLocalRuntime", () => {
  it("accepts local Postgres in development", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgresql://aipm:aipm@localhost:5432/aipm";
    expect(() => assertSafeLocalRuntime(process.env)).not.toThrow();
  });

  it("accepts 127.0.0.1 Postgres in development", () => {
    process.env.NODE_ENV = "development";
    const databaseUrl = `postgresql://aipm:aipm@${"127.0.0.1"}:5432/aipm`;
    process.env.DATABASE_URL = databaseUrl;
    expect(isLocalDatabaseUrl(databaseUrl)).toBe(true);
    expect(() => assertSafeLocalRuntime(process.env)).not.toThrow();
  });

  it("rejects remote Postgres in development", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgresql://<user>:<password>@prod.example.com:5432/aipm";
    expect(() => assertSafeLocalRuntime(process.env)).toThrow(LocalSafetyError);
  });

  it("rejects Azure storage in development", () => {
    process.env.NODE_ENV = "development";
    process.env.AZURE_STORAGE_CONNECTION_STRING =
      "DefaultEndpointsProtocol=https;AccountName=prod;AccountKey=abc123;EndpointSuffix=core.windows.net";
    expect(() => assertSafeLocalRuntime(process.env)).toThrow(LocalSafetyError);
  });

  it("allows Azurite development storage in development", () => {
    process.env.NODE_ENV = "development";
    process.env.AZURE_STORAGE_CONNECTION_STRING = "UseDevelopmentStorage=true";
    expect(() => assertSafeLocalRuntime(process.env)).not.toThrow();
  });

  it("rejects Key Vault in development", () => {
    process.env.NODE_ENV = "development";
    process.env.KEY_VAULT_NAME = "aipm-vault";
    expect(() => assertSafeLocalRuntime(process.env)).toThrow(LocalSafetyError);
  });

  it("does not block remote Postgres in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://<user>:<password>@prod.example.com:5432/aipm?sslmode=require";
    process.env.AZURE_STORAGE_CONNECTION_STRING =
      "DefaultEndpointsProtocol=https;AccountName=prod;AccountKey=abc123;EndpointSuffix=core.windows.net";
    process.env.KEY_VAULT_NAME = "aipm-vault";
    expect(() => assertSafeLocalRuntime(process.env)).not.toThrow();
  });
});
