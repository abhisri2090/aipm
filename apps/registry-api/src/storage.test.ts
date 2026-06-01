import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  blobKeyForPackage,
  createFilesystemStorage,
  resolveStorageConfig,
} from "./storage.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("resolveStorageConfig", () => {
  it("uses filesystem storage when Azure Blob connection string is not set", () => {
    expect(resolveStorageConfig("/tmp/aipm-data", {})).toEqual({
      backend: "filesystem",
      rootDir: "/tmp/aipm-data/packages",
    });
  });

  it("uses Azure Blob storage when a connection string is set", () => {
    expect(
      resolveStorageConfig("/tmp/aipm-data", {
        AZURE_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true",
        AZURE_STORAGE_CONTAINER: "staging-packages",
      }),
    ).toEqual({
      backend: "azure-blob",
      connectionString: "UseDevelopmentStorage=true",
      containerName: "staging-packages",
    });
  });

  it("defaults the Azure Blob container name", () => {
    expect(
      resolveStorageConfig("/tmp/aipm-data", {
        AZURE_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true",
      }),
    ).toMatchObject({
      backend: "azure-blob",
      containerName: "packages",
    });
  });
});

describe("createFilesystemStorage", () => {
  it("stores and retrieves nested package blobs", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "aipm-storage-"));
    tempDirs.push(rootDir);

    const storage = createFilesystemStorage(rootDir);
    await storage.put("%40team%2Fsample-skill/1.2.3.tgz", Buffer.from("package"));

    await expect(storage.get("%40team%2Fsample-skill/1.2.3.tgz")).resolves.toEqual(
      Buffer.from("package"),
    );
  });
});

describe("blobKeyForPackage", () => {
  it("encodes scoped package names for blob-safe storage", () => {
    expect(blobKeyForPackage("@team/sample-skill", "1.2.3")).toBe(
      "%40team%2Fsample-skill/1.2.3.tgz",
    );
  });
});
