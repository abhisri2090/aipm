import { z } from "zod";
import { SCOPE_NAME_REGEX } from "./scope-name.js";
import { AiToolSchema } from "./manifest.js";

const scopedPackageKey = z.string().regex(SCOPE_NAME_REGEX);

export const ProjectPackageJsonSchema = z.object({
  schemaVersion: z.literal("0.1"),
  registry: z.string().url(),
  preferredTools: z.array(AiToolSchema).optional(),
  packages: z.record(scopedPackageKey, z.string().min(1)),
});

export type ProjectPackageJson = z.infer<typeof ProjectPackageJsonSchema>;
