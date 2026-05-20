import { z } from "zod";
import { SCOPE_NAME_REGEX } from "./scope-name.js";

export const AiToolSchema = z.enum(["cursor", "claude"]);
export type AiTool = z.infer<typeof AiToolSchema>;

export const PackageManifestSchema = z.object({
  schemaVersion: z.literal("0.1"),
  name: z.string().regex(SCOPE_NAME_REGEX, "name must be @scope/name"),
  version: z.string().min(1),
  type: z.literal("skill"),
  description: z.string().min(1),
  entry: z.string().min(1),
  targets: z.array(AiToolSchema).min(1),
  license: z.string().optional(),
});

export type PackageManifest = z.infer<typeof PackageManifestSchema>;
