import { z } from "zod";
import { SCOPE_NAME_REGEX } from "./scope-name.js";

export const AiToolSchema = z.enum(["cursor", "claude", "codex", "*"]);
export type AiTool = z.infer<typeof AiToolSchema>;

/** Concrete tools supported by adapters (excludes wildcard "*"). */
export const ALL_TOOLS = ["cursor", "claude", "codex"] as const satisfies ReadonlyArray<
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

const unsafePathMessage = "path must be relative and must not contain .. segments";

function isSafeRelativePath(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("\\") || /^[A-Za-z]:/.test(trimmed)) {
    return false;
  }
  const normalized = trimmed.replace(/\\/g, "/");
  return normalized
    .split("/")
    .filter(Boolean)
    .every((segment) => segment !== "." && segment !== "..");
}

function basename(value: string): string {
  const parts = value.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? value;
}

const InstallPathSchema = z.string().trim().min(1).refine(isSafeRelativePath, unsafePathMessage);

export const InstallOverwriteSchema = z.enum(["fail", "skip", "replace"]);
export type InstallOverwrite = z.infer<typeof InstallOverwriteSchema>;

export const PackageInstallSchema = z
  .object({
    mainFiles: z
      .array(
        z.object({
          from: InstallPathSchema,
          to: InstallPathSchema,
          overwrite: InstallOverwriteSchema.optional(),
        }),
      )
      .optional(),
    helperFiles: z
      .array(
        z.object({
          from: InstallPathSchema,
          to: InstallPathSchema.optional(),
        }),
      )
      .optional(),
    postInstall: z
      .object({
        mode: z.literal("manual_prompt"),
        promptFile: InstallPathSchema,
        cleanup: z.enum(["manual", "after_user_confirmation"]).optional(),
      })
      .optional(),
  })
  .superRefine((install, ctx) => {
    if (!install.postInstall) return;
    const helperTargets = new Set(
      (install.helperFiles ?? []).map((file) => file.to ?? basename(file.from)),
    );
    if (!helperTargets.has(install.postInstall.promptFile)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postInstall", "promptFile"],
        message: "postInstall.promptFile must point to an installed helper file",
      });
    }
  });
export type PackageInstall = z.infer<typeof PackageInstallSchema>;

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
  agentDescription: z.string().trim().min(1).max(12000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  categories: z.array(z.string().trim().min(1).max(40)).max(4).optional(),
  sourceUrl: z.string().trim().url().max(500).optional(),
  examples: z.array(PackageExampleSchema).max(5).optional(),
  releaseNotes: z.string().trim().min(1).max(2000).optional(),
  install: PackageInstallSchema.optional(),
});

export type PackageManifest = z.infer<typeof PackageManifestSchema>;
export type PackageExample = z.infer<typeof PackageExampleSchema>;
