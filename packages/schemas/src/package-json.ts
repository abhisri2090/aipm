import { z } from "zod";
import { SCOPE_NAME_REGEX } from "./scope-name.js";
import { AiToolSchema } from "./manifest.js";

const scopedPackageKey = z.string().regex(SCOPE_NAME_REGEX);
const promptAliasKey = z.string().trim().min(1).max(120);

export const ProjectPackageJsonSchema = z.object({
  schemaVersion: z.literal("0.1"),
  registry: z.string().url(),
  preferredTools: z.array(AiToolSchema).optional(),
  packages: z.record(scopedPackageKey, z.string().min(1)),
  prompts: z.record(promptAliasKey, z.string().url()).default({}),
});

export type ProjectPackageJson = z.infer<typeof ProjectPackageJsonSchema>;
