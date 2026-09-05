import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import type { Lockfile, LockfilePromptEntry, ProjectPackageJson } from "@aipm-registry/schemas";
import {
  fetchPromptDetail,
  recordPromptCopy,
  type RegistryPromptDetail,
} from "./registry-client.js";
import {
  readLockfile,
  upsertPromptLockEntry,
  writeLockfile,
  writeProjectPackageJson,
} from "./project-files.js";

const PROMPT_SITE_ORIGIN = "https://www.aipm-registry.com";

export type PromptReference = {
  url: string;
  publisher: string;
  slug: string;
  alias: string;
};

export function parsePromptUrl(value: string): PromptReference | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.origin !== PROMPT_SITE_ORIGIN) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "prompts") return null;
  const publisher = decodeURIComponent(parts[1] ?? "").trim().toLowerCase();
  const slug = decodeURIComponent(parts[2] ?? "").trim().toLowerCase();
  if (!publisher || !slug || !/^[a-z0-9][a-z0-9-]*$/.test(publisher) || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return null;
  }
  return {
    url: `${PROMPT_SITE_ORIGIN}/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`,
    publisher,
    slug,
    alias: slug,
  };
}

function promptDirectory(configRoot: string): string {
  return basename(configRoot) === ".aipm"
    ? join(configRoot, "prompts")
    : join(configRoot, ".aipm", "prompts");
}

export function promptSnapshotPath(configRoot: string, reference: PromptReference): string {
  return join(promptDirectory(configRoot), `${reference.publisher}--${reference.slug}.md`);
}

function canonicalPromptContent(prompt: RegistryPromptDetail): string {
  return JSON.stringify({
    promptText: prompt.promptText,
    variables: prompt.variables,
    exampleInput: prompt.exampleInput,
    exampleOutput: prompt.exampleOutput,
    usageNotes: prompt.usageNotes,
    license: prompt.license,
  });
}

export function promptContentHash(prompt: RegistryPromptDetail): string {
  return createHash("sha256").update(canonicalPromptContent(prompt)).digest("hex");
}

function section(title: string, value: string | null | undefined): string {
  return value?.trim() ? `\n## ${title}\n\n${value.trim()}\n` : "";
}

export function renderPromptMarkdown(prompt: RegistryPromptDetail, sourceUrl: string): string {
  const variables = prompt.variables.length
    ? `\n## Variables\n\n${prompt.variables
        .map(
          (variable) =>
            `- \`{{${variable.name}}}\`${variable.required ? " — required" : " — optional"}: ${variable.description}${variable.example ? ` Example: ${variable.example}` : ""}`,
        )
        .join("\n")}\n`
    : "";
  const publisher = prompt.publisher.org?.name ?? prompt.publisher.user.name ?? `@${prompt.publisher.scope}`;
  return [
    `# ${prompt.title}`,
    "",
    prompt.summary,
    "",
    `- Source: ${sourceUrl}`,
    `- Publisher: ${publisher} (@${prompt.publisher.scope})`,
    `- Category: ${prompt.category}`,
    `- Inputs: ${prompt.inputTypes.join(", ") || "none"}`,
    `- Outputs: ${prompt.outputTypes.join(", ") || "none"}`,
    `- Effort: ${prompt.effort}`,
    `- Language: ${prompt.language}`,
    `- License: ${prompt.license}`,
    `- Updated: ${prompt.updatedAt}`,
    "",
    "## Prompt",
    "",
    prompt.promptText.trim(),
    variables,
    section("Example input", prompt.exampleInput),
    section("Example output", prompt.exampleOutput),
    section("Usage notes", prompt.usageNotes),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd()
    .concat("\n");
}

function emptyLock(): Lockfile {
  return { schemaVersion: "0.1", packages: {}, prompts: {} };
}

function installedRelativePath(configRoot: string, absolutePath: string): string {
  return relative(configRoot, absolutePath).split("\\").join("/");
}

export async function installTrackedPrompt(input: {
  configRoot: string;
  registry: string;
  project: ProjectPackageJson;
  reference: PromptReference;
  track: boolean;
  recordCopy?: boolean;
  updateOnly?: boolean;
}): Promise<{ changed: boolean; path: string; prompt: RegistryPromptDetail }> {
  const prompt = await fetchPromptDetail(
    input.registry,
    input.reference.publisher,
    input.reference.slug,
  );
  const canonicalReference: PromptReference = {
    ...input.reference,
    publisher: prompt.publisher.scope,
    slug: prompt.slug,
    url: `${PROMPT_SITE_ORIGIN}/prompts/${encodeURIComponent(prompt.publisher.scope)}/${encodeURIComponent(prompt.slug)}`,
  };
  const outputPath = promptSnapshotPath(input.configRoot, canonicalReference);
  const contentHash = promptContentHash(prompt);
  const lock = (await readLockfile(input.configRoot)) ?? emptyLock();
  const existing = lock.prompts[input.reference.alias];
  const fileExists = Boolean(await stat(outputPath).catch(() => null));
  const changed = !existing || existing.contentHash !== contentHash || !fileExists;

  if (!input.updateOnly || changed) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, renderPromptMarkdown(prompt, canonicalReference.url), "utf8");
  }

  if (input.track) {
    const currentUrl = input.project.prompts[input.reference.alias];
    if (currentUrl && currentUrl !== canonicalReference.url) {
      throw new Error(
        `Prompt alias "${input.reference.alias}" already tracks ${currentUrl}. Remove it first or use a unique slug.`,
      );
    }
    await writeProjectPackageJson(input.configRoot, {
      ...input.project,
      prompts: { ...input.project.prompts, [input.reference.alias]: canonicalReference.url },
    });
  }

  const entry: LockfilePromptEntry = {
    id: prompt.id,
    url: canonicalReference.url,
    publisher: canonicalReference.publisher,
    slug: canonicalReference.slug,
    contentHash,
    updatedAt: prompt.updatedAt,
    installedPath: installedRelativePath(input.configRoot, outputPath),
  };
  await writeLockfile(input.configRoot, upsertPromptLockEntry(lock, input.reference.alias, entry));

  if (input.recordCopy) {
    await recordPromptCopy(input.registry, canonicalReference.publisher, canonicalReference.slug).catch(
      () => undefined,
    );
  }
  return { changed, path: outputPath, prompt };
}

export function resolveTrackedPrompt(
  project: ProjectPackageJson,
  value: string,
): PromptReference | null {
  const direct = parsePromptUrl(value);
  if (direct) {
    const match = Object.entries(project.prompts).find(([, url]) => url === direct.url);
    return match ? { ...direct, alias: match[0] } : direct;
  }
  const url = project.prompts[value];
  const parsed = url ? parsePromptUrl(url) : null;
  return parsed ? { ...parsed, alias: value } : null;
}

export async function readInstalledPrompt(configRoot: string, entry: LockfilePromptEntry): Promise<string> {
  return readFile(join(configRoot, entry.installedPath), "utf8");
}

export async function removeTrackedPrompt(input: {
  configRoot: string;
  project: ProjectPackageJson;
  reference: PromptReference;
}): Promise<void> {
  const lock = await readLockfile(input.configRoot);
  const entry = lock?.prompts[input.reference.alias];
  if (entry) await rm(join(input.configRoot, entry.installedPath), { force: true });

  const prompts = { ...input.project.prompts };
  delete prompts[input.reference.alias];
  await writeProjectPackageJson(input.configRoot, { ...input.project, prompts });
  if (lock) {
    const lockedPrompts = { ...lock.prompts };
    delete lockedPrompts[input.reference.alias];
    await writeLockfile(input.configRoot, { ...lock, prompts: lockedPrompts });
  }
}
