import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type pg from "pg";
import {
  getCurrentAdminUser,
  isAdminAuthConfigured,
  isAllowedAdminUsername,
  type AdminAuthConfig,
} from "./admin-auth.js";
import type { AccountAuth } from "./user-auth.js";
import { getCurrentUser, requireCurrentUser } from "./user-auth.js";

const MAX_BODY_LENGTH = 2000;
const MAX_TOP_LEVEL = 100;

export type CommentTargetType = "package" | "prompt";

type CommentRow = {
  id: string;
  target_type: CommentTargetType;
  target_key: string;
  parent_id: string | null;
  author_user_id: string;
  body: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  deleted_by_user_id: string | null;
  username: string;
  author_name: string | null;
  avatar_url: string | null;
};

export function cleanCommentBody(value: unknown): string {
  if (typeof value !== "string") throw new Error("Comment text is required");
  const cleaned = value.trim();
  if (!cleaned) throw new Error("Comment text is required");
  if (cleaned.length > MAX_BODY_LENGTH) {
    throw new Error(`Comment must be ${MAX_BODY_LENGTH} characters or fewer`);
  }
  return cleaned;
}

export function parseCommentTargetType(value: unknown): CommentTargetType {
  if (value === "package" || value === "prompt") return value;
  throw new Error("targetType must be package or prompt");
}

export function sortTopLevelComments<T extends { replyCount: number; createdAt: string | Date }>(
  comments: T[],
): T[] {
  return [...comments].sort((a, b) => {
    if (b.replyCount !== a.replyCount) return b.replyCount - a.replyCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

async function ensureCommentSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
      author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      deleted_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      CHECK (target_type IN ('package', 'prompt'))
    );
    CREATE INDEX IF NOT EXISTS idx_comments_target
      ON comments (target_type, target_key, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_parent
      ON comments (parent_id, created_at ASC);
  `);
}

async function publicPackageExists(pool: pg.Pool, name: string): Promise<boolean> {
  const result = await pool.query<{ ok: number }>(
    `SELECT 1 AS ok
     FROM package_versions
     LEFT JOIN package_reservations ON package_reservations.name = package_versions.name
     WHERE package_versions.name = $1
       AND package_versions.yanked_at IS NULL
       AND COALESCE(package_reservations.visibility, 'public') = 'public'
     LIMIT 1`,
    [name],
  );
  return Boolean(result.rows[0]);
}

async function publicPromptExists(pool: pg.Pool, promptId: string): Promise<boolean> {
  const result = await pool.query<{ ok: number }>(
    `SELECT 1 AS ok FROM prompts WHERE id = $1 AND status = 'published' LIMIT 1`,
    [promptId],
  );
  return Boolean(result.rows[0]);
}

async function assertPublicTarget(
  pool: pg.Pool,
  targetType: CommentTargetType,
  targetKey: string,
): Promise<void> {
  const exists =
    targetType === "package"
      ? await publicPackageExists(pool, targetKey)
      : await publicPromptExists(pool, targetKey);
  if (!exists) throw Object.assign(new Error("Target not found"), { statusCode: 404 });
}

type SerializedComment = {
  id: string;
  targetType: CommentTargetType;
  targetKey: string;
  parentId: string | null;
  body: string | null;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  replyCount: number;
  replies: SerializedComment[];
  canEdit: boolean;
  canDelete: boolean;
};

function serializeComment(
  row: CommentRow,
  options: {
    replyCount?: number;
    replies?: SerializedComment[];
    canEdit: boolean;
    canDelete: boolean;
  },
): SerializedComment {
  const deleted = Boolean(row.deleted_at);
  return {
    id: row.id,
    targetType: row.target_type,
    targetKey: row.target_key,
    parentId: row.parent_id,
    body: deleted ? null : row.body,
    deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_user_id,
      username: row.username,
      name: row.author_name,
      avatarUrl: row.avatar_url,
    },
    replyCount: options.replyCount ?? 0,
    replies: options.replies ?? [],
    canEdit: options.canEdit && !deleted,
    canDelete: options.canDelete && !deleted,
  };
}

async function loadComments(
  pool: pg.Pool,
  targetType: CommentTargetType,
  targetKey: string,
): Promise<CommentRow[]> {
  const result = await pool.query<CommentRow>(
    `SELECT comments.id,
            comments.target_type,
            comments.target_key,
            comments.parent_id,
            comments.author_user_id,
            comments.body,
            comments.created_at,
            comments.updated_at,
            comments.deleted_at,
            comments.deleted_by_user_id,
            users.username,
            users.name AS author_name,
            users.avatar_url
     FROM comments
     JOIN users ON users.id = comments.author_user_id
     WHERE comments.target_type = $1 AND comments.target_key = $2
     ORDER BY comments.created_at ASC`,
    [targetType, targetKey],
  );
  return result.rows;
}

async function loadCommentById(pool: pg.Pool, id: string): Promise<CommentRow | null> {
  const result = await pool.query<CommentRow>(
    `SELECT comments.id,
            comments.target_type,
            comments.target_key,
            comments.parent_id,
            comments.author_user_id,
            comments.body,
            comments.created_at,
            comments.updated_at,
            comments.deleted_at,
            comments.deleted_by_user_id,
            users.username,
            users.name AS author_name,
            users.avatar_url
     FROM comments
     JOIN users ON users.id = comments.author_user_id
     WHERE comments.id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function actorCanAdminDelete(
  auth: AccountAuth,
  adminConfig: AdminAuthConfig,
  request: FastifyRequest,
): Promise<boolean> {
  if (!isAdminAuthConfigured(adminConfig)) return false;
  const admin = await getCurrentAdminUser(auth, request);
  if (!admin) return false;
  return isAllowedAdminUsername(admin.username, adminConfig.allowedUsernames);
}

export async function registerCommentRoutes(
  app: FastifyInstance,
  options: { accountAuth: AccountAuth | null; adminAuthConfig: AdminAuthConfig },
): Promise<void> {
  if (options.accountAuth) await ensureCommentSchema(options.accountAuth.pool);

  app.get<{ Querystring: { targetType?: string; targetKey?: string } }>(
    "/v1/comments",
    async (request, reply) => {
      if (!options.accountAuth) return { comments: [], totalCount: 0 };
      let targetType: CommentTargetType;
      try {
        targetType = parseCommentTargetType(request.query.targetType);
      } catch (error) {
        return reply
          .status(400)
          .send({ error: error instanceof Error ? error.message : "Invalid target" });
      }
      const targetKey = String(request.query.targetKey ?? "").trim();
      if (!targetKey) return reply.status(400).send({ error: "targetKey is required" });

      try {
        await assertPublicTarget(options.accountAuth.pool, targetType, targetKey);
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode ?? 500;
        return reply
          .status(status)
          .send({ error: error instanceof Error ? error.message : "Target not found" });
      }

      const rows = await loadComments(options.accountAuth.pool, targetType, targetKey);
      const user = await getCurrentUser(options.accountAuth, request);
      const isAdmin = user
        ? await actorCanAdminDelete(options.accountAuth, options.adminAuthConfig, request)
        : false;

      const repliesByParent = new Map<string, CommentRow[]>();
      const topLevel: CommentRow[] = [];
      for (const row of rows) {
        if (row.parent_id) {
          const list = repliesByParent.get(row.parent_id) ?? [];
          list.push(row);
          repliesByParent.set(row.parent_id, list);
        } else {
          topLevel.push(row);
        }
      }

      const threaded = sortTopLevelComments(
        topLevel.map((row) => {
          const replies = (repliesByParent.get(row.id) ?? []).map((reply) => {
            const canEdit = Boolean(user && user.id === reply.author_user_id);
            const canDelete =
              canEdit ||
              Boolean(user && isAdmin);
            return serializeComment(reply, { canEdit, canDelete });
          });
          const replyCount = replies.filter((reply) => !reply.deleted).length;
          const canEdit = Boolean(user && user.id === row.author_user_id);
          const canDelete = canEdit || Boolean(user && isAdmin);
          return serializeComment(row, {
            replyCount,
            replies,
            canEdit,
            canDelete,
          });
        }),
      ).slice(0, MAX_TOP_LEVEL);

      const totalCount = rows.filter((row) => !row.deleted_at).length;
      return { comments: threaded, totalCount };
    },
  );

  app.post<{
    Body: {
      targetType?: string;
      targetKey?: string;
      body?: string;
      parentId?: string | null;
    };
  }>("/v1/comments", async (request, reply) => {
    const user = await requireCurrentUser(options.accountAuth, request, reply);
    if (!user || !options.accountAuth) return;

    let targetType: CommentTargetType;
    let body: string;
    try {
      targetType = parseCommentTargetType(request.body?.targetType);
      body = cleanCommentBody(request.body?.body);
    } catch (error) {
      return reply
        .status(400)
        .send({ error: error instanceof Error ? error.message : "Invalid comment" });
    }
    const targetKey = String(request.body?.targetKey ?? "").trim();
    if (!targetKey) return reply.status(400).send({ error: "targetKey is required" });
    const parentId = request.body?.parentId?.trim() || null;

    try {
      await assertPublicTarget(options.accountAuth.pool, targetType, targetKey);
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode ?? 500;
      return reply
        .status(status)
        .send({ error: error instanceof Error ? error.message : "Target not found" });
    }

    if (parentId) {
      const parent = await loadCommentById(options.accountAuth.pool, parentId);
      if (
        !parent ||
        parent.target_type !== targetType ||
        parent.target_key !== targetKey ||
        parent.parent_id !== null
      ) {
        return reply.status(400).send({ error: "Replies must target a top-level comment" });
      }
      if (parent.deleted_at) {
        return reply.status(400).send({ error: "Cannot reply to a removed comment" });
      }
    }

    const id = randomUUID();
    await options.accountAuth.pool.query(
      `INSERT INTO comments (
         id, target_type, target_key, parent_id, author_user_id, body
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, targetType, targetKey, parentId, user.id, body],
    );
    const created = await loadCommentById(options.accountAuth.pool, id);
    if (!created) throw new Error("Created comment could not be loaded");
    return reply.status(201).send(
      serializeComment(created, {
        canEdit: true,
        canDelete: true,
      }),
    );
  });

  app.patch<{ Params: { id: string }; Body: { body?: string } }>(
    "/v1/comments/:id",
    async (request, reply) => {
      const user = await requireCurrentUser(options.accountAuth, request, reply);
      if (!user || !options.accountAuth) return;

      const existing = await loadCommentById(options.accountAuth.pool, request.params.id);
      if (!existing || existing.deleted_at) {
        return reply.status(404).send({ error: "Comment not found" });
      }
      if (existing.author_user_id !== user.id) {
        return reply.status(403).send({ error: "You can only edit your own comments" });
      }

      let body: string;
      try {
        body = cleanCommentBody(request.body?.body);
      } catch (error) {
        return reply
          .status(400)
          .send({ error: error instanceof Error ? error.message : "Invalid comment" });
      }

      await options.accountAuth.pool.query(
        `UPDATE comments SET body = $2, updated_at = NOW() WHERE id = $1`,
        [existing.id, body],
      );
      const updated = await loadCommentById(options.accountAuth.pool, existing.id);
      if (!updated) throw new Error("Updated comment could not be loaded");
      return serializeComment(updated, { canEdit: true, canDelete: true });
    },
  );

  app.delete<{ Params: { id: string } }>("/v1/comments/:id", async (request, reply) => {
    const user = await requireCurrentUser(options.accountAuth, request, reply);
    if (!user || !options.accountAuth) return;

    const existing = await loadCommentById(options.accountAuth.pool, request.params.id);
    if (!existing || existing.deleted_at) {
      return reply.status(404).send({ error: "Comment not found" });
    }

    const isAuthor = existing.author_user_id === user.id;
    const isAdmin = await actorCanAdminDelete(
      options.accountAuth,
      options.adminAuthConfig,
      request,
    );
    if (!isAuthor && !isAdmin) {
      return reply.status(403).send({ error: "You cannot delete this comment" });
    }

    await options.accountAuth.pool.query(
      `UPDATE comments
       SET deleted_at = NOW(), deleted_by_user_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [existing.id, user.id],
    );
    return { ok: true };
  });
}
