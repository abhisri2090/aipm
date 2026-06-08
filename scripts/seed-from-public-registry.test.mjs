import { describe, expect, it, vi } from "vitest";
import {
  buildPublishPayload,
  publishToLocalRegistry,
  resolveSeedConfig,
  seedFromPublicRegistry,
} from "./seed-from-public-registry.mjs";

describe("resolveSeedConfig", () => {
  it("uses public and local registry defaults", () => {
    expect(resolveSeedConfig({})).toEqual({
      publicRegistry: "https://api.aipm-registry.com",
      localRegistry: "http://127.0.0.1:8080",
      limit: 20,
    });
  });

  it("honors LOCAL_SEED_LIMIT", () => {
    expect(resolveSeedConfig({ LOCAL_SEED_LIMIT: "5" }).limit).toBe(5);
  });
});

describe("seedFromPublicRegistry", () => {
  it("downloads from public API and publishes to local registry", async () => {
    const fetchMock = vi.fn(async (url, init) => {
      if (url.endsWith("/v1/packages?limit=1")) {
        return {
          ok: true,
          async json() {
            return { packages: [{ name: "@team/sample-skill", version: "1.0.0" }] };
          },
        };
      }
      if (url.includes("/tarball")) {
        return {
          ok: true,
          async arrayBuffer() {
            return Buffer.from("tarball");
          },
        };
      }
      if (url.includes("/versions") && init?.method === "POST") {
        expect(url).toBe("http://127.0.0.1:8080/v1/packages/%40team%2Fsample-skill/versions");
        return { ok: true, status: 201, async text() { return ""; } };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const results = await seedFromPublicRegistry(
      {
        publicRegistry: "https://api.aipm-registry.com",
        localRegistry: "http://127.0.0.1:8080",
        limit: 1,
      },
      { fetch: fetchMock },
    );

    expect(results).toEqual([{ name: "@team/sample-skill", version: "1.0.0", ok: true, skipped: false, status: 201 }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("publishToLocalRegistry", () => {
  it("builds multipart payload", () => {
    const payload = buildPublishPayload(Buffer.from("abc"));
    expect(payload.contentType).toContain("multipart/form-data");
    expect(payload.body.toString("utf8")).toContain("tarball");
  });
});
