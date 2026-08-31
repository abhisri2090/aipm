import { afterEach, describe, expect, it, vi } from "vitest";
import { compressImage } from "./compress-image";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("compressImage", () => {
  it("keeps small and non-image files unchanged", async () => {
    const textFile = new File(["text"], "notes.txt", { type: "text/plain" });
    const smallImage = new File(["image"], "sample.png", { type: "image/png" });

    expect(await compressImage(textFile)).toBe(textFile);
    expect(await compressImage(smallImage)).toBe(smallImage);
  });

  it("converts large images to a smaller WebP file", async () => {
    const compressedBlob = new Blob(["compressed"], { type: "image/webp" });
    const canvas = {
      getContext: () => ({ clearRect: vi.fn(), drawImage: vi.fn() }),
      toBlob: (callback: BlobCallback) => callback(compressedBlob),
    } as unknown as HTMLCanvasElement;
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
      width: 3000,
      height: 2000,
      close: vi.fn(),
    }));
    vi.stubGlobal("document", {
      createElement: vi.fn(() => canvas),
    });

    const largeImage = new File([new Uint8Array(3 * 1024 * 1024)], "sample.png", {
      type: "image/png",
    });
    const result = await compressImage(largeImage);

    expect(result).not.toBe(largeImage);
    expect(result.type).toBe("image/webp");
    expect(result.name).toBe("sample.webp");
  });

  it("rejects an image when the browser cannot reach 600 KB", async () => {
    const oversizedBlob = new Blob([new Uint8Array(650 * 1024)], {
      type: "image/webp",
    });
    const canvas = {
      getContext: () => ({ clearRect: vi.fn(), drawImage: vi.fn() }),
      toBlob: (callback: BlobCallback) => callback(oversizedBlob),
    } as unknown as HTMLCanvasElement;
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
      width: 3000,
      height: 2000,
      close: vi.fn(),
    }));
    vi.stubGlobal("document", {
      createElement: vi.fn(() => canvas),
    });

    const largeImage = new File([new Uint8Array(3 * 1024 * 1024)], "sample.png", {
      type: "image/png",
    });

    await expect(compressImage(largeImage)).rejects.toThrow("under 600 KB");
  });
});
