import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type pg from "pg";
import { getOrgBySlugForMember } from "./db.js";
import type { BlobStorage } from "./storage.js";
import {
  getCurrentUser,
  requireCurrentUser,
  type AccountAuth,
} from "./user-auth.js";
import { promptPublicUrl, queueSearchNotification } from "./search-notification.js";

const MAX_SAMPLE_IMAGE_BYTES = 5 * 1024 * 1024;
const PROMPT_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const ALLOWED_INPUT_TYPES = new Set(["text", "image", "document", "code", "audio"]);
const ALLOWED_OUTPUT_TYPES = new Set([
  "text",
  "image",
  "code",
  "structured-data",
  "audio",
  "video",
]);
const ALLOWED_EFFORTS = new Set(["quick", "guided", "advanced"]);
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type PromptVariable = {
  name: string;
  description: string;
  example: string;
  required: boolean;
};

export type PromptInput = {
  title: string;
  slug?: string;
  summary: string;
  promptText: string;
  category: string;
  tags: string[];
  inputTypes: string[];
  outputTypes: string[];
  testedModels: string[];
  effort: string;
  variables?: PromptVariable[];
  exampleInput?: string;
  exampleOutput?: string;
  usageNotes?: string;
  language?: string;
  sourceUrl?: string;
  license: string;
  sampleImageAlt?: string;
  orgSlug?: string;
};

type PromptRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  prompt_text: string;
  category: string;
  tags: string[];
  input_types: string[];
  output_types: string[];
  tested_models: string[];
  effort: string;
  variables: PromptVariable[];
  example_input: string | null;
  example_output: string | null;
  usage_notes: string | null;
  language: string;
  source_url: string | null;
  license: string;
  status: string;
  sample_image_blob_path: string | null;
  sample_image_content_type: string | null;
  sample_image_alt: string | null;
  copy_count: string;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  owner_user_id: string;
  username: string;
  github_login: string | null;
  publisher_name: string | null;
  publisher_avatar_url: string | null;
  publisher_verified: boolean;
  org_id: string | null;
  org_slug: string | null;
  org_name: string | null;
};

const PROMPT_SELECT = `
  prompts.id,
  prompts.slug,
  prompts.title,
  prompts.summary,
  prompts.prompt_text,
  prompts.category,
  prompts.tags,
  prompts.input_types,
  prompts.output_types,
  prompts.tested_models,
  prompts.effort,
  prompts.variables,
  prompts.example_input,
  prompts.example_output,
  prompts.usage_notes,
  prompts.language,
  prompts.source_url,
  prompts.license,
  prompts.status,
  prompts.sample_image_blob_path,
  prompts.sample_image_content_type,
  prompts.sample_image_alt,
  prompts.copy_count,
  prompts.created_at,
  prompts.updated_at,
  prompts.published_at,
  prompts.owner_user_id,
  users.username,
  users.github_login,
  users.name AS publisher_name,
  users.avatar_url AS publisher_avatar_url,
  users.verified AS publisher_verified,
  prompts.org_id,
  orgs.slug AS org_slug,
  orgs.name AS org_name
`;

function cleanString(
  value: unknown,
  max: number,
  field: string,
  required = true,
): string {
  if (typeof value !== "string") {
    if (!required) return "";
    throw new Error(`${field} is required`);
  }
  const cleaned = value.trim();
  if (required && !cleaned) throw new Error(`${field} is required`);
  if (cleaned.length > max)
    throw new Error(`${field} must be ${max} characters or fewer`);
  return cleaned;
}

function cleanArray(
  value: unknown,
  options: {
    field: string;
    maxItems: number;
    maxLength: number;
    allowed?: Set<string>;
    required?: boolean;
    preserveCase?: boolean;
  },
): string[] {
  if (!Array.isArray(value)) throw new Error(`${options.field} must be a list`);
  const items = [
    ...new Set(
      value.map((item) => {
        const cleaned = cleanString(item, options.maxLength, options.field);
        return options.preserveCase ? cleaned : cleaned.toLowerCase();
      }),
    ),
  ];
  if ((options.required ?? true) && items.length === 0) {
    const field = options.field.toLowerCase();
    throw new Error(
      `Choose at least one ${field.endsWith("s") ? field.slice(0, -1) : field}`,
    );
  }
  if (items.length > options.maxItems)
    throw new Error(`${options.field} supports up to ${options.maxItems} values`);
  if (options.allowed && items.some((item) => !options.allowed?.has(item))) {
    throw new Error(`${options.field} contains an unsupported value`);
  }
  return items;
}

export function slugifyPromptTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function validatePromptInput(raw: unknown): PromptInput {
  if (!raw || typeof raw !== "object") throw new Error("Prompt details are required");
  const input = raw as Record<string, unknown>;
  const title = cleanString(input.title, 100, "Title");
  const slug = cleanString(input.slug, 80, "Slug", false) || slugifyPromptTitle(title);
  if (!PROMPT_SLUG_REGEX.test(slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and single hyphens");
  }
  const summary = cleanString(input.summary, 240, "Summary");
  const promptText = cleanString(input.promptText, 20_000, "Prompt");
  const category = cleanString(input.category, 40, "Category");
  const tags = cleanArray(input.tags, { field: "Tags", maxItems: 10, maxLength: 30 });
  const inputTypes = cleanArray(input.inputTypes, {
    field: "Input types",
    maxItems: 5,
    maxLength: 30,
    allowed: ALLOWED_INPUT_TYPES,
  });
  const outputTypes = cleanArray(input.outputTypes, {
    field: "Output types",
    maxItems: 6,
    maxLength: 30,
    allowed: ALLOWED_OUTPUT_TYPES,
  });
  const testedModels = cleanArray(input.testedModels ?? [], {
    field: "Tested models",
    maxItems: 10,
    maxLength: 80,
    required: false,
    preserveCase: true,
  });
  const effort = cleanString(input.effort, 20, "Effort").toLowerCase();
  if (!ALLOWED_EFFORTS.has(effort))
    throw new Error("Effort must be quick, guided, or advanced");
  const variablesRaw = input.variables ?? [];
  if (!Array.isArray(variablesRaw) || variablesRaw.length > 20) {
    throw new Error("Variables must be a list with no more than 20 entries");
  }
  const variableNames = new Set<string>();
  const variables = variablesRaw.map((value) => {
    if (!value || typeof value !== "object")
      throw new Error("Each variable must be an object");
    const variable = value as Record<string, unknown>;
    const name = cleanString(variable.name, 50, "Variable name");
    if (!/^[a-z][a-z0-9_]*$/i.test(name)) {
      throw new Error(`Variable ${name} must use letters, numbers, and underscores`);
    }
    const normalized = name.toLowerCase();
    if (variableNames.has(normalized))
      throw new Error(`Variable ${name} is listed more than once`);
    variableNames.add(normalized);
    return {
      name,
      description: cleanString(variable.description, 240, `Description for ${name}`),
      example: cleanString(variable.example, 240, `Example for ${name}`),
      required: variable.required !== false,
    };
  });
  const sourceUrl = cleanString(input.sourceUrl, 500, "Source URL", false);
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol !== "https:") throw new Error();
    } catch {
      throw new Error("Source URL must be a valid HTTPS URL");
    }
  }

  return {
    title,
    slug,
    summary,
    promptText,
    category,
    tags,
    inputTypes,
    outputTypes,
    testedModels,
    effort,
    variables,
    exampleInput: cleanString(input.exampleInput, 5000, "Example input", false),
    exampleOutput: cleanString(input.exampleOutput, 5000, "Example output", false),
    usageNotes: cleanString(input.usageNotes, 3000, "Usage notes", false),
    language: cleanString(input.language, 40, "Language", false) || "English",
    sourceUrl,
    license: cleanString(input.license, 80, "License"),
    sampleImageAlt: cleanString(
      input.sampleImageAlt,
      240,
      "Sample image description",
      false,
    ),
    orgSlug: cleanString(input.orgSlug, 80, "Organization", false).toLowerCase(),
  };
}

export function validatePromptSampleImage(
  outputTypes: string[],
  sampleImage: { present: boolean; alt: string },
): void {
  if (!outputTypes.includes("image")) return;
  if (!sampleImage.present) {
    throw new Error("A sample image is required when the prompt produces images");
  }
  if (!sampleImage.alt.trim()) {
    throw new Error("Describe the sample image for accessibility");
  }
}

export function userCanEditPrompt(
  userId: string | null | undefined,
  prompt: { owner_user_id: string; org_id: string | null },
  editableOrgIds: ReadonlySet<string>,
): boolean {
  if (!userId) return false;
  if (prompt.owner_user_id === userId) return true;
  return Boolean(prompt.org_id && editableOrgIds.has(prompt.org_id));
}

async function listEditableOrgIds(pool: pg.Pool, userId: string): Promise<Set<string>> {
  const result = await pool.query<{ org_id: string }>(
    `SELECT org_id
     FROM org_memberships
     WHERE user_id = $1 AND role IN ('owner', 'admin')`,
    [userId],
  );
  return new Set(result.rows.map((row) => row.org_id));
}

function publisherScope(row: PromptRow): string {
  return row.org_slug ?? row.username;
}

function serializePublisher(row: PromptRow) {
  return {
    scope: publisherScope(row),
    kind: row.org_id ? "organization" : "individual",
    org: row.org_id ? { slug: row.org_slug, name: row.org_name } : null,
    user: {
      username: row.username,
      githubLogin: row.github_login,
      name: row.publisher_name,
      avatarUrl: row.publisher_avatar_url,
      verified: row.publisher_verified,
    },
  };
}

function serializeSummary(
  row: PromptRow,
  options?: { canEdit?: boolean },
) {
  const scope = publisherScope(row);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    tags: row.tags,
    inputTypes: row.input_types,
    outputTypes: row.output_types,
    effort: row.effort,
    language: row.language,
    copyCount: Number(row.copy_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    publisher: serializePublisher(row),
    path: `/prompts/${encodeURIComponent(scope)}/${encodeURIComponent(row.slug)}`,
    hasSampleImage: Boolean(row.sample_image_blob_path),
    canEdit: Boolean(options?.canEdit),
  };
}

function serializeDetail(
  row: PromptRow,
  options?: { canEdit?: boolean },
) {
  const scope = publisherScope(row);
  return {
    ...serializeSummary(row, options),
    promptText: row.prompt_text,
    testedModels: row.tested_models,
    variables: row.variables,
    exampleInput: row.example_input,
    exampleOutput: row.example_output,
    usageNotes: row.usage_notes,
    sourceUrl: row.source_url,
    license: row.license,
    sampleImageAlt: row.sample_image_alt,
    sampleImageUrl: row.sample_image_blob_path
      ? `/v1/prompts/${encodeURIComponent(scope)}/${encodeURIComponent(row.slug)}/sample-image`
      : null,
  };
}

type ParsedPromptMultipart = {
  rawData: string;
  sampleImage: { data: Buffer; contentType: string; extension: string } | null;
  error?: { status: number; error: string };
};

async function parsePromptMultipart(
  request: FastifyRequest,
): Promise<ParsedPromptMultipart> {
  let rawData = "";
  let sampleImage: ParsedPromptMultipart["sampleImage"] = null;
  for await (const part of request.parts({
    limits: { fileSize: MAX_SAMPLE_IMAGE_BYTES, files: 1, fields: 10 },
  })) {
    if (part.type === "file") {
      if (part.fieldname !== "sampleImage" || !part.filename) {
        await part.toBuffer();
        continue;
      }
      const extension = ALLOWED_IMAGE_TYPES.get(part.mimetype);
      if (!extension) {
        await part.toBuffer();
        return {
          rawData,
          sampleImage: null,
          error: { status: 400, error: "Sample image must be a JPEG, PNG, or WebP file" },
        };
      }
      const data = await part.toBuffer();
      if (part.file.truncated || data.length > MAX_SAMPLE_IMAGE_BYTES) {
        return {
          rawData,
          sampleImage: null,
          error: { status: 413, error: "Sample image must be 5 MB or smaller" },
        };
      }
      sampleImage = { data, contentType: part.mimetype, extension };
    } else if (part.fieldname === "data") {
      rawData = String(part.value ?? "");
    }
  }
  return { rawData, sampleImage };
}

async function ensurePromptSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      category TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      input_types JSONB NOT NULL DEFAULT '[]'::jsonb,
      output_types JSONB NOT NULL DEFAULT '[]'::jsonb,
      tested_models JSONB NOT NULL DEFAULT '[]'::jsonb,
      effort TEXT NOT NULL,
      variables JSONB NOT NULL DEFAULT '[]'::jsonb,
      example_input TEXT,
      example_output TEXT,
      usage_notes TEXT,
      language TEXT NOT NULL DEFAULT 'English',
      source_url TEXT,
      license TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      sample_image_blob_path TEXT,
      sample_image_content_type TEXT,
      sample_image_alt TEXT,
      copy_count BIGINT NOT NULL DEFAULT 0,
      owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      org_id TEXT REFERENCES orgs(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ,
      CHECK (status IN ('draft', 'published', 'hidden', 'archived')),
      CHECK (effort IN ('quick', 'guided', 'advanced'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_prompts_personal_slug
      ON prompts (owner_user_id, slug) WHERE org_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_prompts_org_slug
      ON prompts (org_id, slug) WHERE org_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_prompts_public
      ON prompts (published_at DESC) WHERE status = 'published';
  `);
}

async function findPublicPrompt(
  pool: pg.Pool,
  scope: string,
  slug: string,
): Promise<PromptRow | null> {
  const result = await pool.query<PromptRow>(
    `SELECT ${PROMPT_SELECT}
     FROM prompts
     JOIN users ON users.id = prompts.owner_user_id
     LEFT JOIN orgs ON orgs.id = prompts.org_id
     WHERE prompts.status = 'published'
       AND prompts.slug = $2
       AND (orgs.slug = $1 OR (prompts.org_id IS NULL AND users.username = $1))
     LIMIT 1`,
    [scope, slug],
  );
  return result.rows[0] ?? null;
}

export async function registerPromptRoutes(
  app: FastifyInstance,
  options: { accountAuth: AccountAuth | null; storage: BlobStorage },
): Promise<void> {
  if (options.accountAuth) await ensurePromptSchema(options.accountAuth.pool);

  app.get<{ Querystring: { q?: string; limit?: string } }>(
    "/v1/prompts",
    async (request) => {
      if (!options.accountAuth) return { prompts: [] };
      const limit = Math.min(100, Math.max(1, Number(request.query.limit ?? 50) || 50));
      const query = request.query.q?.trim() ?? "";
      const values: unknown[] = [];
      let search = "";
      if (query) {
        values.push(`%${query}%`);
        search = `AND (prompts.title ILIKE $1 OR prompts.summary ILIKE $1 OR prompts.category ILIKE $1 OR prompts.tags::text ILIKE $1)`;
      }
      values.push(limit);
      const result = await options.accountAuth.pool.query<PromptRow>(
        `SELECT ${PROMPT_SELECT}
       FROM prompts
       JOIN users ON users.id = prompts.owner_user_id
       LEFT JOIN orgs ON orgs.id = prompts.org_id
       WHERE prompts.status = 'published' ${search}
       ORDER BY prompts.published_at DESC, prompts.created_at DESC
       LIMIT $${values.length}`,
        values,
      );
      const user = await getCurrentUser(options.accountAuth, request);
      const editableOrgIds = user
        ? await listEditableOrgIds(options.accountAuth.pool, user.id)
        : new Set<string>();
      return {
        prompts: result.rows.map((row) =>
          serializeSummary(row, {
            canEdit: userCanEditPrompt(user?.id, row, editableOrgIds),
          }),
        ),
      };
    },
  );

  app.get("/v1/me/prompts", async (request, reply) => {
    const user = await requireCurrentUser(options.accountAuth, request, reply);
    if (!user || !options.accountAuth) return;
    const result = await options.accountAuth.pool.query<PromptRow>(
      `SELECT ${PROMPT_SELECT}
       FROM prompts
       JOIN users ON users.id = prompts.owner_user_id
       LEFT JOIN orgs ON orgs.id = prompts.org_id
       WHERE prompts.owner_user_id = $1
       ORDER BY prompts.updated_at DESC`,
      [user.id],
    );
    const editableOrgIds = await listEditableOrgIds(options.accountAuth.pool, user.id);
    return {
      prompts: result.rows.map((row) => ({
        ...serializeSummary(row, {
          canEdit: userCanEditPrompt(user.id, row, editableOrgIds),
        }),
        status: row.status,
      })),
    };
  });

  app.post("/v1/prompts", async (request, reply) => {
    const user = await requireCurrentUser(options.accountAuth, request, reply);
    if (!user || !options.accountAuth) return;
    const parsed = await parsePromptMultipart(request);
    if (parsed.error) return reply.status(parsed.error.status).send({ error: parsed.error.error });
    const { rawData, sampleImage } = parsed;

    let input: PromptInput;
    try {
      input = validatePromptInput(JSON.parse(rawData || "{}"));
    } catch (error) {
      return reply
        .status(400)
        .send({ error: error instanceof Error ? error.message : "Invalid prompt" });
    }
    try {
      validatePromptSampleImage(input.outputTypes, {
        present: Boolean(sampleImage),
        alt: input.sampleImageAlt ?? "",
      });
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Invalid sample image",
      });
    }

    let orgId: string | null = null;
    if (input.orgSlug) {
      const org = await getOrgBySlugForMember(
        options.accountAuth.pool,
        input.orgSlug,
        user.id,
      );
      if (!org) return reply.status(404).send({ error: "Organization not found" });
      if (org.role === "viewer") {
        return reply
          .status(403)
          .send({ error: "Viewers cannot publish prompts for this organization" });
      }
      orgId = org.id;
    }

    const id = randomUUID();
    const blobPath = sampleImage ? `prompts/${id}/sample.${sampleImage.extension}` : null;
    if (sampleImage && blobPath) await options.storage.put(blobPath, sampleImage.data);
    try {
      const result = await options.accountAuth.pool.query<{ slug: string }>(
        `INSERT INTO prompts (
           id, slug, title, summary, prompt_text, category, tags, input_types, output_types,
           tested_models, effort, variables, example_input, example_output, usage_notes, language,
           source_url, license, status, sample_image_blob_path, sample_image_content_type,
           sample_image_alt, owner_user_id, org_id, published_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb,
           $10::jsonb, $11, $12::jsonb, $13, $14, $15, $16,
           $17, $18, 'published', $19, $20, $21, $22, $23, NOW()
         )
         RETURNING *`,
        [
          id,
          input.slug,
          input.title,
          input.summary,
          input.promptText,
          input.category,
          JSON.stringify(input.tags),
          JSON.stringify(input.inputTypes),
          JSON.stringify(input.outputTypes),
          JSON.stringify(input.testedModels),
          input.effort,
          JSON.stringify(input.variables ?? []),
          input.exampleInput || null,
          input.exampleOutput || null,
          input.usageNotes || null,
          input.language,
          input.sourceUrl || null,
          input.license,
          blobPath,
          sampleImage?.contentType ?? null,
          input.sampleImageAlt || null,
          user.id,
          orgId,
        ],
      );
      const created = result.rows[0]!;
      const hydrated = await findPublicPrompt(
        options.accountAuth.pool,
        input.orgSlug || user.username,
        created.slug,
      );
      if (!hydrated) throw new Error("Published prompt could not be loaded");
      const detail = serializeDetail(hydrated, { canEdit: true });
      queueSearchNotification(
        [promptPublicUrl(detail.publisher.scope, detail.slug)],
        request.log,
      );
      return reply.status(201).send(detail);
    } catch (error) {
      if (blobPath) await options.storage.delete(blobPath).catch(() => undefined);
      const pgError = error as { code?: string };
      if (pgError.code === "23505") {
        return reply
          .status(409)
          .send({ error: "That prompt slug is already in use for this publisher" });
      }
      throw error;
    }
  });

  app.patch<{ Params: { publisher: string; slug: string } }>(
    "/v1/prompts/:publisher/:slug",
    async (request, reply) => {
      const user = await requireCurrentUser(options.accountAuth, request, reply);
      if (!user || !options.accountAuth) return;

      const existing = await findPublicPrompt(
        options.accountAuth.pool,
        request.params.publisher.toLowerCase(),
        request.params.slug.toLowerCase(),
      );
      if (!existing) return reply.status(404).send({ error: "Prompt not found" });

      const editableOrgIds = await listEditableOrgIds(options.accountAuth.pool, user.id);
      if (!userCanEditPrompt(user.id, existing, editableOrgIds)) {
        return reply.status(403).send({ error: "You cannot edit this prompt" });
      }

      const parsed = await parsePromptMultipart(request);
      if (parsed.error) return reply.status(parsed.error.status).send({ error: parsed.error.error });
      const { rawData, sampleImage } = parsed;

      let input: PromptInput;
      try {
        input = validatePromptInput(JSON.parse(rawData || "{}"));
      } catch (error) {
        return reply
          .status(400)
          .send({ error: error instanceof Error ? error.message : "Invalid prompt" });
      }

      const keepsImage = Boolean(existing.sample_image_blob_path) && !sampleImage;
      const imageOutput = input.outputTypes.includes("image");
      try {
        if (imageOutput) {
          validatePromptSampleImage(input.outputTypes, {
            present: Boolean(sampleImage) || keepsImage,
            alt: input.sampleImageAlt || (keepsImage ? existing.sample_image_alt ?? "" : ""),
          });
        }
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Invalid sample image",
        });
      }

      const previousBlobPath = existing.sample_image_blob_path;
      let nextBlobPath = previousBlobPath;
      let nextContentType = existing.sample_image_content_type;
      let nextAlt = input.sampleImageAlt || null;
      let uploadedBlobPath: string | null = null;

      if (!imageOutput) {
        nextBlobPath = null;
        nextContentType = null;
        nextAlt = null;
      } else if (sampleImage) {
        uploadedBlobPath = `prompts/${existing.id}/sample.${sampleImage.extension}`;
        nextBlobPath = uploadedBlobPath;
        nextContentType = sampleImage.contentType;
        await options.storage.put(uploadedBlobPath, sampleImage.data);
      } else {
        nextAlt = input.sampleImageAlt || existing.sample_image_alt;
      }

      try {
        await options.accountAuth.pool.query(
          `UPDATE prompts SET
             slug = $2,
             title = $3,
             summary = $4,
             prompt_text = $5,
             category = $6,
             tags = $7::jsonb,
             input_types = $8::jsonb,
             output_types = $9::jsonb,
             tested_models = $10::jsonb,
             effort = $11,
             variables = $12::jsonb,
             example_input = $13,
             example_output = $14,
             usage_notes = $15,
             language = $16,
             source_url = $17,
             license = $18,
             sample_image_blob_path = $19,
             sample_image_content_type = $20,
             sample_image_alt = $21,
             updated_at = NOW()
           WHERE id = $1`,
          [
            existing.id,
            input.slug,
            input.title,
            input.summary,
            input.promptText,
            input.category,
            JSON.stringify(input.tags),
            JSON.stringify(input.inputTypes),
            JSON.stringify(input.outputTypes),
            JSON.stringify(input.testedModels),
            input.effort,
            JSON.stringify(input.variables ?? []),
            input.exampleInput || null,
            input.exampleOutput || null,
            input.usageNotes || null,
            input.language,
            input.sourceUrl || null,
            input.license,
            nextBlobPath,
            nextContentType,
            nextAlt,
          ],
        );
      } catch (error) {
        if (uploadedBlobPath) {
          await options.storage.delete(uploadedBlobPath).catch(() => undefined);
        }
        const pgError = error as { code?: string };
        if (pgError.code === "23505") {
          return reply
            .status(409)
            .send({ error: "That prompt slug is already in use for this publisher" });
        }
        throw error;
      }

      if (
        previousBlobPath &&
        previousBlobPath !== nextBlobPath
      ) {
        await options.storage.delete(previousBlobPath).catch(() => undefined);
      }

      const publisherScopeValue = publisherScope(existing);
      const hydrated = await findPublicPrompt(
        options.accountAuth.pool,
        publisherScopeValue,
        input.slug!,
      );
      if (!hydrated) throw new Error("Updated prompt could not be loaded");
      const detail = serializeDetail(hydrated, { canEdit: true });
      const urls = [promptPublicUrl(detail.publisher.scope, detail.slug)];
      if (existing.slug !== detail.slug) {
        urls.push(promptPublicUrl(publisherScopeValue, existing.slug));
      }
      queueSearchNotification(urls, request.log);
      return detail;
    },
  );

  app.get<{ Params: { publisher: string; slug: string } }>(
    "/v1/prompts/:publisher/:slug",
    async (request, reply) => {
      if (!options.accountAuth)
        return reply.status(503).send({ error: "Prompt directory is not configured" });
      const row = await findPublicPrompt(
        options.accountAuth.pool,
        request.params.publisher.toLowerCase(),
        request.params.slug.toLowerCase(),
      );
      if (!row) return reply.status(404).send({ error: "Prompt not found" });
      const user = await getCurrentUser(options.accountAuth, request);
      const editableOrgIds = user
        ? await listEditableOrgIds(options.accountAuth.pool, user.id)
        : new Set<string>();
      return serializeDetail(row, {
        canEdit: userCanEditPrompt(user?.id, row, editableOrgIds),
      });
    },
  );

  app.get<{ Params: { publisher: string; slug: string } }>(
    "/v1/prompts/:publisher/:slug/sample-image",
    async (request, reply) => {
      if (!options.accountAuth)
        return reply.status(404).send({ error: "Sample image not found" });
      const row = await findPublicPrompt(
        options.accountAuth.pool,
        request.params.publisher.toLowerCase(),
        request.params.slug.toLowerCase(),
      );
      if (!row?.sample_image_blob_path || !row.sample_image_content_type) {
        return reply.status(404).send({ error: "Sample image not found" });
      }
      const image = await options.storage.get(row.sample_image_blob_path);
      reply.header("Content-Type", row.sample_image_content_type);
      reply.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      return reply.send(image);
    },
  );

  app.post<{ Params: { publisher: string; slug: string } }>(
    "/v1/prompts/:publisher/:slug/copy",
    async (request, reply) => {
      if (!options.accountAuth)
        return reply.status(404).send({ error: "Prompt not found" });
      const row = await findPublicPrompt(
        options.accountAuth.pool,
        request.params.publisher.toLowerCase(),
        request.params.slug.toLowerCase(),
      );
      if (!row) return reply.status(404).send({ error: "Prompt not found" });
      const result = await options.accountAuth.pool.query<{ copy_count: string }>(
        `UPDATE prompts SET copy_count = copy_count + 1 WHERE id = $1 RETURNING copy_count`,
        [row.id],
      );
      return { copyCount: Number(result.rows[0]?.copy_count ?? row.copy_count) };
    },
  );
}
