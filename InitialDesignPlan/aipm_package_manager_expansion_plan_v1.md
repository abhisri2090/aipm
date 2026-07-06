# AIPM Package Manager Expansion Plan v1

## Goal

Extend AIPM from a registry-backed single-skill installer into a reproducible
AI package manager that supports transitive dependencies, more AI-tool targets,
policy enforcement, install-time audit, MCP server configuration, and lifecycle
commands.

Keep AIPM's JSON-first design. Do not introduce YAML for project, package,
lockfile, or policy state.

## Current Baseline

AIPM currently has these relevant pieces:

- Package manifest: `aipm.manifest.json`, validated by `PackageManifestSchema`.
- Project config: `aipm.package.json`.
- Lockfile: `aipm-lock.json`.
- Package type: `skill`.
- Targets: `cursor`, `claude`, and `*`.
- Install path: `apps/cli/src/install-one.ts` fetches one package, installs it,
  and writes a lock entry.
- Adapter interface: `SkillAdapter`, focused only on skill installation.

The expansion should preserve this simple path while adding a resolver,
policy/audit gates, richer lockfile state, and target adapter capabilities.

## Design Principles

1. Keep JSON as the contract surface.
2. Make the lockfile the source of truth for installed state.
3. Keep target-specific behavior behind adapters.
4. Enforce policy before writing files.
5. Audit package contents before agents can read them.
6. Add features in layers so existing `aipm add @scope/name` keeps working.
7. Prefer strict validation and clear errors over silent fallback.
8. Treat installs as transactional: resolve, validate, audit, then write.
9. Never delete user-authored files unless the lockfile proves AIPM owns them.

## Command Model

The CLI should clearly separate project-manifest mutation from lockfile-driven
installation.

- `aipm init`: creates `aipm.package.json`.
- `aipm add <package>`: adds a direct skill dependency to `aipm.package.json`,
  resolves the full graph, installs it, and updates `aipm-lock.json`.
- `aipm install`: reads `aipm.package.json`, resolves all declared
  dependencies, installs missing or changed packages, and updates the lockfile.
- `aipm install <package>`: may remain as an alias for `aipm add <package>` for
  npm-style ergonomics, but the docs should choose one primary command.
- `aipm verify`: checks installed state against `aipm-lock.json`.
- `aipm audit`: scans package/project content for security findings.
- `aipm remove`, `aipm prune`, `aipm update`, `aipm list`, and
  `aipm outdated`: operate from `aipm.package.json` and `aipm-lock.json`.

Direct dependencies are packages declared by the project. Transitive
dependencies are packages reached through other package manifests. The lockfile
must preserve this distinction so remove/prune/update can make safe decisions.

## New JSON Files

### `aipm.package.json`

Consumer project manifest. Expand it from registry/preferred-tools config into
the project dependency declaration.

```json
{
  "schemaVersion": "0.2",
  "registry": "https://api.aipm-registry.com",
  "preferredTools": ["codex", "claude"],
  "dependencies": {
    "skills": ["@team/review-helper@1.0.0"],
    "mcp": [
      {
        "name": "github",
        "transport": "http",
        "url": "https://example.com/mcp"
      }
    ]
  }
}
```

Notes:

- `dependencies.skills` contains direct project dependencies only.
- `aipm add` mutates this file.
- `aipm install` should not add missing dependencies automatically unless the
  user explicitly requested a package.
- Future fields can include `devDependencies`, `approvedMcp`, and
  per-target preferences, but they are not required for v1.

### `aipm.manifest.json`

Published package manifest. Extend it to let packages declare dependencies.

```json
{
  "schemaVersion": "0.2",
  "name": "@team/review-helper",
  "version": "1.0.0",
  "type": "skill",
  "description": "Review helper skill",
  "entry": "SKILL.md",
  "targets": ["*"],
  "dependencies": {
    "skills": ["@team/common-review-rules@1.0.0"],
    "mcp": []
  }
}
```

### `aipm-lock.json`

Resolved installed state. Upgrade to record dependency graph, installed files,
hashes, and target outputs.

```json
{
  "schemaVersion": "0.2",
  "rootDependencies": ["@team/review-helper@1.0.0"],
  "packages": {
    "@team/review-helper": {
      "version": "1.0.0",
      "registry": "https://api.aipm-registry.com",
      "integrity": "sha256-example",
      "dependencies": ["@team/common-review-rules@1.0.0"],
      "resolvedTools": ["codex"],
      "installed": {
        "codex": [".agents/skills/review-helper/SKILL.md"]
      },
      "contentHashes": {
        ".agents/skills/review-helper/SKILL.md": "sha256-example"
      },
      "direct": true,
      "dependents": []
    }
  },
  "mcpServers": {}
}
```

Notes:

- `rootDependencies` mirrors the resolved direct project dependencies.
- `direct` helps CLI display and remove/update behavior.
- `dependents` helps prune transitive dependencies safely.
- Installed paths should be stored relative to the install root where possible
  for portability, with path normalization on read.

### `aipm-policy.json`

Governance file for org/team rules.

```json
{
  "schemaVersion": "0.1",
  "enforcement": "warn",
  "registries": {
    "allow": ["https://api.aipm-registry.com"]
  },
  "scopes": {
    "allow": ["@company/*"],
    "deny": []
  },
  "packages": {
    "deny": []
  },
  "security": {
    "privatePackagesOnly": false,
    "requirePinnedVersions": true,
    "requireIntegrityHashes": true,
    "installAudit": "block"
  },
  "targets": {
    "allow": ["cursor", "claude", "codex"]
  }
}
```

## Phase 1: Schema Foundations

### Objectives

Create the shared schema surface required by every later phase.

### Steps

1. Extend `AiToolSchema`.
   - Add `codex`, `copilot`, `gemini`, `opencode`, `windsurf`, and `kiro`.
   - Keep `cursor`, `claude`, and `*`.
   - Update `ALL_TOOLS`.

2. Add dependency reference schemas.
   - `SkillDependencySchema`: string form initially, e.g. `@scope/name@1.0.0`.
   - `McpDependencySchema`: object form with `name`, `transport`, and either
     remote URL or stdio command/args.
   - Keep semver ranges out of v1 unless the resolver is ready for them.

3. Extend `PackageManifestSchema`.
   - Add optional `dependencies.skills`.
   - Add optional `dependencies.mcp`.
   - Keep `type: "skill"` for this phase.

4. Extend `ProjectPackageJsonSchema`.
   - Add `schemaVersion`.
   - Add `dependencies.skills`.
   - Add `dependencies.mcp`.
   - Preserve backward compatibility with existing `registry` and
     `preferredTools`.

5. Extend `LockfileSchema`.
   - Add `schemaVersion: "0.2"`.
   - Add `rootDependencies`.
   - Add dependency list per package.
   - Add direct/transitive metadata.
   - Add dependent package metadata for prune/remove.
   - Add installed file hashes.
   - Add optional `mcpServers`.
   - Support reading old `"0.1"` lockfiles and upgrading in memory.

6. Add `PolicySchema`.
   - Validate `aipm-policy.json`.
   - Support `enforcement: "off" | "warn" | "block"`.
   - Support install audit mode: `"off" | "warn" | "block"`.

### Tests

- Schema accepts old manifests.
- Schema accepts new dependency fields.
- Schema rejects invalid targets.
- Schema rejects malformed package references.
- Lockfile v0.1 still parses or upgrades.
- Policy schema rejects unknown enforcement modes.
- Lockfile records direct vs transitive packages.

## Phase 2: Target Adapter Refactor

### Objectives

Move from a skill-only adapter to a target adapter interface that can support
skills, uninstall, verify, and MCP configuration.

### Steps

1. Replace or extend `SkillAdapter` with `TargetAdapter`.

```ts
export interface TargetAdapter {
  readonly tool: ConcreteAiTool;
  detect(projectRoot: string): Promise<boolean>;
  installSkill(input: SkillInstallInput): Promise<SkillInstallResult>;
  uninstallSkill?(input: SkillUninstallInput): Promise<SkillUninstallResult>;
  installMcpServer?(input: McpInstallInput): Promise<McpInstallResult>;
  verify?(input: VerifyInput): Promise<VerifyResult>;
}
```

2. Move target detection into adapters.
   - Cursor detects `.cursor`.
   - Claude detects `.claude`.
   - Codex detects `.codex`.
   - Copilot detects `.github`.
   - Gemini detects `.gemini`.
   - OpenCode detects `.opencode`.
   - Windsurf detects `.windsurf`.
   - Kiro detects `.kiro`.

3. Create a central adapter registry in `packages/engine`.
   - `getAdapter(tool)`.
   - `listAdapters()`.
   - `detectToolsInProject(projectRoot)`.

4. Update `resolveInstallTools`.
   - Explicit target wins.
   - Detected tools filtered by package targets.
   - Preferred tools as fallback.
   - `*` expands to all currently supported adapters.

5. Keep Cursor and Claude behavior unchanged.

6. Add Codex as the first new adapter.
   - Skill path: `.agents/skills/<short-name>/SKILL.md`.
   - Do MCP later in the MCP phase.

### Tests

- Cursor and Claude installs still write the same paths.
- `--target codex` installs to `.agents/skills/.../SKILL.md`.
- `*` includes all registered tools.
- Detection is delegated to adapters.
- Unsupported target errors are clear.

## Phase 3: Transitive Skill Dependency Resolver

### Objectives

Install dependency closure instead of only one package.

### Steps

1. Add a dependency reference parser.
   - Accept `@scope/name@version`.
   - Accept `@scope/name` only when resolving direct CLI input to latest.
   - For package manifests, require pinned exact versions in v1.

2. Add resolver module.
   - Input: root package references.
   - Fetch metadata for each package.
   - Read `manifest.dependencies.skills`.
   - Recurse breadth-first or depth-first.
   - Track parent chain for diagnostics.
   - Detect cycles.
   - Dedupe exact package/version.
   - Fail on version conflict for same package name.
   - Return a plan object before writing files.
   - If the current package metadata API does not return the full manifest
     dependency block, implement the Phase 8 metadata exposure step before
     completing this resolver.

3. Update `installOnePackage`.
   - Convert it into a wrapper over the resolver.
   - Existing `aipm add @scope/name@version` becomes root dependency install.

4. Add install order.
   - Dependencies before dependents is safest.
   - Preserve deterministic ordering for lockfile stability.

5. Write dependency closure into `aipm-lock.json`.
   - Each package records direct dependency references.
   - Add a top-level `rootDependencies` list.
   - Mark each package as direct or transitive.
   - Record dependents for prune/remove.

6. Update registry publish validation.
   - Validate declared dependencies exist if feasible.
   - At minimum validate names/versions and deny self-dependency.

7. Preserve private package access.
   - Reuse CLI auth tokens for transitive metadata and tarball fetches.
   - If a transitive private dependency is inaccessible, fail during the
     resolve phase before any files are written.

8. Add an install plan preview internally.
   - New packages.
   - Existing packages.
   - Changed versions.
   - Removed/pruned packages.
   - MCP servers requiring trust.
   - Policy/audit blockers.

### Tests

- Root package with one dependency installs both.
- Shared dependency installs once.
- Cycle produces a readable error.
- Version conflict fails.
- Missing transitive package fails before writing files.
- Lockfile records the dependency edge.
- Private transitive package uses the same auth path as direct install.
- Resolver returns deterministic order for stable lockfile output.

## Phase 3.5: Transactional Install and Rollback

### Objectives

Prevent partial installs and broken lockfiles when a dependency, audit, policy,
or adapter write fails.

### Steps

1. Split install into planning and apply phases.
   - Plan: resolve, fetch metadata, enforce policy, audit tarballs, choose
     targets, and compute intended writes.
   - Apply: write package files, write MCP config, then write lockfile.

2. Write files through a managed writer.
   - Track every file created or modified.
   - Write temporary files first when practical.
   - Normalize written paths before storing them in the lockfile.

3. Snapshot existing managed files before overwriting.
   - If an adapter updates an existing AIPM-managed file, save its old content
     until the install succeeds.

4. Roll back on failure.
   - Delete newly created files.
   - Restore overwritten managed files.
   - Do not write the new lockfile.
   - Leave user-authored files untouched.

5. Only write `aipm-lock.json` after all adapter writes succeed.

### Tests

- Adapter failure leaves old lockfile unchanged.
- Adapter failure removes newly created files.
- Adapter failure restores overwritten managed file.
- User-authored collision fails without deleting the user file.
- Successful install writes files before lockfile.

## Phase 4: Install Audit

### Objectives

Scan package contents before writing agent-readable files, and verify installed
state afterward.

### Steps

1. Add tarball safety checks.
   - Reject absolute paths.
   - Reject `../` path traversal.
   - Reject symlink escape.
   - Enforce max package bytes.
   - Enforce max file count.

2. Add hidden Unicode scanner.
   - Scan text files: `.md`, `.mdc`, `.txt`, `.json`, `.toml`.
   - Flag bidi overrides, tag characters, suspicious zero-width characters,
     and variation-selector payloads.
   - Severity: `info`, `warning`, `critical`.

3. Add executable detection.
   - Flag `bin/`.
   - Flag `.sh`, `.ps1`, `.bat`, `.cmd`.
   - Flag executable mode bits where tar metadata exposes them.

4. Add integrity verification.
   - Compare fetched tarball hash against registry metadata.
   - Hash installed output files.
   - Store hashes in lockfile.
   - Use a single canonical hash format, such as `sha256-<base64url>`.

5. Add audit result routing.
   - CLI flag can start as `--audit off|warn|block`.
   - Policy can override later.

6. Add `aipm audit`.
   - Scan current project and/or installed package state.
   - Report findings with package names and file paths.

7. Add `aipm verify`.
   - Check lockfile package integrity.
   - Check installed file hashes.
   - Report missing, modified, and orphaned managed files.

8. Add allowlists only after the first audit version.
   - Do not start with broad ignore rules.
   - If needed later, model allowlists in `aipm-policy.json`.

### Tests

- Path traversal tarball is rejected.
- Hidden Unicode critical finding blocks in block mode.
- Warning finding does not block in warn mode.
- Executable file is reported.
- Integrity mismatch fails.
- Verify catches modified installed file.
- Audit output is deterministic and testable.

## Phase 5: Policy Enforcement

### Objectives

Apply `aipm-policy.json` to installs, updates, audit, and target selection.

### Steps

1. Add policy discovery.
   - Project root: `aipm-policy.json`.
   - Later: global `~/.aipm/aipm-policy.json`.

2. Add policy evaluation module.
   - Inputs: package reference, registry URL, target list, resolved metadata,
     audit findings, and lockfile requirements.
   - Output: list of violations with severity and action.
   - Precedence: explicit CLI safety flags may tighten policy for one run, but
     must not relax a project policy. For example, `--audit block` can tighten a
     warn policy, but `--audit off` cannot disable a block policy.

3. Enforce allowed registries.
   - Compare normalized registry URL.

4. Enforce allowed and denied scopes.
   - Support simple globs such as `@company/*`.

5. Enforce denied packages.
   - Exact package names initially.

6. Enforce private-package-only mode.
   - Use registry metadata visibility.

7. Enforce pinned versions.
   - In project dependencies and package dependencies.

8. Enforce required integrity hashes.
   - Block if registry metadata has no hash.
   - Block if lockfile entry has no hash after install.

9. Enforce allowed targets.
   - Run after target resolution and before adapter writes.

10. Route violations by policy mode.
   - `off`: ignore.
   - `warn`: print warnings, continue.
   - `block`: throw before writing files.
   - Treat missing or invalid policy as no policy by default in v1; a later
     global/org policy layer can add fail-closed behavior.

11. Add explicit policy status output.
   - Show whether policy was found.
   - Show enforcement mode.
   - Show all warnings in `warn` mode.
   - Avoid printing secrets from registry URLs or MCP headers.

### Tests

- Denied package blocks in block mode.
- Denied package warns in warn mode.
- Disallowed registry blocks.
- Disallowed target blocks before install.
- Unpinned dependency blocks when `requirePinnedVersions` is true.
- Audit block mode blocks critical findings.
- Warn mode prints all violations but exits successfully.
- Policy output redacts secrets.

## Phase 6: Lifecycle Commands

### Objectives

Make installed state manageable after install.

### Steps

1. Add `aipm remove <package>`.
   - Read lockfile.
   - Delete installed files for that package.
   - Remove empty directories where safe.
   - Remove package from project dependencies if present.
   - Remove lock entry if no dependent still requires it.

2. Add dependency-aware removal.
   - If a removed root package has transitive dependencies, remove only
     dependencies no other root needs.
   - Start with conservative behavior: leave shared dependencies and report.

3. Add `aipm prune`.
   - Compare `aipm.package.json` dependencies with lockfile.
   - Remove packages no longer reachable.
   - Remove stale installed files tracked in lockfile.

4. Add `aipm update [package]`.
   - Re-resolve latest version for direct dependency.
   - Re-resolve dependency closure.
   - Reinstall changed packages.
   - Update lockfile.
   - Respect policy and audit.
   - For v1, update direct dependencies only unless a transitive dependency
     changes as part of the direct dependency closure.

5. Add `aipm list`.
   - Show installed packages, versions, targets, and whether direct/transitive.

6. Add `aipm outdated`.
   - Compare lockfile versions with registry latest.
   - Keep simple: exact package name latest check first.

7. Add dry-run modes where useful.
   - `aipm remove --dry-run`.
   - `aipm prune --dry-run`.
   - `aipm update --dry-run`.
   - Print the planned file and lockfile changes.

### Tests

- Remove deletes installed files and lock entry.
- Remove does not delete shared transitive dependency.
- Prune removes unreachable package.
- Update changes lockfile and installed content.
- List distinguishes direct and transitive packages.
- Outdated reports older version.
- Dry-run does not modify files.

## Phase 7: MCP Server Support

### Objectives

Allow direct project MCP entries and package-provided MCP dependencies.

### Steps

1. Add MCP schema.
   - `name`.
   - `transport`: `stdio`, `http`, `sse`, or `streamable-http`.
   - Remote fields: `url`, optional `headers`.
   - Stdio fields: `command`, `args`, optional `env`.

2. Support direct MCP in `aipm.package.json`.
   - Direct MCP is trusted by the project author.
   - Install during `aipm install`.

3. Add MCP adapter capability.
   - `installMcpServer`.
   - Return written config paths.

4. Implement first MCP target adapters.
   - Codex: `.codex/config.toml`.
   - Claude: `.claude/settings.json` or equivalent target-specific config.
   - Cursor: `.cursor/mcp.json` or equivalent target-specific config.

5. Add transitive MCP gating.
   - Package-provided MCP is not silently trusted.
   - Require one of:
     - explicit CLI approval,
     - policy allow,
     - project-level approval in `aipm.package.json`.
   - In CI mode, fail closed unless policy or project approval exists.

6. Record MCP state in lockfile.
   - Server name.
   - Source package or direct project.
   - Target config files written.
   - Hash of rendered config snippet if useful.

7. Add uninstall/prune handling for MCP.
   - Remove managed MCP entries without deleting user-authored entries.

8. Add secret-safe environment handling.
   - Do not write secret values into lockfile.
   - Prefer environment placeholders such as `${GITHUB_TOKEN}`.
   - Redact MCP headers and env values in logs.

### Tests

- Direct MCP installs to Codex config.
- Existing config is preserved.
- Transitive MCP blocks without approval.
- Policy can allow transitive MCP.
- Prune removes managed MCP entry.
- User-authored MCP entry is not removed.
- CI fails for untrusted transitive MCP.
- Logs redact MCP secrets.

## Phase 8: Registry and Web API Updates

### Objectives

Make the registry aware of dependencies, security metadata, and richer package
records.

### Steps

1. Store manifest dependency metadata.
   - Include skill dependencies and MCP dependencies.

2. Expose dependencies in package metadata API.
   - CLI resolver should not need to download tarball just to read dependency
     declarations.

3. Validate dependencies on publish.
   - Reject malformed dependency references.
   - Reject self-dependency.
   - Optionally warn for missing dependency.

4. Add package integrity metadata.
   - Tarball hash.
   - Manifest hash.
   - File count and unpacked size if available.
   - Package visibility, so `privatePackagesOnly` can be enforced.

5. Add UI display.
   - Package detail page lists dependencies.
   - Package detail page lists supported targets.
   - Package detail page shows audit/security metadata when available.

6. Add dependency search/index support.
   - Allow package pages or admin tools to answer "what depends on this?"
   - This is helpful before yanking/deprecating a package version.

### Tests

- Publish stores dependencies.
- Metadata API returns dependencies.
- CLI can resolve dependencies from metadata.
- UI renders dependency list.
- Private package visibility is exposed only to authorized users.

## Phase 9: Migration and Compatibility

### Objectives

Avoid breaking current users.

### Steps

1. Continue accepting `schemaVersion: "0.1"` manifests.
2. Treat missing `dependencies` as empty.
3. Treat missing project `schemaVersion` as legacy.
4. Upgrade lockfile v0.1 to v0.2 on write.
5. Keep `aipm add @scope/name` behavior.
6. Add warnings before changing old defaults.
7. Document the v0.1 to v0.2 transition in README and web docs.
8. Add fixtures for old package manifests, old project configs, and old
   lockfiles.

### Tests

- Existing sample package still publishes.
- Existing install tests still pass.
- Existing lockfile rewrites cleanly.
- Existing `preferredTools` behavior still works.
- Old fixtures remain covered by tests.

## Phase 10: Documentation, Release, and CI

### Objectives

Ship the new package-manager behavior in a way contributors and users can
understand, test, and roll back.

### Steps

1. Update CLI README and root README.
   - Explain `aipm.package.json`.
   - Explain transitive dependencies.
   - Explain `aipm-lock.json`.
   - Explain policy and audit modes.

2. Add docs pages or website sections.
   - Project manifest reference.
   - Package manifest reference.
   - Policy reference.
   - Target adapter matrix.
   - MCP server support.
   - Lifecycle commands.

3. Add example packages.
   - Package with transitive skill dependency.
   - Package with direct MCP dependency.
   - Project with `aipm-policy.json`.

4. Add CI coverage.
   - Schema tests.
   - Resolver tests.
   - Install audit tests.
   - CLI command tests.
   - Registry API integration tests.

5. Add release notes.
   - Mark schema v0.2 as backward compatible.
   - Mention exact-version-only transitive dependencies in v1.
   - Mention MCP transitive trust behavior.

6. Add feature flags only if rollout risk is high.
   - Prefer hidden/internal flags for incomplete work.
   - Avoid public flags that become permanent API unless needed.

### Tests

- Docs examples validate against schemas.
- Example package installs in an integration test.
- CI runs at least one end-to-end transitive install.

## Suggested Milestones

### Milestone 1: Foundations

- Schema v0.2.
- Lockfile v0.2.
- Target adapter interface.
- Cursor/Claude compatibility.
- Codex skill adapter.

### Milestone 2: Dependency Install

- Skill dependency resolver.
- Dependency graph lockfile.
- Registry metadata dependency exposure.
- Basic conflict/cycle detection.

### Milestone 3: Safety

- Install audit.
- Integrity verification.
- `aipm audit`.
- `aipm verify`.

### Milestone 4: Governance

- `aipm-policy.json`.
- Policy enforcement for registry, scope, packages, targets, pinned versions,
  hashes, and audit mode.

### Milestone 5: Lifecycle

- `aipm remove`.
- `aipm prune`.
- `aipm update`.
- `aipm list`.
- `aipm outdated`.

### Milestone 6: MCP

- Direct project MCP.
- Codex/Claude/Cursor MCP adapters.
- Transitive MCP trust gate.
- MCP lockfile tracking and prune support.

## Risks and Decisions

### Version Ranges

Start with exact versions. Semver ranges require registry-side version listing,
resolver conflict strategy, and lockfile stability. Add ranges after exact
transitive dependencies are solid.

### Transitive MCP Trust

Do not silently install MCP servers from dependencies. MCP can execute commands
or connect to external services, so transitive MCP must require explicit trust.

### Policy Inheritance

Do not implement policy inheritance in v1. A single project-level policy is
enough to prove the model.

### Multi-Primitive Packages

Keep `type: "skill"` for the first pass. The dependency, policy, lockfile, and
adapter foundations should be compatible with future package types, but package
type expansion can be a separate plan.

### Adapter Paths

Be conservative with target paths. Prefer managed subdirectories or managed
markers so uninstall/prune can avoid deleting user-authored files.

### Install Atomicity

The lockfile must be written last. A failed install should not leave the project
claiming a package is installed when adapter writes failed.

### Direct vs Transitive Ownership

Only direct dependencies should be edited by `aipm add`, `aipm remove`, and
explicit `aipm update <package>`. Transitive dependencies are managed by the
resolver and pruned only when unreachable.

### Secrets

No token, MCP header value, or environment secret should be written to the
lockfile or printed in logs. Store placeholders and source descriptions instead.

## First Implementation PR Recommendation

The first PR should be intentionally small:

1. Expand `AiToolSchema` and `ALL_TOOLS`.
2. Add dependency schemas.
3. Add policy schema.
4. Add lockfile v0.2 schema while keeping v0.1 compatibility.
5. Add tests only for schema parsing and validation.

This gives the rest of the work a stable contract without touching install
behavior yet.
