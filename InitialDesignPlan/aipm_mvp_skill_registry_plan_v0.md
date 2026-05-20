# AIPM MVP Plan — Skill Registry + CLI Install (v0)

## Purpose

This document defines a **narrow first slice** of AIPM:

1. A **registry service** (cloud-hosted on **Azure**) where publishers upload **skill packages**.
2. A **CLI** that pulls skills from the registry and installs them into a **project folder**.
3. **Tool targeting**: auto-detect Cursor/Claude when possible; otherwise **prompt the user** to choose `cursor` or `claude`.
4. **Package naming**: enforce `@scope/name` everywhere.

**Out of scope for this slice:** authentication, authorization, OAuth, API tokens, signing, security scanning, website, desktop GUI, rules, MCP, environment bundles, dependencies, global scope, and enterprise features.

---

## Product goal

```bash
# Publisher — upload a skill folder to the registry
aipm publish ./react-reviewer --registry https://registry.example.com

# Developer — install into current project
cd my-app
aipm init                    # first time only
aipm add @team/react-reviewer
# or
aipm install
```

**Success:** After install, the skill files exist under the correct tool paths for the chosen/detected target(s), and `aipm-lock.json` records what was installed.

---

## Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Hosting | **Microsoft Azure** (registry API + metadata DB + blob storage) |
| 2 | No tool folders in project | **Prompt user** to pick `cursor` or `claude` (only these two options for now) |
| 3 | Package naming | **Enforce `@scope/name`** on publish and in `aipm.package.json` |
| 4 | Auth | **None for now** — registry publish/fetch are open (add auth in a later slice) |

---

## Non-goals (explicitly deferred)

- Login, tokens, scopes, RBAC, rate limiting tied to identity
- Rules, MCP, environment/meta packages
- Dependency resolution (multiple packages, semver graphs)
- `update`, `remove`, `verify`, `scan`, search UI
- Security scanner, signatures, permission diffs, MCP risk
- Public website, desktop GUI, enterprise private registry
- AI model usage during install
- Global (`-g`) install scope

---

## User flows

### Flow A — Publish a skill

1. Author prepares a folder:

   ```txt
   react-reviewer/
   ├── aipm.manifest.json
   └── skill.md
   ```

2. `aipm.manifest.json` must use a valid name: `@team/react-reviewer`.

3. Publisher runs:

   ```bash
   aipm publish ./react-reviewer --registry https://<azure-registry-host>
   ```

4. CLI validates manifest, packs folder into a `.tgz`, computes `sha256`, `POST`s to registry.

5. Registry stores tarball + manifest metadata; rejects duplicate `@scope/name@version`.

### Flow B — Install into a project (detected tools)

1. Project already has `.cursor/` and/or `.claude/`.

2. Developer runs `aipm add @team/react-reviewer` or `aipm install`.

3. CLI detects tools:

   | Present in project | Detected |
   |--------------------|----------|
   | `.cursor/` only | `cursor` |
   | `.claude/` only | `claude` |
   | Both | `cursor` + `claude` |

4. **Install targets** = `manifest.targets ∩ detected_tools`.

5. If intersection is empty (e.g. package targets only `cursor` but project has only `.claude/`), **fail** with a clear error suggesting a compatible package or tool choice.

6. CLI downloads tarball, runs adapters, writes files, updates `aipm-lock.json`.

### Flow C — Install when no tool folder exists

1. Project has **neither** `.cursor/` nor `.claude/`.

2. CLI **prompts** (interactive):

   ```txt
   Which AI tool should this skill be installed for?
   > cursor
   > claude
   ```

3. User picks one option; CLI installs **only** to that tool (creates `.cursor/aipm/...` or `.claude/aipm/...` as needed).

4. Optional: persist choice in `aipm.package.json` under a project-level field (see schema below) so later `aipm install` does not re-prompt.

### Flow D — Init new project

```bash
aipm init
```

Creates `aipm.package.json` with `schemaVersion`, empty `packages`, and optional `preferredTools` after detection or prompt.

---

## Package format (skills only)

### Folder layout

```txt
@team/react-reviewer/          # folder name may differ; manifest.name is canonical
├── aipm.manifest.json
└── skill.md
```

### `aipm.manifest.json` (published package)

```json
{
  "schemaVersion": "0.1",
  "name": "@team/react-reviewer",
  "version": "1.0.0",
  "type": "skill",
  "description": "Reviews React code using team standards",
  "entry": "skill.md",
  "targets": ["cursor", "claude"],
  "license": "MIT"
}
```

**Validation rules:**

- `type` must be `"skill"`.
- `name` must match `@scope/name` (regex below).
- `version` must be valid semver.
- `entry` must exist in the tarball.
- `targets` must be a non-empty subset of `["cursor", "claude"]`.

### `@scope/name` regex

```txt
^@[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$
```

Examples: `@team/react-reviewer`, `@acme-corp/security-skill`  
Invalid: `react-reviewer`, `@team/`, `@/name`, `@TEAM/foo` (uppercase scope discouraged; normalize to lowercase on publish).

---

## Install outputs

Aligned with product docs — **skill** type only:

| Tool | Output path (v0) |
|------|------------------|
| `cursor` | `.cursor/aipm/skills/<short-name>.md` |
| `claude` | `.claude/aipm/skills/<short-name>/SKILL.md` |

`<short-name>` = segment after `/` in `@scope/name` (e.g. `@team/react-reviewer` → `react-reviewer`).

Adapters read `skill.md` from the tarball and write tool-native files. No AI conversion in this slice.

---

## Project files

### `aipm.package.json`

Declares which skills the project needs.

```json
{
  "schemaVersion": "0.1",
  "registry": "https://<azure-registry-host>",
  "preferredTools": ["cursor"],
  "packages": {
    "@team/react-reviewer": "1.0.0"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `schemaVersion` | yes | `"0.1"` |
| `registry` | yes | Base URL of Azure-hosted registry |
| `packages` | yes | Map of `@scope/name` → exact version or `^x.y.z` (MVP: prefer exact `1.0.0` first) |
| `preferredTools` | no | Set after user prompt when no `.cursor/` / `.claude/`; used to skip re-prompt |

Package keys must match `@scope/name`.

### `aipm-lock.json`

Source of truth for what is installed (reproducibility).

```json
{
  "schemaVersion": "0.1",
  "packages": {
    "@team/react-reviewer": {
      "version": "1.0.0",
      "integrity": "sha256-abc123...",
      "registry": "https://<azure-registry-host>",
      "resolvedTools": ["cursor"],
      "installed": {
        "cursor": [".cursor/aipm/skills/react-reviewer.md"]
      }
    }
  }
}
```

**Rules:**

- Update lockfile **only after** a successful install.
- Never store secrets.
- `resolvedTools` records what was actually targeted for that package.

---

## Tool detection algorithm

```txt
function resolveInstallTools(projectDir, manifest, packageJson):
  detected = []
  if exists(projectDir/.cursor): append cursor
  if exists(projectDir/.claude): append claude

  if detected is empty:
    if packageJson.preferredTools is non-empty:
      return packageJson.preferredTools filtered to cursor|claude
    else:
      choice = promptUser("cursor" | "claude")   # only these two
      optionally save choice to packageJson.preferredTools
      return [choice]

  return manifest.targets ∩ detected
```

**CLI flags (non-interactive / CI):**

```bash
aipm add @team/foo --target cursor
aipm install --target claude
```

When `--target` is set, skip prompt and use that single tool (still must be in `manifest.targets`).

---

## System architecture

```txt
┌─────────────┐     HTTPS      ┌──────────────────┐
│  aipm CLI   │ ──────────────►│  Registry API    │
│  + engine   │                │  (Node/Fastify)  │
│  + adapters │                └────────┬─────────┘
└──────┬──────┘                           │
       │ writes                           │
       ▼                          ┌───────┴────────┐
 .cursor/aipm/skills/             │                │
 .claude/aipm/skills/             ▼                ▼
 aipm-lock.json              Azure PostgreSQL   Azure Blob
                             (metadata)         (tarballs)
```

### Monorepo layout

```txt
aipm/
├── apps/
│   ├── cli/                 # aipm binary
│   └── registry-api/        # HTTP service
├── packages/
│   ├── schemas/             # Zod: manifest, package.json, lockfile
│   ├── engine/              # detect, download, install transaction
│   ├── adapter-cursor/
│   └── adapter-claude/
├── infra/
│   └── azure/               # Bicep or Terraform (App Service, DB, Storage)
└── specs/
    └── openapi.yaml         # registry MVP endpoints
```

---

## Registry API (no auth)

Base path: `/v1`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/packages/{name}/versions` | Publish tarball for `@scope/name` at a version |
| `GET` | `/packages/{name}/versions/{version}` | Package metadata + manifest |
| `GET` | `/packages/{name}/versions/{version}/tarball` | Download `.tgz` |
| `GET` | `/packages/{name}` | List versions or return latest (optional) |
| `GET` | `/health` | Liveness for Azure probes |

`{name}` is URL-encoded `@scope/name` (e.g. `%40team%2Freact-reviewer`).

### Publish request

`POST /v1/packages/@team/react-reviewer/versions`

- `Content-Type: multipart/form-data` or `application/octet-stream` + manifest JSON header
- Body: tarball bytes
- Server validates manifest inside tarball before accepting

**Responses:**

- `201` — created
- `409` — version already exists
- `400` — invalid manifest, name, or tarball

### Publish server-side checks

1. Tarball unpacks cleanly.
2. Contains `aipm.manifest.json` + `entry` file.
3. `manifest.name` matches URL `{name}`.
4. `manifest.type === "skill"`.
5. Semver valid; not already published for that name+version.
6. Compute `sha256`, store blob, insert Postgres row.

---

## Azure hosting (MVP)

### Recommended services

| Concern | Azure service | Notes |
|---------|---------------|-------|
| HTTP API | **Azure App Service** (Linux, Node 20) or **Azure Container Apps** | Start with App Service for simplicity |
| Metadata | **Azure Database for PostgreSQL** (Flexible Server) | Package name, version, manifest JSON, sha256, blob URL |
| Tarballs | **Azure Blob Storage** | Private container; API streams blobs to clients |
| Secrets (later) | **Azure Key Vault** | Not used until auth slice |
| DNS / TLS | **Azure Front Door** or App Service managed cert | Custom domain e.g. `registry.aipm.dev` |

### Environment variables (registry-api)

```txt
DATABASE_URL=postgresql://...
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=packages
PORT=8080
NODE_ENV=production
```

### Data model (Postgres)

**Table: `package_versions`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | text | `@scope/name`, indexed |
| `version` | text | semver |
| `manifest` | jsonb | full manifest |
| `integrity` | text | sha256 hex |
| `blob_path` | text | path in blob container |
| `size_bytes` | bigint | |
| `created_at` | timestamptz | |

Unique constraint: `(name, version)`.

### Local development

- **Option A:** Docker Compose — API + Postgres + Azurite (blob emulator)
- **Option B:** API uses local `./data/packages/` filesystem; swap to Azure Blob in staging

Production path uses real Azure resources; dev can use Azurite to avoid cloud cost during iteration.

---

## CLI commands (MVP)

| Command | Behavior |
|---------|----------|
| `aipm init` | Create `aipm.package.json`; detect tools or prompt; set `preferredTools` if prompted |
| `aipm add <@scope/name>[@version]` | Add to `aipm.package.json`, resolve version, download, install |
| `aipm install` | Install all entries in `aipm.package.json` |
| `aipm publish <dir>` | Validate folder, pack `.tgz`, upload to `--registry` |
| `aipm list` | Show packages from lockfile (optional but cheap) |

**Global flags:**

- `--registry <url>` — override default (else `aipm.package.json` → env `AIPM_REGISTRY`)
- `--target cursor|claude` — skip interactive tool prompt
- `--json` — machine-readable output (optional)
- `--ci` — non-interactive; fail if prompt would be required and `--target` missing

**Config file (optional):** `~/.aipm/config.json` for default registry URL only (no tokens yet).

---

## Install engine lifecycle

Internal phases (same philosophy as full AIPM docs):

```txt
plan → validate → download → unpack → adapt → apply → verify → commit lockfile
```

**Transaction rule:** write generated files to a temp directory first; on success, move into project and update `aipm-lock.json`. On failure, roll back temp writes; do not partially update lockfile.

**Idempotency:** Re-running `aipm install` with unchanged lockfile should no-op or verify files still match integrity.

---

## Adapter contract (skill only)

```typescript
interface SkillAdapter {
  tool: "cursor" | "claude";
  installSkill(input: {
    packageName: string;   // @scope/name
    version: string;
    skillMarkdown: string;
    projectRoot: string;
  }): Promise<{ writtenPaths: string[] }>;
}
```

Engine selects adapters based on `resolveInstallTools()` output.

---

## Build phases

### Phase A — Contracts (≈2–3 days)

- [ ] Zod schemas in `packages/schemas`
- [ ] `@scope/name` validator shared by CLI + registry
- [ ] OpenAPI spec for registry MVP endpoints
- [ ] Adapter TypeScript interface

### Phase B — Registry API (≈4–5 days)

- [ ] Fastify/Hono app with publish + fetch + health
- [ ] Postgres migrations
- [ ] Blob upload/download (Azurite locally, Azure Blob in staging)
- [ ] Publish validation pipeline

### Phase C — Engine + adapters (≈4–6 days)

- [ ] Tool detection + interactive prompt + `--target`
- [ ] Download tarball, verify sha256
- [ ] Cursor + Claude skill adapters
- [ ] Lockfile read/write
- [ ] Install transaction / rollback

### Phase D — CLI (≈2–3 days)

- [ ] `init`, `add`, `install`, `publish`, `list`
- [ ] Registry URL resolution
- [ ] Pack directory → `.tgz` for publish

### Phase E — Azure deploy + E2E (≈2–3 days)

- [ ] Infra: App Service + PostgreSQL + Storage (+ Azurite dev docs)
- [ ] Deploy registry to Azure staging
- [ ] E2E: publish skill → clone empty project → prompt → install → files exist
- [ ] E2E: project with `.cursor/` → install without prompt

**Exit criteria**

1. Publish `@team/sample-skill@1.0.0` to Azure-hosted registry (no auth).
2. On a machine with only `.cursor/`, `aipm add @team/sample-skill` installs under `.cursor/aipm/skills/`.
3. On a machine with no tool dirs, CLI prompts; user picks `claude`; install lands under `.claude/aipm/skills/`.
4. `aipm-lock.json` matches on repeat install.
5. Invalid names (`foo/bar` without `@`) rejected at publish and add.

---

## Security note (temporary)

With **no auth**, anyone who knows the registry URL can publish or overwrite if versions are mutable. For MVP/dev:

- Use private Azure networking or obscure staging URL.
- Treat **immutable versions** (`409` on republish) as the main guard.
- **Add auth before any public/production launch.**

---

## Future slices (not in this doc)

- API tokens + `aipm login`
- Scoped publishers (`@team` ownership)
- Rules + MCP package types
- Server-side security scan on publish
- `aipm update` / `aipm remove` / `aipm verify`
- Website for browse/search

---

## References

- `InitialDesignPlan/aipm_implementation_plan_v_0.md` — full phased roadmap
- `InitialDesignPlan/aipm_product_decisions_v_0.md` — adapters, lockfile, tool matrix
- `InitialDesignPlan/aipm_published_package_structure_v_0.md` — skill manifest examples

---

## Document history

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-05-20 | MVP slice: Azure, prompt on no tool dirs, `@scope/name`, no auth |
