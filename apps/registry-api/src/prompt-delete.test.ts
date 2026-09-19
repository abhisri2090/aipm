import Fastify from "fastify";
import type pg from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerPromptRoutes } from "./prompt-routes.js";
import type { AccountAuth } from "./user-auth.js";
import type { BlobStorage } from "./storage.js";

const requireCurrentUser = vi.hoisted(() => vi.fn());

vi.mock("./user-auth.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./user-auth.js")>();
  return {
    ...actual,
    requireCurrentUser,
  };
});

const owner = {
  id: "user-owner",
  username: "alice",
  email: "alice@example.com",
  name: "Alice",
  avatar_url: null,
  github_id: "1",
  github_login: "alice",
  created_at: new Date(),
  updated_at: new Date(),
};

const promptRow = {
  id: "prompt-1",
  slug: "focus-week",
  title: "Focus week",
  summary: "Plan a week",
  prompt_text: "Plan {{week}}",
  category: "Productivity",
  tags: [],
  input_types: ["text"],
  output_types: ["text"],
  tested_models: [],
  effort: "quick",
  variables: [],
  example_input: null,
  example_output: null,
  usage_notes: null,
  language: "English",
  source_url: null,
  license: "CC BY 4.0",
  status: "published",
  sample_image_blob_path: "prompts/prompt-1/sample.webp",
  sample_image_content_type: "image/webp",
  sample_image_alt: "Poster",
  copy_count: "0",
  created_at: new Date(),
  updated_at: new Date(),
  published_at: new Date(),
  owner_user_id: "user-owner",
  username: "alice",
  github_login: "alice",
  display_name: "Alice",
  avatar_url: null,
  org_id: null,
  org_slug: null,
  org_name: null,
  scan_status: "clean",
  scan_findings: [],
  scan_checks_performed: [],
  scanned_at: null,
  scanner_version: null,
};

describe("DELETE /v1/prompts/:publisher/:slug", () => {
  beforeEach(() => {
    requireCurrentUser.mockReset();
  });

  async function setup(options?: {
    prompt?: typeof promptRow | null;
    user?: typeof owner | null;
  }) {
    const deletedSql: string[] = [];
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("CREATE TABLE IF NOT EXISTS prompts")) return { rows: [] };
      if (sql.includes("FROM prompts") && sql.includes("JOIN users") && !sql.includes("DELETE")) {
        return { rows: options?.prompt === null ? [] : [options?.prompt ?? promptRow] };
      }
      if (sql.includes("FROM org_memberships")) return { rows: [] };
      if (sql.trimStart().startsWith("DELETE FROM prompts")) {
        deletedSql.push(sql);
        return { rows: [], rowCount: 1 };
      }
      return { rows: [] };
    });
    const storage = {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as BlobStorage & { delete: ReturnType<typeof vi.fn> };

    requireCurrentUser.mockImplementation(async (_auth, _request, reply) => {
      if (options?.user === null) {
        reply.status(401).send({ error: "Login required" });
        return null;
      }
      return options?.user ?? owner;
    });

    const app = Fastify();
    await registerPromptRoutes(app, {
      accountAuth: { pool: { query } as unknown as pg.Pool, config: {} } as AccountAuth,
      storage,
    });
    return { app, query, storage, deletedSql };
  }

  it("lets the owner permanently delete a prompt and its sample image", async () => {
    const { app, storage, deletedSql } = await setup();
    try {
      const response = await app.inject({
        method: "DELETE",
        url: "/v1/prompts/alice/focus-week",
      });
      expect(response.statusCode).toBe(204);
      expect(deletedSql.some((sql) => sql.includes("DELETE FROM prompts"))).toBe(true);
      expect(storage.delete).toHaveBeenCalledWith("prompts/prompt-1/sample.webp");
    } finally {
      await app.close();
    }
  });

  it("rejects other users", async () => {
    const { app, storage, deletedSql } = await setup({
      user: { ...owner, id: "user-other", username: "bob" },
    });
    try {
      const response = await app.inject({
        method: "DELETE",
        url: "/v1/prompts/alice/focus-week",
      });
      expect(response.statusCode).toBe(403);
      expect(deletedSql).toEqual([]);
      expect(storage.delete).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it("returns 404 when the prompt is missing", async () => {
    const { app } = await setup({ prompt: null });
    try {
      const response = await app.inject({
        method: "DELETE",
        url: "/v1/prompts/alice/missing",
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("returns 401 when unauthenticated", async () => {
    const { app, deletedSql } = await setup({ user: null });
    try {
      const response = await app.inject({
        method: "DELETE",
        url: "/v1/prompts/alice/focus-week",
      });
      expect(response.statusCode).toBe(401);
      expect(deletedSql).toEqual([]);
    } finally {
      await app.close();
    }
  });
});
