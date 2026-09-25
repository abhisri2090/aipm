import Fastify from "fastify";
import type pg from "pg";
import { describe, expect, it, vi } from "vitest";
import { registerPromptRoutes } from "./prompt-routes.js";
import type { AccountAuth } from "./user-auth.js";
import type { BlobStorage } from "./storage.js";

describe("GET /v1/prompts publisher filter", () => {
  it("filters published prompts by publisher scope", async () => {
    const publishedAt = new Date("2026-09-14T00:00:00Z");
    const alicePrompt = {
      id: "prompt-alice",
      slug: "focus-week",
      title: "Focus week",
      summary: "Plan a focused week",
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
      username: "alice",
      org_id: null,
      org_slug: null,
      org_name: null,
      github_login: "alice",
      publisher_name: "Alice",
      publisher_avatar_url: null,
      publisher_verified: false,
      sample_image_blob_path: null,
      scan_status: "clean",
      scan_findings: [],
      scan_checks_performed: [],
      scanned_at: null,
      scanner_version: null,
    };
    const query = vi.fn(async (sql: string, values: unknown[] = []) => {
      if (sql.includes("CREATE TABLE IF NOT EXISTS prompts")) return { rows: [] };
      if (sql.includes("COUNT(*)")) {
        expect(sql).toContain("LOWER(COALESCE(orgs.slug, users.username)) = $");
        expect(values).toContain("alice");
        return { rows: [{ count: "1" }] };
      }
      expect(sql).toContain("LOWER(COALESCE(orgs.slug, users.username)) = $");
      expect(values).toContain("alice");
      return { rows: [alicePrompt] };
    });
    const app = Fastify();
    try {
      await registerPromptRoutes(app, {
        accountAuth: { pool: { query } as unknown as pg.Pool, config: {} } as AccountAuth,
        storage: {} as BlobStorage,
      });
      const response = await app.inject({
        method: "GET",
        url: "/v1/prompts?publisher=alice&limit=10",
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().prompts).toHaveLength(1);
      expect(response.json().prompts[0].publisher.scope).toBe("alice");
      expect(query).toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
