import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { BlobServiceClient } from "@azure/storage-blob";

export interface BlobStorage {
  readonly backend: "azure-blob" | "filesystem";
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  copy(sourceKey: string, destinationKey: string): Promise<void>;
  delete(key: string): Promise<void>;
  health(): Promise<void>;
}

export type StorageConfig =
  | { backend: "azure-blob"; connectionString: string; containerName: string }
  | { backend: "filesystem"; rootDir: string };

export function resolveStorageConfig(
  dataDir: string,
  env: NodeJS.ProcessEnv = process.env,
): StorageConfig {
  const connectionString = env.AZURE_STORAGE_CONNECTION_STRING;
  if (connectionString) {
    return {
      backend: "azure-blob",
      connectionString,
      containerName: env.AZURE_STORAGE_CONTAINER ?? "packages",
    };
  }

  return {
    backend: "filesystem",
    rootDir: join(dataDir, "packages"),
  };
}

export function createFilesystemStorage(rootDir: string): BlobStorage {
  return {
    backend: "filesystem",
    async put(key, data) {
      const path = join(rootDir, key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, data);
    },
    async get(key) {
      return readFile(join(rootDir, key));
    },
    async copy(sourceKey, destinationKey) {
      const data = await readFile(join(rootDir, sourceKey));
      const path = join(rootDir, destinationKey);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, data);
    },
    async delete(key) {
      await rm(join(rootDir, key), { force: true });
    },
    async health() {
      await mkdir(rootDir, { recursive: true });
      await access(rootDir);
    },
  };
}

export async function createAzureBlobStorage(
  connectionString: string,
  containerName: string,
): Promise<BlobStorage> {
  const service = BlobServiceClient.fromConnectionString(connectionString);
  const container = service.getContainerClient(containerName);
  await container.createIfNotExists();

  return {
    backend: "azure-blob",
    async put(key, data) {
      const blob = container.getBlockBlobClient(key);
      await blob.uploadData(data, {
        blobHTTPHeaders: {
          blobContentType: "application/gzip",
        },
      });
    },
    async get(key) {
      const blob = container.getBlockBlobClient(key);
      const response = await blob.downloadToBuffer();
      return Buffer.from(response);
    },
    async copy(sourceKey, destinationKey) {
      const source = container.getBlockBlobClient(sourceKey);
      const destination = container.getBlockBlobClient(destinationKey);
      const data = await source.downloadToBuffer();
      await destination.uploadData(data, {
        blobHTTPHeaders: {
          blobContentType: "application/gzip",
        },
      });
    },
    async delete(key) {
      await container.getBlockBlobClient(key).deleteIfExists();
    },
    async health() {
      await container.getProperties();
    },
  };
}

export async function createStorage(dataDir: string): Promise<BlobStorage> {
  const config = resolveStorageConfig(dataDir);
  if (config.backend === "azure-blob") {
    const storage = await createAzureBlobStorage(config.connectionString, config.containerName);
    console.log(`Package storage backend: azure-blob (${config.containerName})`);
    return storage;
  }

  console.log(`Package storage backend: filesystem (${config.rootDir})`);
  return createFilesystemStorage(config.rootDir);
}

export function blobKeyForPackage(name: string, version: string): string {
  const safeName = encodeURIComponent(name);
  return `${safeName}/${version}.tgz`;
}
