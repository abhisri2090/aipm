import Fastify from "fastify";
import type pg from "pg";
import { describe, expect, it, vi } from "vitest";
import { registerPromptRoutes } from "./prompt-routes.js";
import type { AccountAuth } from "./user-auth.js";
import type { BlobStorage } from "./storage.js";

describe("prompt listing offsets for numbered directory pages", () => {
  it("returns non-overlapping newest pages, including rows with the same publication time", async () => {
    const publishedAt = new Date("2026-09-14T00:00:00Z");
    const rows = Array.from({ length: 109 }, (_, index) => ({
      id: `prompt-${String(109 - index).padStart(3, "0")}`,
      slug: `prompt-${109 - index}`,
      title: `Prompt ${109 - index}`,
      summary: "A useful prompt",
      category: "Work",
      tags: [],
      input_types: ["text"],
      output_types: ["text"],
      effort: "quick",
      language: "English",
      copy_count: "0",
      created_at: publishedAt,
      updated_at: publishedAt,
      published_at: publishedAt,
      username: "publisher",
      org_id: null,
      sample_image_blob_path: null,
      scan_status: "clean",
      scan_findings: [],
      scan_checks_performed: [],
      scanned_at: null,
      scanner_version: null,
    }));
    const query = vi.fn(async (sql: string, values: unknown[] = []) => {
      if (sql.includes("CREATE TABLE IF NOT EXISTS prompts")) return { rows: [] };
      if (sql.includes("COUNT(*)")) return { rows: [{ count: "109" }] };
      expect(sql).toContain("ORDER BY COALESCE(prompts.published_at, prompts.created_at) DESC, prompts.id DESC");
      expect(sql).toContain(" OFFSET $");
      const offset = Number(values.at(-1));
      const limit = Number(values.at(-2));
      return { rows: rows.slice(offset, offset + limit) };
    });
    const app = Fastify();
    try {
      await registerPromptRoutes(app, {
        accountAuth: { pool: { query } as unknown as pg.Pool, config: {} } as AccountAuth,
        storage: {} as BlobStorage,
      });
      const pages = await Promise.all(
        [0, 40, 80].map((offset) =>
          app.inject({ method: "GET", url: `/v1/prompts?sort=newest&limit=40&offset=${offset}` }),
        ),
      );
      expect(pages.map((page) => page.statusCode)).toEqual([200, 200, 200]);
      const bodies = pages.map((page) => page.json());
      expect(bodies.map((body) => body.prompts.length)).toEqual([40, 40, 29]);
      expect(bodies.map((body) => body.nextOffset)).toEqual([40, 80, null]);
      expect(new Set(bodies.flatMap((body) => body.prompts.map((prompt: { id: string }) => prompt.id))).size).toBe(109);
    } finally {
      await app.close();
    }
  });
});
