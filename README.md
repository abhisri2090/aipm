# AIPM

Open-source **AI package manager** — publish and install AI skills into Cursor and Claude project folders.

Repository: [https://github.com/abhisri2090/aipm](https://github.com/abhisri2090/aipm)

## Monorepo layout

```txt
apps/
  cli/              → `aipm` CLI
  registry-api/     → HTTP registry (Azure-ready)
packages/
  schemas/          → Zod schemas + @scope/name validation
  engine/           → install engine + tool detection
  adapter-cursor/   → Cursor skill adapter
  adapter-claude/   → Claude skill adapter
  adapter-sdk/      → adapter interface
```

Design docs: `InitialDesignPlan/` and `docs/adr/`.

## Prerequisites

- Node.js 20+
- pnpm 9 (`corepack enable`)
- Docker (optional — for Postgres; registry falls back to file metadata if Postgres is down)
- `tar` (macOS/Linux built-in)

## Quick start (local)

```bash
pnpm install
pnpm build

# Registry API — keep this terminal open (Postgres optional; file metadata fallback)
pnpm registry
# or: pnpm --filter @aipm/registry-api build && pnpm --filter @aipm/registry-api start

# Publish sample skill (another terminal)
node apps/cli/dist/bin.js publish examples/skills/@team/sample-skill \
  --registry http://localhost:8080

# Install into a project
mkdir -p /tmp/my-app/.cursor
cd /tmp/my-app
node /path/to/aipm/apps/cli/dist/bin.js init --registry http://127.0.0.1:8080
node /path/to/aipm/apps/cli/dist/bin.js add @team/sample-skill@1.0.0
```

### Install the `aipm` command (no full path)

**Option A — global `aipm` command (recommended)**

```bash
cd /path/to/aipm
pnpm cli:link
```

Uses `npm link` so `aipm` is on your PATH (works with nvm: `~/.nvm/.../bin/aipm`).  
After you change CLI code, run `pnpm build` again (link stays valid).

Then from any folder:

```bash
aipm init --registry http://localhost:8080
aipm publish ./my-skill --registry http://localhost:8080
aipm add @team/sample-skill@1.0.0
```

To remove: `pnpm cli:unlink`

**pnpm global instead:** run `pnpm setup` once, then `pnpm -C apps/cli link --global`.

**Option B — from repo root only**

```bash
pnpm build
pnpm aipm init --registry http://localhost:8080
```

**Option C — after npm publish (later)**

```bash
npm install -g @aipm/cli
```

## Scripts


| Command      | Description               |
| ------------ | ------------------------- |
| `pnpm build` | Build all packages        |
| `pnpm test`  | Run tests                 |
| `pnpm lint`  | ESLint                    |
| `pnpm dev`   | Dev mode (registry watch) |


## Current scope (shipped in repo)

- Skill packages only (`type: skill`)
- Registry: publish + fetch (**no auth yet**)
- CLI: `init`, `add`, `install`, `publish`, `list`
- Tools: `cursor`, `claude` (auto-detect or prompt)
- Monorepo + CI + local Postgres dev stack

Details: `InitialDesignPlan/aipm_mvp_skill_registry_plan_v0.md`.

## What's next (roadmap)

Work is ordered so each step is usable on its own. Full plan: `InitialDesignPlan/aipm_implementation_plan_v_0.md`.

### Near term — finish MVP slice

- **Azure staging** — deploy `registry-api` (App Service + PostgreSQL + Blob Storage)
- **Hardening** — install transactions/rollback, golden-file adapter tests, E2E publish → install
- **CLI lifecycle** — `update`, `remove`, `verify`, `clean`, `pack`
- **Auth** — `aipm login` / tokens, scoped publishers (`@scope` ownership)
- **Distribution** — npm global binary, clearer Windows/macOS install story

### Medium term — registry + trust

- **Package types** — `rule`, `mcp`, `environment` bundles (not just `skill`)
- **Dependencies** — semver resolve, conflict detection, lockfile-driven installs
- **Security layer** — server-side scan on publish, risk levels, signing, `install --strict`
- **Public website** (`apps/website`) — search, package pages, publisher dashboard, docs
- **Local cache** — `~/.aipm/cache/`, offline reinstall from lockfile

### Later — product surfaces

- **Desktop GUI** (`apps/desktop`) — Tauri + React, same engine as CLI
- **Enterprise registry** — Docker/Helm, SSO, RBAC, audit logs, private `@company/`* scopes
- **More adapters** — Continue, Cline, Aider, OpenAI Custom GPTs, etc.
- **AIPM MCP server** — agents can install missing skills mid-task
- **Global scope** — `aipm install -g` for user-wide packages

- AI-assisted install/conversion (optional model token later)
- Full runtime observability inside AI tools

## License

Apache-2.0