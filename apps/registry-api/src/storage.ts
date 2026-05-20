import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface BlobStorage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
}

export function createFilesystemStorage(rootDir: string): BlobStorage {
  return {
    async put(key, data) {
      const path = join(rootDir, key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, data);
    },
    async get(key) {
      return readFile(join(rootDir, key));
    },
  };
}

export function blobKeyForPackage(name: string, version: string): string {
  const safeName = encodeURIComponent(name);
  return `${safeName}/${version}.tgz`;
}
