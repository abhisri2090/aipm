# AIPM

Open-source **AI package manager** — publish and install AI skills into Cursor and Claude project folders.

Repository: [https://github.com/aipm-registry/aipm](https://github.com/aipm-registry/aipm)

## What is open source?

This repository is intended to be public. It includes the CLI, registry API,
Next.js website/docs/dashboard, shared schemas, install engine, tool adapters,
deployment scripts, and examples.

Production secrets and service state are not part of the open-source project.
Do not commit `.env` files, Azure publish profiles, storage keys, database URLs
with credentials, Key Vault values, SSH keys, publish tokens, or private
customer/project data. Use `.env.example` and the deployment docs as templates.

## Monorepo layout

```txt
apps/
  cli/              → `aipm` CLI
  registry-api/     → HTTP registry (Azure-ready)
  web/              → Next.js website, registry UI, docs, and publisher dashboard
packages/
  schemas/          → Zod schemas + @scope/name validation
  engine/           → install engine + tool detection
  adapter-cursor/   → Cursor skill adapter
  adapter-claude/   → Claude skill adapter
  adapter-sdk/      → adapter interface
```

Design docs: `InitialDesignPlan/`.

Security policy and public package safety guidance: [`SECURITY.md`](SECURITY.md) and [aipm-registry.com/security](https://aipm-registry.com/security). Privacy notice: [aipm-registry.com/privacy](https://aipm-registry.com/privacy). Terms and acceptable use: [aipm-registry.com/terms](https://aipm-registry.com/terms). Product roadmap: [aipm-registry.com/roadmap](https://aipm-registry.com/roadmap). Changelog: [aipm-registry.com/changelog](https://aipm-registry.com/changelog). Skill templates: [aipm-registry.com/templates](https://aipm-registry.com/templates). Supported targets: [aipm-registry.com/targets](https://aipm-registry.com/targets). Examples: [aipm-registry.com/examples](https://aipm-registry.com/examples). Glossary: [aipm-registry.com/glossary](https://aipm-registry.com/glossary).

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
# or: pnpm --filter @aipm-registry/registry-api build && pnpm --filter @aipm-registry/registry-api start

# Publish sample skill (another terminal)
node apps/cli/dist/bin.cjs publish examples/skills/@team/sample-skill \
  --registry http://localhost:8080

# Install into a project
mkdir -p /tmp/my-app/.cursor
cd /tmp/my-app
node /path/to/aipm/apps/cli/dist/bin.cjs init --registry http://127.0.0.1:8080
node /path/to/aipm/apps/cli/dist/bin.cjs add @team/sample-skill@1.0.0
```

## Install AIPM

After the CLI is published to npm:

```bash
npm install -g @aipm-registry/cli
aipm init
aipm add @team/sample-skill@0.0.1780307807
```

The installed CLI uses `https://aipm-registry.com` by default. For local
development, pass `--registry http://127.0.0.1:8080` or set `AIPM_REGISTRY`.

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
aipm init --registry https://aipm-registry.com
aipm publish init --name @team/review-helper --template code-review
aipm publish add .
AIPM_TOKEN=<5-minute-token> aipm publish push --yes
aipm add @team/sample-skill@1.0.0
```

To remove: `pnpm cli:unlink`

**pnpm global instead:** run `pnpm setup` once, then `pnpm -C apps/cli link --global`.

**Option B — from repo root only**

```bash
pnpm build
pnpm aipm init --registry https://aipm-registry.com
```

Public registry reads and installs do not need a token. Publishing uses the
website dashboard for GitHub sign-in, org/package reservation, and short-lived
publish tokens. Pass the token with `--token` or `AIPM_TOKEN`.

**Option C — npm package**

```bash
npm install -g @aipm-registry/cli
```

## Scripts


| Command      | Description               |
| ------------ | ------------------------- |
| `pnpm build` | Build all packages        |
| `pnpm test`  | Run tests                 |
| `pnpm lint`  | ESLint                    |
| `pnpm typecheck` | TypeScript checks     |
| `pnpm scan:secrets` | Scan tracked and untracked non-ignored files for common secret leaks |
| `pnpm dev`   | Dev mode (registry watch) |

## Before making a branch public

Run:

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
pnpm scan:secrets
```

Also check `git status --short` and review every untracked file. If you deploy
from this repo, keep cloud credentials in GitHub/Vercel/Azure secret stores, not
in the repository.


## Current scope (shipped in repo)

- Skill packages only (`type: skill`)
- Registry: public read/search/install APIs and token-gated publish
- CLI: `init`, `add`, `install`, `publish`, `list`, `doctor`
- Tools: `cursor`, `claude` (auto-detect or prompt)
- Publisher accounts: GitHub sign-in, profile, org namespaces, package reservations, and 5-minute publish tokens
- Public website: search, package pages, dashboard, docs, SEO pages, security/privacy/terms/status, and roadmap
- Monorepo + CI + repo secret scanning + local Postgres dev stack + Azure/Vercel deployment paths

Details: `InitialDesignPlan/aipm_mvp_skill_registry_plan_v0.md`.

## What's next (roadmap)

Work is ordered so each step is usable on its own. Full plan: `InitialDesignPlan/aipm_implementation_plan_v_0.md`.

### Near term — reliability and release polish

- **Production verification** — keep HTTPS, headers, `/health`, `/ready`, search, install, and publish-auth checks automated
- **Hardening** — publish consistency, rollback, backup/restore drills, stronger scan coverage, golden-file adapter tests, E2E publish → install
- **CLI lifecycle** — `update`, `remove`, `verify`, `clean`, `pack`
- **Dashboard polish** — clearer failed-publish feedback, package version history, token expiry states, and profile completeness
- **Distribution** — clearer Windows/macOS install story and release checklist

### Medium term — registry + trust

- **Package types** — `rule`, `mcp`, `environment` bundles (not just `skill`)
- **Dependencies** — semver resolve, conflict detection, lockfile-driven installs
- **Security layer** — server-side scan on publish, risk levels, signing, `install --strict`
- **Trust workflows** — abuse reporting, takedown/appeal, owner transfer, verified publisher labels
- **Private packages** — org access controls and private `@company/` scopes
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
