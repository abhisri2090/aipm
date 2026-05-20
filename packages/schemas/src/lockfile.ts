import { z } from "zod";
import { SCOPE_NAME_REGEX } from "./scope-name.js";
import { AiToolSchema } from "./manifest.js";

const scopedPackageKey = z.string().regex(SCOPE_NAME_REGEX);

const InstalledPathsSchema = z.record(AiToolSchema, z.array(z.string()));

export const LockfilePackageEntrySchema = z.object({
  version: z.string(),
  integrity: z.string(),
  registry: z.string().url(),
  resolvedTools: z.array(AiToolSchema),
  installed: InstalledPathsSchema,
});

export const LockfileSchema = z.object({
  schemaVersion: z.literal("0.1"),
  packages: z.record(scopedPackageKey, LockfilePackageEntrySchema),
});

export type Lockfile = z.infer<typeof LockfileSchema>;
export type LockfilePackageEntry = z.infer<typeof LockfilePackageEntrySchema>;
