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

export const PackageExampleSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(240).optional(),
  prompt: z.string().trim().min(1).max(1000),
});

export const PackageManifestSchema = z.object({
  schemaVersion: z.literal("0.1"),
  name: z.string().regex(SCOPE_NAME_REGEX, "name must be @scope/name"),
  version: z.string().min(1),
  type: z.literal("skill"),
  description: z.string().trim().min(1).max(240),
  entry: z.string().min(1),
  targets: z.array(AiToolSchema).min(1),
  license: z.string().optional(),
  usage: z.string().trim().min(1).max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  categories: z.array(z.string().trim().min(1).max(40)).max(4).optional(),
  sourceUrl: z.string().trim().url().max(500).optional(),
  examples: z.array(PackageExampleSchema).max(5).optional(),
  releaseNotes: z.string().trim().min(1).max(2000).optional(),
});

export type PackageManifest = z.infer<typeof PackageManifestSchema>;
export type PackageExample = z.infer<typeof PackageExampleSchema>;
