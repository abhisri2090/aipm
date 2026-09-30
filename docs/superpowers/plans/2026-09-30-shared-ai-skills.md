# Shared .ai skill install Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a project has two or more AI tool folders, let the user install a skill once under `.ai/skills/<skill>/` and point every detected tool at that folder with a relative shortcut.

**Architecture:** Tool adapters keep writing a full copy into one tool folder. A new engine function writes the canonical skill under `.ai/skills/<skill>/` and creates a directory symlink in each detected tool's skill folder. The CLI chooses that layout only from an interactive menu (2+ tool folders, no flag) or from `--shared`. The lockfile records the canonical files and each symlink so update and remove stay accurate.

**Tech Stack:** Node.js >= 20, TypeScript, Vitest, existing zero-dep CLI `selectPrompt`, Zod lockfile schema.

## Global Constraints

- Menu appears only when the project has 2 or more of `.cursor`, `.claude`, `.codex`.
- Picking one tool writes a full copy in that tool folder, same as today. It does not also write `.ai`.
- Picking `.ai` writes real files to `.ai/skills/<skill>/SKILL.md` (plus supporting files) and a relative directory symlink in every detected tool the package allows.
- Cursor link: `.cursor/skills/<skill>`. Claude link: `.claude/skills/<skill>`. Codex link: `.agents/skills/<skill>` (detection folder stays `.codex`).
- `--target cursor|claude|codex|*` stays a single-tool (or all-tools full copy) install. `--shared` selects the `.ai` layout. Passing both is an error.
- `--ci` with 2+ tool folders and neither `--target` nor `--shared` fails. It must not guess.
- One tool folder, and no flags, keeps today's install. No menu.
- `--shared` still works when only one tool folder exists: canonical files plus that one shortcut.
- Shortcuts are relative symlinks (`symlink(relativePath, linkPath, "dir")`). On `EPERM`, tell the user Windows needs Developer Mode or an admin shell. Do not fall back to a copy.
- If a tool skill path already exists and is not a symlink, fail. Do not overwrite a real skill folder with a link.
- Remove unlinks symlinks. It must not delete the canonical folder by following the link.
- No new runtime dependencies.

---

### Task 1: Canonical skill directory and tool shortcuts

**Files:**
- Create: `packages/engine/src/install-shared.ts`
- Create: `packages/engine/src/install-shared.test.ts`
- Modify: `packages/engine/src/index.ts`

**Interfaces:**
- Consumes: `writeSkillDirectory` from `@aipm-registry/adapter-sdk`, `shortNameFromScopeName` and `ConcreteAiTool` from `@aipm-registry/schemas`
- Produces:
  - `toolSkillDir(projectRoot: string, tool: ConcreteAiTool, short: string): string`
  - `sharedSkillDir(projectRoot: string, short: string): string`
  - `installSharedSkill(input: InstallSharedSkillInput): Promise<InstallSharedSkillResult>`

- [ ] **Step 1: Write the failing test**

```ts
import { lstat, mkdtemp, readFile, readlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installSharedSkill } from "./install-shared.js";

describe("installSharedSkill", () => {
  it("writes .ai/skills/<skill>/SKILL.md and relative dir links for each tool", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-shared-"));
    const result = await installSharedSkill({
      projectRoot: root,
      packageName: "@team/review-helper",
      tools: ["cursor", "claude", "codex"],
      skillMarkdown: "# hello\n",
      supportingFiles: [{ path: "references/guide.md", content: Buffer.from("# Guide\n") }],
    });

    const canonical = join(root, ".ai", "skills", "review-helper", "SKILL.md");
    const guide = join(root, ".ai", "skills", "review-helper", "references", "guide.md");
    expect(await readFile(canonical, "utf8")).toBe("# hello\n");
    expect(await readFile(guide, "utf8")).toBe("# Guide\n");
    expect(result.files).toEqual([canonical, guide]);

    for (const link of [
      join(root, ".cursor", "skills", "review-helper"),
      join(root, ".claude", "skills", "review-helper"),
      join(root, ".agents", "skills", "review-helper"),
    ]) {
      const info = await lstat(link);
      expect(info.isSymbolicLink()).toBe(true);
      expect(await readlink(link)).toBe("../../../.ai/skills/review-helper");
      expect(result.links).toContain(link);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aipm-registry/engine exec vitest run src/install-shared.test.ts`

Expected: FAIL with `Cannot find module './install-shared.js'`

- [ ] **Step 3: Write the implementation**

`packages/engine/src/install-shared.ts`:

```ts
import { lstat, mkdir, symlink, unlink } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { writeSkillDirectory, type SkillSupportingFile } from "@aipm-registry/adapter-sdk";
import { shortNameFromScopeName, type ConcreteAiTool } from "@aipm-registry/schemas";

export interface InstallSharedSkillInput {
  projectRoot: string;
  packageName: string;
  tools: readonly ConcreteAiTool[];
  skillMarkdown: string;
  supportingFiles?: SkillSupportingFile[];
}

export interface InstallSharedSkillResult {
  short: string;
  root: string;
  files: string[];
  links: Partial<Record<ConcreteAiTool, string>>;
}

export function sharedSkillDir(projectRoot: string, short: string): string {
  return join(projectRoot, ".ai", "skills", short);
}

export function toolSkillDir(projectRoot: string, tool: ConcreteAiTool, short: string): string {
  if (tool === "cursor") return join(projectRoot, ".cursor", "skills", short);
  if (tool === "claude") return join(projectRoot, ".claude", "skills", short);
  return join(projectRoot, ".agents", "skills", short);
}

async function linkSkillDir(linkPath: string, canonicalDir: string): Promise<void> {
  await mkdir(dirname(linkPath), { recursive: true });
  const existing = await lstat(linkPath).catch(() => null);
  if (existing?.isSymbolicLink()) await unlink(linkPath);
  else if (existing) {
    throw new Error(`${linkPath} already exists and is not a shortcut. Remove it or install with --target.`);
  }
  try {
    await symlink(relative(dirname(linkPath), canonicalDir), linkPath, "dir");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EPERM") {
      throw new Error(
        `Could not create a shortcut at ${linkPath}. On Windows, turn on Developer Mode or run an admin shell, then retry.`,
      );
    }
    throw error;
  }
}

export async function installSharedSkill(input: InstallSharedSkillInput): Promise<InstallSharedSkillResult> {
  if (input.tools.length === 0) {
    throw new Error("No AI tool folder found to link. Add .cursor, .claude, or .codex, or pass --target.");
  }
  const short = shortNameFromScopeName(input.packageName);
  const root = sharedSkillDir(input.projectRoot, short);
  const written = await writeSkillDirectory(root, {
    skillMarkdown: input.skillMarkdown,
    supportingFiles: input.supportingFiles,
  });
  const links: Partial<Record<ConcreteAiTool, string>> = {};
  for (const tool of input.tools) {
    const linkPath = toolSkillDir(input.projectRoot, tool, short);
    await linkSkillDir(linkPath, root);
    links[tool] = linkPath;
  }
  return { short, root, files: written.writtenPaths, links };
}
```

Export it from `packages/engine/src/index.ts`:

```ts
export * from "./detect-tools.js";
export * from "./install-skill.js";
export * from "./install-shared.js";
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @aipm-registry/engine exec vitest run src/install-shared.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/install-shared.ts packages/engine/src/install-shared.test.ts packages/engine/src/index.ts
git commit -m "Add a shared .ai skill install with tool shortcuts."
```

---

### Task 2: Record shared files in the lock and unlink shortcuts on remove

**Files:**
- Modify: `packages/schemas/src/lockfile.ts`
- Modify: `apps/cli/src/remove-package.ts`
- Modify: `apps/cli/src/remove-package.test.ts`

**Interfaces:**
- Consumes: `LockfilePackageEntry`
- Produces: optional `entry.shared?: { root: string; files: string[] }`. `trackedInstalledPackagePaths` includes `shared.files`. `removeInstalledPackageFiles` unlinks a symlink instead of following it.

- [ ] **Step 1: Write the failing test**

Add to `apps/cli/src/remove-package.test.ts`:

```ts
it("unlinks a tool shortcut and deletes the canonical .ai files", async () => {
  const root = await mkdtemp(join(tmpdir(), "aipm-rm-shared-"));
  const canonical = join(root, ".ai", "skills", "review-helper");
  const skill = join(canonical, "SKILL.md");
  const link = join(root, ".cursor", "skills", "review-helper");
  await mkdir(canonical, { recursive: true });
  await mkdir(dirname(link), { recursive: true });
  await writeFile(skill, "# hello\n");
  await symlink(relative(dirname(link), canonical), link, "dir");

  const result = await removeInstalledPackageFiles({
    configRoot: root,
    installRoot: root,
    entry: entry([link], [], {
      shared: { root: canonical, files: [skill] },
    }),
  });

  expect(result.removed).toBe(2);
  await expect(lstat(link)).rejects.toThrow();
  await expect(stat(skill)).rejects.toThrow();
});
```

Extend the local `entry()` helper in that file so the third argument can set `shared`. Import `dirname`, `lstat`, `symlink`, and `relative` if they are not already imported. The existing helper returns a `LockfilePackageEntry`; add `shared` onto that object when passed.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aipm-registry/cli exec vitest run src/remove-package.test.ts`

Expected: FAIL because `shared` is not on the lock entry type, or because `rm` follows the directory symlink and the assertion on `removed` does not match.

- [ ] **Step 3: Write the implementation**

In `packages/schemas/src/lockfile.ts`, add this field to `LockfilePackageEntrySchema` after `installed`:

```ts
shared: z
  .object({
    root: z.string().min(1),
    files: z.array(z.string()),
  })
  .optional(),
```

In `trackedInstalledPackagePaths`:

```ts
export function trackedInstalledPackagePaths(entry: LockfilePackageEntry): string[] {
  return [
    ...Object.values(entry.installed).flat(),
    ...(entry.shared?.files ?? []),
    ...(entry.installedAssets?.main ?? []),
    ...(entry.installedAssets?.helper ?? []),
  ];
}
```

In `removeInstalledPackageFiles`, replace the two loops that stat and delete with:

```ts
const symlinkPaths: string[] = [];
const realPaths: string[] = [];
for (const path of paths) {
  const stat = await lstat(path).catch(() => null);
  if (!stat) continue;
  if (stat.isSymbolicLink()) symlinkPaths.push(path);
  else realPaths.push(path);
}

for (const path of realPaths) {
  const canonicalPath = await realpath(path);
  if (!realRoots.some((root) => within(root, canonicalPath))) {
    throw new Error(`Refusing to remove a path that resolves outside the install roots: ${path}`);
  }
}

let removed = 0;
for (const path of symlinkPaths) {
  await unlink(path);
  removed += 1;
}
for (const path of realPaths) {
  await rm(path, { force: true });
  removed += 1;
}
for (const path of [...symlinkPaths, ...realPaths].sort((a, b) => b.length - a.length)) {
  await pruneEmptyParents(path, roots);
}
```

Import `unlink` from `node:fs/promises`. Keep the existing "outside the install roots" check on the path string before this split. A symlink is removed with `unlink` only, so the canonical directory is not deleted through the link.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @aipm-registry/schemas exec tsc -p tsconfig.json --noEmit && pnpm --filter @aipm-registry/cli exec vitest run src/remove-package.test.ts`

Expected: PASS, including the existing symlink-escape test.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/src/lockfile.ts apps/cli/src/remove-package.ts apps/cli/src/remove-package.test.ts
git commit -m "Track shared skill files and unlink shortcuts on remove."
```

---

### Task 3: Choose a tool copy or the shared layout

**Files:**
- Create: `apps/cli/src/install-layout.ts`
- Create: `apps/cli/src/install-layout.test.ts`
- Modify: `apps/cli/src/prompt.ts`

**Interfaces:**
- Consumes: `detectToolsInProject` from `@aipm-registry/engine`, `selectPrompt`
- Produces:

```ts
export type InstallLayout =
  | { mode: "copy"; tool: ConcreteAiTool }
  | { mode: "shared"; tools: ConcreteAiTool[] };

export async function resolveInstallLayout(input: {
  projectRoot: string;
  manifest: PackageManifest;
  explicitTarget?: AiTool;
  shared?: boolean;
  ci?: boolean;
}): Promise<InstallLayout | { mode: "default" }>;
```

`mode: "default"` means the caller keeps today's `installSkillPackage` resolution (one folder, preferred tools, or the existing tool prompt).

- [ ] **Step 1: Write the failing tests**

```ts
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { PackageManifest } from "@aipm-registry/schemas";
import { resolveInstallLayout } from "./install-layout.js";

const manifest: PackageManifest = {
  schemaVersion: "0.1",
  name: "@team/review-helper",
  version: "1.0.0",
  type: "skill",
  description: "test",
  entry: "SKILL.md",
  targets: ["cursor", "claude", "codex"],
};

async function projectWith(...folders: string[]) {
  const root = await mkdtemp(join(tmpdir(), "aipm-layout-"));
  for (const folder of folders) await mkdir(join(root, folder));
  return root;
}

describe("resolveInstallLayout", () => {
  it("fails in CI when several tool folders exist and no flag was passed", async () => {
    const root = await projectWith(".cursor", ".claude");
    await expect(resolveInstallLayout({
      projectRoot: root,
      manifest,
      ci: true,
    })).rejects.toThrow(/Pass --target or --shared/);
  });

  it("uses --shared for every detected tool the package allows", async () => {
    const root = await projectWith(".cursor", ".codex");
    await expect(resolveInstallLayout({
      projectRoot: root,
      manifest,
      shared: true,
    })).resolves.toEqual({ mode: "shared", tools: ["cursor", "codex"] });
  });

  it("rejects --shared together with --target", async () => {
    const root = await projectWith(".cursor", ".claude");
    await expect(resolveInstallLayout({
      projectRoot: root,
      manifest,
      shared: true,
      explicitTarget: "cursor",
    })).rejects.toThrow(/--shared cannot be combined with --target/);
  });

  it("does not ask when only one tool folder exists", async () => {
    const root = await projectWith(".cursor");
    await expect(resolveInstallLayout({
      projectRoot: root,
      manifest,
    })).resolves.toEqual({ mode: "default" });
  });
});
```

Mock `promptForInstallLayout` only in the interactive test:

```ts
vi.mock("./prompt.js", () => ({
  promptForInstallLayout: vi.fn(async () => ({ mode: "shared" as const })),
}));
```

Then assert a project with `.cursor` and `.claude` and no flags resolves to `{ mode: "shared", tools: ["cursor", "claude"] }` when the mock returns shared, and to `{ mode: "copy", tool: "cursor" }` when the mock returns `{ mode: "copy", tool: "cursor" }`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aipm-registry/cli exec vitest run src/install-layout.test.ts`

Expected: FAIL with `Cannot find module './install-layout.js'`

- [ ] **Step 3: Write the implementation**

`promptForInstallLayout` in `apps/cli/src/prompt.ts`:

```ts
export async function promptForInstallLayout(
  tools: readonly ConcreteAiTool[],
): Promise<{ mode: "copy"; tool: ConcreteAiTool } | { mode: "shared" }> {
  const choice = await selectPrompt<ConcreteAiTool | "shared">({
    message: "Where should this skill be installed?",
    options: [
      ...tools.map((tool) => ({
        value: tool,
        label: tool,
        hint:
          tool === "cursor"
            ? ".cursor/skills/<skill>/"
            : tool === "claude"
              ? ".claude/skills/<skill>/"
              : ".agents/skills/<skill>/",
      })),
      {
        value: "shared" as const,
        label: ".ai",
        hint: "scalable install: keep the skill in one place and let every tool use it",
      },
    ],
  });
  if (choice === "shared") return { mode: "shared" };
  return { mode: "copy", tool: choice };
}
```

`apps/cli/src/install-layout.ts`:

```ts
import { detectToolsInProject } from "@aipm-registry/engine";
import type { AiTool, ConcreteAiTool, PackageManifest } from "@aipm-registry/schemas";
import { promptForInstallLayout } from "./prompt.js";

export type InstallLayout =
  | { mode: "copy"; tool: ConcreteAiTool }
  | { mode: "shared"; tools: ConcreteAiTool[] }
  | { mode: "default" };

function allowed(manifest: PackageManifest, tool: ConcreteAiTool): boolean {
  return manifest.targets.includes("*") || manifest.targets.includes(tool);
}

export async function resolveInstallLayout(input: {
  projectRoot: string;
  manifest: PackageManifest;
  explicitTarget?: AiTool;
  shared?: boolean;
  ci?: boolean;
}): Promise<InstallLayout> {
  if (input.shared && input.explicitTarget) {
    throw new Error("--shared cannot be combined with --target.");
  }
  const detected = (await detectToolsInProject(input.projectRoot)).filter((tool) => allowed(input.manifest, tool));

  if (input.shared) {
    if (detected.length === 0) {
      throw new Error("No AI tool folder found to link. Add .cursor, .claude, or .codex, or pass --target.");
    }
    return { mode: "shared", tools: detected };
  }
  if (input.explicitTarget || detected.length < 2) return { mode: "default" };
  if (input.ci) {
    throw new Error(
      "Several AI tool folders found. Pass --target cursor|claude|codex or --shared.",
    );
  }
  const choice = await promptForInstallLayout(detected);
  if (choice.mode === "shared") return { mode: "shared", tools: detected };
  return { mode: "copy", tool: choice.tool };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @aipm-registry/cli exec vitest run src/install-layout.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/cli/src/install-layout.ts apps/cli/src/install-layout.test.ts apps/cli/src/prompt.ts
git commit -m "Ask where to install when several AI tool folders exist."
```

---

### Task 4: Install, update, and track the chosen layout

**Files:**
- Modify: `apps/cli/src/install-one.ts`
- Modify: `apps/cli/src/bin.ts` (`add`, `install`, `update` option lists and the calls into `installOnePackage`)
- Modify: `apps/cli/src/bin-command.test.ts`

**Interfaces:**
- Consumes: `resolveInstallLayout`, `installSharedSkill`, `installSkillPackage`
- Produces: `InstallOneOptions.shared?: boolean`. Lock entry `shared` is set only for the shared layout. `installed[tool]` for a shared install is the symlink path, not a copied `SKILL.md`.

- [ ] **Step 1: Write the failing CLI test**

In `apps/cli/src/bin-command.test.ts`, add a test that starts a registry the same way `add --no-init installs skills without package.json or lockfile` does, with `targets: ["cursor", "claude"]`. Create both `.cursor` and `.claude` in the project. Run:

```ts
await runCli(root, ["init", "--registry", registry, "--target", "cursor"]);
const add = await runCli(root, ["add", "@team/free-skill@1.0.0", "--shared", "--ci"]);
```

Assert:

- `add.stdout` contains `Installed @team/free-skill@1.0.0`
- `.ai/skills/free-skill/SKILL.md` contains the skill body
- `.cursor/skills/free-skill` and `.claude/skills/free-skill` are symlinks whose `readlink` is `../../../.ai/skills/free-skill`
- `aipm-lock.json` `packages["@team/free-skill"].shared.files` includes the `SKILL.md` path
- `installed.cursor` and `installed.claude` are the symlink paths
- `aipm remove @team/free-skill --ci` deletes the `SKILL.md` and both symlinks

Add a second assertion in the same test or a sibling test: `add` with `--ci` and no `--target` or `--shared`, with both folders present, rejects with `Pass --target or --shared`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aipm-registry/cli build && pnpm --filter @aipm-registry/cli exec vitest run src/bin-command.test.ts -t "shared"`

Expected: FAIL because `--shared` is an unknown option.

- [ ] **Step 3: Write the implementation**

Add `--shared` to `add`, `install`, and `update` in `apps/cli/src/bin.ts`:

```ts
.option("--shared", "Install the skill in .ai/skills and shortcut every detected tool")
```

Thread `shared: opts.shared` into every `installOnePackage` / `installOnePackageWithRecovery` call those commands make. Add `shared?: boolean` to `InstallOneOptions`.

Inside `installOnePackage`, after the manifest is fetched and before `installSkillPackage`:

```ts
const layout = await resolveInstallLayout({
  projectRoot: installRoot,
  manifest,
  explicitTarget,
  shared: options.shared,
  ci: options.ci,
});

let result: { resolvedTools: ConcreteAiTool[]; installed: LockfilePackageEntry["installed"]; shared?: LockfilePackageEntry["shared"] };

if (layout.mode === "shared") {
  const sharedResult = await installSharedSkill({
    projectRoot: installRoot,
    packageName: options.name,
    tools: layout.tools,
    skillMarkdown,
    supportingFiles,
  });
  result = {
    resolvedTools: layout.tools,
    installed: sharedResult.links,
    shared: { root: sharedResult.root, files: sharedResult.files },
  };
} else {
  const explicit = layout.mode === "copy" ? layout.tool : explicitTarget;
  const copied = await installSkillPackage({
    projectRoot: installRoot,
    manifest,
    skillMarkdown,
    supportingFiles,
    preferredTools,
    explicitTarget: explicit,
  });
  result = { resolvedTools: copied.resolvedTools, installed: copied.installed };
}
```

Move the existing tool prompt (`tools.length === 0` and `tools.length > 1`) so it runs only when `layout.mode === "default"`. When `layout.mode === "copy"`, skip that prompt and pass `layout.tool` as `explicitTarget`.

Write `shared: result.shared` on `nextEntry` only when it is defined. `removeReplacedInstallPaths` already deletes previous lock paths that the new install does not keep, so a later `--target` install removes the old `.ai` files and symlinks.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @aipm-registry/engine build && pnpm --filter @aipm-registry/schemas build && pnpm --filter @aipm-registry/cli build && pnpm --filter @aipm-registry/cli exec vitest run src/bin-command.test.ts -t "shared"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/cli/src/install-one.ts apps/cli/src/bin.ts apps/cli/src/bin-command.test.ts
git commit -m "Install shared skills with --shared and record them in the lockfile."
```

---

### Task 5: Remove an untracked shared install

**Files:**
- Modify: `apps/cli/src/no-init.ts`
- Modify: `apps/cli/src/no-init.test.ts`

**Interfaces:**
- Consumes: `sharedSkillDir` and `toolSkillDir` from `@aipm-registry/engine`
- Produces: `discoverUntrackedPackagePaths` includes `.ai/skills/<short>` ahead of the tool skill directories. `removeUntrackedPackage` already `rm`s each existing path. Change that delete so a symlink is `unlink`ed and a real directory is `rm`ed with `{ recursive: true }`. Unlink tool paths before the `.ai` directory.

- [ ] **Step 1: Write the failing test**

Extend the discover expectation in `apps/cli/src/no-init.test.ts` to include:

```ts
join(root, ".ai", "skills", "sample-skill"),
join(root, ".cursor", "skills", "sample-skill"),
```

The cursor path stays before the legacy `.cursor/aipm/skills/sample-skill.md` path. Add a remove test that creates `.ai/skills/sample-skill/SKILL.md` and a relative symlink at `.cursor/skills/sample-skill`, calls `removeUntrackedPackage`, and expects both the link and the `SKILL.md` to be gone while a second unrelated file under `.ai/skills/other/SKILL.md` remains.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aipm-registry/cli exec vitest run src/no-init.test.ts`

Expected: FAIL because `.ai/skills/sample-skill` is not in the discovered list.

- [ ] **Step 3: Write the implementation**

In `discoverUntrackedPackagePaths`, insert these paths after `short` is computed:

```ts
join(input.installRoot, ".ai", "skills", short),
join(input.installRoot, ".cursor", "skills", short),
```

Keep the legacy `.cursor/aipm/skills/<short>.md` path, the Claude directory, the Codex directory, and the helper slug.

In `removeUntrackedPackage`, partition existing candidates into symlinks and real paths. `unlink` every symlink first. Then `rm(path, { recursive: true, force: true })` the real paths. That order leaves the canonical files intact until their own path is removed, and it does not follow a tool shortcut into `.ai`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @aipm-registry/cli exec vitest run src/no-init.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/cli/src/no-init.ts apps/cli/src/no-init.test.ts
git commit -m "Remove untracked .ai skills and their tool shortcuts."
```

---

### Task 6: Document the shared install

**Files:**
- Modify: `apps/cli/README.md` (the install example near the `--target` lines)
- Modify: `apps/web/app/targets/page.tsx` (add a Shared row after the three tool rows)
- Modify: `apps/web/app/use/page.tsx` (one short paragraph after the target list)
- Modify: `apps/web/app/changelog/page.tsx` (new top entry dated the day it ships)
- Modify: `apps/web/scripts/verify-web.mjs` so `/targets` still matches the new shared sentence

**Interfaces:**
- Consumes: the flags and paths from Tasks 1 and 4
- Produces: public copy that names `.ai/skills/<skill>/SKILL.md` and `--shared`

- [ ] **Step 1: Update the copy**

CLI README install block:

```bash
aipm add @scope/name@1.0.0 --target claude
# or: --target codex  → .agents/skills/<skill>/SKILL.md
# or: --target cursor → .cursor/skills/<skill>/SKILL.md
# or: --shared        → .ai/skills/<skill>/SKILL.md plus a shortcut in every detected tool
```

On `apps/web/app/targets/page.tsx`, add a fourth card:

- name: `Shared`
- value: `shared`
- detect: `two or more of .cursor/, .claude/, .codex/`
- writes: `.ai/skills/<skill>/SKILL.md`
- command: `aipm add @scope/name@1.0.0 --shared --ci`
- note: `Keeps the skill in one folder and adds a shortcut in every detected tool. Shown in the install menu when the project has more than one tool folder.`

`/use` paragraph:

```tsx
<p>
  If the project has more than one of <code>.cursor</code>, <code>.claude</code>, and <code>.codex</code>,
  aipm asks where to install. Choose one tool for a normal copy, or <code>.ai</code> to keep the skill in
  <code>.ai/skills/&lt;skill&gt;/</code> and shortcut every detected tool. In CI, pass <code>--shared</code> for
  that layout, or <code>--target</code> for one tool.
</p>
```

Changelog entry:

```ts
{
  date: "September 30, 2026",
  title: "Shared .ai skill install",
  items: [
    "When a project has more than one AI tool folder, aipm add asks whether to copy into one tool or keep the skill in .ai/skills and shortcut the others.",
    "aipm add --shared writes .ai/skills/<skill>/SKILL.md and links .cursor/skills, .claude/skills, and .agents/skills.",
  ],
}
```

In `apps/web/scripts/verify-web.mjs`, add `--shared` to the `/targets` `includes` array.

- [ ] **Step 2: Run the web verify expectation locally**

Run: `pnpm --filter @aipm-registry/cli exec vitest run src/install-layout.test.ts src/no-init.test.ts src/remove-package.test.ts && pnpm --filter @aipm-registry/engine exec vitest run src/install-shared.test.ts`

Expected: PASS. Full `pnpm test` is the CI check before merge. Do not start the web server in this task.

- [ ] **Step 3: Commit**

```bash
git add apps/cli/README.md apps/web/app/targets/page.tsx apps/web/app/use/page.tsx apps/web/app/changelog/page.tsx apps/web/scripts/verify-web.mjs
git commit -m "Document the shared .ai skill install."
```

---

## Self-review

- Spec coverage: menu trigger, full copy vs `.ai` plus all shortcuts, `--shared`, CI failure, lock tracking, remove, and `--no-init` each have a task.
- `--target *` stays on the existing full-copy path because `explicitTarget` returns `mode: "default"`.
- Update with no flag, on a project that still has 2+ folders, will ask again. That matches the menu rule. Passing `--shared` or `--target` on update skips the menu.
- Placeholder scan: no TBD steps. Windows `EPERM` copy is specified.
- Type names match across tasks: `installSharedSkill`, `InstallLayout`, `shared.files`, `toolSkillDir`.
