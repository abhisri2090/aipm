# Codex Skill Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Codex as a first-class AIPM skill install target (`--target codex`) that writes `.agents/skills/<short>/SKILL.md` and detects `.codex`.

**Architecture:** Extend `AiToolSchema`/`ALL_TOOLS`, add `@aipm-registry/adapter-codex` mirroring the Claude adapter, wire it into the engine install map and `.codex` detection, then update CLI target parsing/prompts/help strings. No web UI, docs guides, or MCP.

**Tech Stack:** TypeScript, pnpm workspaces, vitest, existing `@aipm-registry/adapter-sdk` + `@aipm-registry/schemas`.

**Spec:** `docs/superpowers/specs/2026-09-05-codex-adapter-design.md`

## Global Constraints

- Install path must be native: `.agents/skills/<short-name>/SKILL.md` (no `.agents/aipm/`)
- Detect only `.codex` at project root (do not treat `.agents` alone as Codex)
- Cursor and Claude install paths must stay unchanged
- Core only: schema + adapter + engine + CLI (+ tests). No web/docs/MCP
- Commits only when the user explicitly asks (skip commit steps unless requested)

## File map

| File | Responsibility |
| --- | --- |
| `packages/schemas/src/manifest.ts` | Add `codex` to schema + `ALL_TOOLS` |
| `packages/schemas/src/manifest.test.ts` | Cover `codex` / `*` expansion |
| `packages/adapter-codex/*` | New Codex `SkillAdapter` |
| `packages/engine/src/detect-tools.ts` | Detect `.codex` |
| `packages/engine/src/detect-tools.test.ts` | Detection + wildcard expectations |
| `packages/engine/src/install-skill.ts` | Register adapter + error text |
| `packages/engine/src/install-skill.test.ts` | New: path assertions |
| `packages/engine/package.json` + `tsconfig.json` | Depend on adapter-codex |
| `apps/cli/src/project-files.ts` | Parse `codex` targets |
| `apps/cli/src/project-files.test.ts` | Accept/reject tests |
| `apps/cli/src/prompt.ts` | Interactive choice includes codex |
| `apps/cli/src/bin.ts` | Help option strings |
| `apps/cli/src/install-one.ts` | CI error mentions codex |
| `apps/cli/src/bin-command.test.ts` | Invalid target error text |
| `apps/cli/src/project-root.ts` | Comment update only |

---

### Task 1: Schema — add `codex` to AI tools

**Files:**
- Modify: `packages/schemas/src/manifest.ts`
- Modify: `packages/schemas/src/manifest.test.ts`

**Interfaces:**
- Produces: `AiTool` includes `"codex"`; `ALL_TOOLS` is `["cursor", "claude", "codex"]`; `expandTargets(["*"])` returns that list

- [ ] **Step 1: Write the failing tests**

Add to `packages/schemas/src/manifest.test.ts`:

```ts
describe("AiToolSchema", () => {
  it("accepts wildcard target", () => {
    expect(AiToolSchema.parse("*")).toBe("*");
  });

  it("accepts codex target", () => {
    expect(AiToolSchema.parse("codex")).toBe("codex");
  });
});

describe("expandTargets", () => {
  it("expands wildcard to all concrete tools", () => {
    expect(expandTargets(["*"])).toEqual(["cursor", "claude", "codex"]);
  });

  it("passes through concrete targets", () => {
    expect(expandTargets(["cursor"])).toEqual(["cursor"]);
  });

  it("passes through codex", () => {
    expect(expandTargets(["codex"])).toEqual(["codex"]);
  });
});
```

Also add a manifest parse case with `targets: ["codex"]` inside `PackageManifestSchema` tests (copy an existing minimal parse and set targets to `["codex"]`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @aipm-registry/schemas test`

Expected: FAIL — `codex` not in enum / expandTargets length mismatch

- [ ] **Step 3: Implement**

In `packages/schemas/src/manifest.ts`:

```ts
export const AiToolSchema = z.enum(["cursor", "claude", "codex", "*"]);
export type AiTool = z.infer<typeof AiToolSchema>;

/** Concrete tools supported by adapters (excludes wildcard "*"). */
export const ALL_TOOLS = ["cursor", "claude", "codex"] as const satisfies ReadonlyArray<
  Exclude<AiTool, "*">
>;
```

Leave `expandTargets` unchanged (it already spreads `ALL_TOOLS`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @aipm-registry/schemas test`

Expected: PASS

- [ ] **Step 5: Commit** (only if user asked to commit)

```bash
git add packages/schemas/src/manifest.ts packages/schemas/src/manifest.test.ts
git commit -m "$(cat <<'EOF'
feat(schemas): add codex to AI tool targets

EOF
)"
```

---

### Task 2: Create `@aipm-registry/adapter-codex`

**Files:**
- Create: `packages/adapter-codex/package.json`
- Create: `packages/adapter-codex/tsconfig.json`
- Create: `packages/adapter-codex/src/index.ts`
- Create: `packages/adapter-codex/src/index.test.ts`

**Interfaces:**
- Consumes: `SkillAdapter`, `SkillInstallInput`, `SkillInstallResult` from `@aipm-registry/adapter-sdk`; `shortNameFromScopeName` from `@aipm-registry/schemas`
- Produces: `codexSkillAdapter` with `tool: "codex"`; `installSkill` writes `<projectRoot>/.agents/skills/<short>/SKILL.md`

- [ ] **Step 1: Scaffold package files**

`packages/adapter-codex/package.json` — copy from `packages/adapter-claude/package.json`, change:

- `"name": "@aipm-registry/adapter-codex"`
- `"description": "Codex adapter for installing AIPM skill packages."`
- `"directory": "packages/adapter-codex"`

`packages/adapter-codex/tsconfig.json` — identical to `packages/adapter-claude/tsconfig.json`.

- [ ] **Step 2: Write the failing test**

`packages/adapter-codex/src/index.test.ts`:

```ts
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { codexSkillAdapter } from "./index.js";

describe("CodexSkillAdapter", () => {
  it("writes SKILL.md under .agents/skills/<short>", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-codex-"));
    const result = await codexSkillAdapter.installSkill({
      packageName: "@team/review-helper",
      version: "1.0.0",
      skillMarkdown: "# Review helper\n",
      projectRoot: root,
    });
    const expected = join(root, ".agents", "skills", "review-helper", "SKILL.md");
    expect(result.writtenPaths).toEqual([expected]);
    expect(await readFile(expected, "utf8")).toBe("# Review helper\n");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @aipm-registry/adapter-codex test`

Expected: FAIL (package/module missing) or after scaffolding empty index, FAIL on missing export

- [ ] **Step 4: Implement adapter**

`packages/adapter-codex/src/index.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillAdapter, SkillInstallInput, SkillInstallResult } from "@aipm-registry/adapter-sdk";
import { shortNameFromScopeName } from "@aipm-registry/schemas";

export class CodexSkillAdapter implements SkillAdapter {
  readonly tool = "codex" as const;

  async installSkill(input: SkillInstallInput): Promise<SkillInstallResult> {
    const short = shortNameFromScopeName(input.packageName);
    const skillDir = join(input.projectRoot, ".agents", "skills", short);
    await mkdir(skillDir, { recursive: true });
    const filePath = join(skillDir, "SKILL.md");
    await writeFile(filePath, input.skillMarkdown, "utf8");
    return { writtenPaths: [filePath] };
  }
}

export const codexSkillAdapter = new CodexSkillAdapter();
```

- [ ] **Step 5: Link workspace + build**

Run:

```bash
pnpm install
pnpm --filter @aipm-registry/adapter-codex build
pnpm --filter @aipm-registry/adapter-codex test
```

Expected: PASS

- [ ] **Step 6: Commit** (only if user asked)

```bash
git add packages/adapter-codex
git commit -m "$(cat <<'EOF'
feat(adapter-codex): install skills to .agents/skills

EOF
)"
```

---

### Task 3: Engine — detect `.codex` and install via adapter

**Files:**
- Modify: `packages/engine/package.json` — add `"@aipm-registry/adapter-codex": "workspace:*"`
- Modify: `packages/engine/tsconfig.json` — add `{ "path": "../adapter-codex" }`
- Modify: `packages/engine/src/detect-tools.ts`
- Modify: `packages/engine/src/detect-tools.test.ts`
- Modify: `packages/engine/src/install-skill.ts`
- Create: `packages/engine/src/install-skill.test.ts`

**Interfaces:**
- Consumes: `codexSkillAdapter` from `@aipm-registry/adapter-codex`
- Produces: `detectToolsInProject` may return `"codex"`; `installSkillPackage` installs for codex; error text lists `.codex/` and `codex`

- [ ] **Step 1: Update failing detection / resolve tests**

In `packages/engine/src/detect-tools.test.ts`:

1. Add:

```ts
it("detects codex folder", async () => {
  const root = await mkdtemp(join(tmpdir(), "aipm-"));
  await mkdir(join(root, ".codex"));
  expect(await detectToolsInProject(root)).toEqual(["codex"]);
});
```

2. Change every expectation of `["cursor", "claude"]` for wildcard `explicitTarget: "*"` or “falls back to all tools” to `["cursor", "claude", "codex"]`.

3. Optionally add resolve test: explicit `codex` against a manifest with `targets: ["codex"]`.

- [ ] **Step 2: Write failing install-skill test**

`packages/engine/src/install-skill.test.ts`:

```ts
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { installSkillPackage } from "./install-skill.js";
import type { PackageManifest } from "@aipm-registry/schemas";

const manifest: PackageManifest = {
  schemaVersion: "0.1",
  name: "@team/review-helper",
  version: "1.0.0",
  type: "skill",
  description: "test",
  entry: "SKILL.md",
  targets: ["codex"],
};

describe("installSkillPackage", () => {
  it("installs to .agents/skills for codex", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-install-"));
    const result = await installSkillPackage({
      projectRoot: root,
      manifest,
      skillMarkdown: "# hello\n",
      explicitTarget: "codex",
    });
    const path = join(root, ".agents", "skills", "review-helper", "SKILL.md");
    expect(result.resolvedTools).toEqual(["codex"]);
    expect(result.installed.codex).toEqual([path]);
    expect(await readFile(path, "utf8")).toBe("# hello\n");
  });

  it("keeps cursor path shape", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-install-"));
    const cursorManifest: PackageManifest = { ...manifest, targets: ["cursor"] };
    const result = await installSkillPackage({
      projectRoot: root,
      manifest: cursorManifest,
      skillMarkdown: "# c\n",
      explicitTarget: "cursor",
    });
    const path = join(root, ".cursor", "aipm", "skills", "review-helper.md");
    expect(result.installed.cursor).toEqual([path]);
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `pnpm --filter @aipm-registry/engine test`

Expected: FAIL on codex detection / missing adapter / outdated wildcard lists

- [ ] **Step 4: Implement detection + wiring**

`detect-tools.ts` — after Claude check:

```ts
if (await pathExists(join(projectRoot, ".codex"))) detected.push("codex");
```

`install-skill.ts`:

```ts
import { claudeSkillAdapter } from "@aipm-registry/adapter-claude";
import { cursorSkillAdapter } from "@aipm-registry/adapter-cursor";
import { codexSkillAdapter } from "@aipm-registry/adapter-codex";
// ...
const adapters: Record<ConcreteAiTool, SkillAdapter> = {
  cursor: cursorSkillAdapter,
  claude: claudeSkillAdapter,
  codex: codexSkillAdapter,
};
// error message:
"No AI tool detected (.cursor/, .claude/, or .codex/). Use --target cursor|claude|codex|* or set preferredTools in aipm.package.json."
```

Add dependency + tsconfig project reference for `adapter-codex`.

- [ ] **Step 5: Install, build, test**

```bash
pnpm install
pnpm --filter @aipm-registry/engine build
pnpm --filter @aipm-registry/engine test
```

Expected: PASS

- [ ] **Step 6: Commit** (only if user asked)

```bash
git add packages/engine
git commit -m "$(cat <<'EOF'
feat(engine): detect and install Codex skills

EOF
)"
```

---

### Task 4: CLI — accept `codex` targets and prompts

**Files:**
- Modify: `apps/cli/src/project-files.ts`
- Modify: `apps/cli/src/project-files.test.ts`
- Modify: `apps/cli/src/prompt.ts`
- Modify: `apps/cli/src/bin.ts` (option help strings only — all `--target <tool>` descriptions)
- Modify: `apps/cli/src/install-one.ts` (CI error string)
- Modify: `apps/cli/src/bin-command.test.ts` (invalid target expectation)
- Modify: `apps/cli/src/project-root.ts` (comment: mention `.codex/`)

**Interfaces:**
- Consumes: `AiTool` including `"codex"` from schemas
- Produces: `parseTargetFlag("codex") === "codex"`; `parseTargetsFlag` accepts `codex`; `promptForTool` accepts `codex`

- [ ] **Step 1: Write failing CLI parse tests**

In `apps/cli/src/project-files.test.ts`:

```ts
it("accepts concrete targets", () => {
  expect(parseTargetFlag("cursor")).toBe("cursor");
  expect(parseTargetFlag("claude")).toBe("claude");
  expect(parseTargetFlag("codex")).toBe("codex");
});

it("rejects invalid targets", () => {
  expect(() => parseTargetFlag("vscode")).toThrow(/cursor.*claude.*codex.*\*/);
});

// parseTargetsFlag:
expect(parseTargetsFlag("cursor,claude,codex")).toEqual(["cursor", "claude", "codex"]);
expect(() => parseTargetsFlag("vscode")).toThrow(/cursor.*claude.*codex.*\*/);
```

Update `apps/cli/src/bin-command.test.ts` invalid-target expectation string to include `codex`.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @aipm-registry/cli test -- project-files`

Expected: FAIL on missing `codex` accept / error regex

- [ ] **Step 3: Implement CLI parsing + copy**

`project-files.ts`:

```ts
export function parseTargetFlag(target?: string): AiTool | undefined {
  if (!target) return undefined;
  if (target === "cursor" || target === "claude" || target === "codex" || target === "*") {
    return target;
  }
  throw new Error('--target must be "cursor", "claude", "codex", or "*"');
}

export function parseTargetsFlag(value: string): AiTool[] {
  const targets = value
    .split(",")
    .map((target) => target.trim())
    .filter(Boolean);
  if (targets.length === 0) throw new Error("At least one target is required.");
  for (const target of targets) {
    if (target !== "cursor" && target !== "claude" && target !== "codex" && target !== "*") {
      throw new Error('--targets must contain only "cursor", "claude", "codex", and/or "*"');
    }
  }
  const unique = [...new Set(targets)] as AiTool[];
  if (unique.includes("*")) return ["*"];
  return unique;
}
```

`prompt.ts`:

```ts
const answer = await rl.question(
  "Which AI tool should this skill be installed for? (cursor/claude/codex): ",
);
const normalized = answer.trim().toLowerCase();
if (normalized === "cursor" || normalized === "claude" || normalized === "codex") {
  return normalized;
}
console.log('Please enter "cursor", "claude", or "codex".');
```

`bin.ts` — replace every help string like `"cursor, claude, or *"` / `"Preferred install target: cursor, claude, or *"` with versions that include `codex`.

`install-one.ts` CI error:

```ts
"No tool detected. Use --target cursor|claude|codex|* in CI mode."
```

`project-root.ts` comment: mention `.codex/` alongside `.cursor/` / `.claude/`.

- [ ] **Step 4: Run CLI tests**

```bash
pnpm --filter @aipm-registry/cli test
```

Expected: PASS (update any leftover assertions that hard-code old error text)

- [ ] **Step 5: Commit** (only if user asked)

```bash
git add apps/cli/src
git commit -m "$(cat <<'EOF'
feat(cli): accept --target codex

EOF
)"
```

---

### Task 5: Verify end-to-end locally

**Files:** none new (manual smoke)

- [ ] **Step 1: Build dependent packages**

```bash
pnpm --filter @aipm-registry/schemas build
pnpm --filter @aipm-registry/adapter-codex build
pnpm --filter @aipm-registry/engine build
pnpm --filter @aipm-registry/cli build
```

- [ ] **Step 2: Smoke install into a temp project**

```bash
ROOT=$(mktemp -d)
mkdir "$ROOT/.codex"
# From repo, after init against a reachable registry OR use a unit-level path:
# Prefer re-running engine install-skill test as the authoritative smoke if registry is unavailable.
pnpm --filter @aipm-registry/schemas test
pnpm --filter @aipm-registry/adapter-codex test
pnpm --filter @aipm-registry/engine test
pnpm --filter @aipm-registry/cli test
```

Expected: all PASS; engine test proves `.agents/skills/.../SKILL.md` is written.

- [ ] **Step 3: Spec checklist**

Confirm against `docs/superpowers/specs/2026-09-05-codex-adapter-design.md`:

- [ ] `codex` in schema / `ALL_TOOLS`
- [ ] Native path `.agents/skills/<short>/SKILL.md`
- [ ] Detect `.codex` only
- [ ] CLI `--target codex` + prompt + errors
- [ ] Cursor/Claude paths unchanged
- [ ] No web/docs/MCP changes

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| Add `codex` to schema / ALL_TOOLS | Task 1 |
| adapter-codex package | Task 2 |
| Install path `.agents/skills/.../SKILL.md` | Task 2–3 |
| Detect `.codex` | Task 3 |
| Engine wiring + error text | Task 3 |
| CLI parse/prompt/help/CI errors | Task 4 |
| Tests for schema/detect/install/CLI | Tasks 1–4 |
| No web/docs/MCP | Global constraint |
| Cursor/Claude unchanged | Task 3 regression test |

## Placeholder scan

No TBD/TODO placeholders. Commit steps gated on user request.
