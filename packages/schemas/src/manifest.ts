import { z } from "zod";
import { SCOPE_NAME_REGEX } from "./scope-name.js";

export const AiToolSchema = z.enum(["cursor", "claude", "*"]);
export type AiTool = z.infer<typeof AiToolSchema>;

/** Concrete tools supported by adapters (excludes wildcard "*"). */
export const ALL_TOOLS = ["cursor", "claude"] as const satisfies ReadonlyArray<
  Exclude<AiTool, "*">
>;
export type ConcreteAiTool = (typeof ALL_TOOLS)[number];

export function expandTargets(targets: AiTool[]): ConcreteAiTool[] {
  if (targets.includes("*")) return [...ALL_TOOLS];
  return targets.filter((t): t is ConcreteAiTool => t !== "*");
}

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
