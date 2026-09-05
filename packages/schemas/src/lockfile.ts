import { z } from "zod";
import { SCOPE_NAME_REGEX } from "./scope-name.js";
import { AiToolSchema } from "./manifest.js";

const scopedPackageKey = z.string().regex(SCOPE_NAME_REGEX);

const InstalledPathsSchema = z.record(AiToolSchema, z.array(z.string()));

export const LockfilePromptEntrySchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1),
  slug: z.string().min(1),
  contentHash: z.string().min(1),
  updatedAt: z.string().min(1),
  installedPath: z.string().min(1),
});
export type LockfilePromptEntry = z.infer<typeof LockfilePromptEntrySchema>;

export const LockfilePackageEntrySchema = z.object({
  version: z.string(),
  integrity: z.string(),
  registry: z.string().url(),
  resolvedTools: z.array(AiToolSchema),
  installed: InstalledPathsSchema,
  installedAssets: z
    .object({
      main: z.array(z.string()),
      helper: z.array(z.string()),
    })
    .optional(),
  postInstall: z
    .object({
      mode: z.literal("manual_prompt"),
      status: z.enum(["pending", "cleaned"]),
      promptFile: z.string(),
      cleanup: z.enum(["manual", "after_user_confirmation"]),
    })
    .optional(),
});

export const LockfileSchema = z.object({
  schemaVersion: z.literal("0.1"),
  packages: z.record(scopedPackageKey, LockfilePackageEntrySchema),
  prompts: z.record(z.string().min(1), LockfilePromptEntrySchema).default({}),
});

export type Lockfile = z.infer<typeof LockfileSchema>;
export type LockfilePackageEntry = z.infer<typeof LockfilePackageEntrySchema>;
