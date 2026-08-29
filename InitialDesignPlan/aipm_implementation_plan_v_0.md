# AIPM Implementation Plan — v0

## Purpose

This document translates the AIPM product decisions and published package
structure into an actionable engineering plan.

It answers four questions:

1. What are we actually building? (surfaces)
2. How do those pieces fit together? (architecture)
3. In what order do we build them? (phased roadmap)
4. What concerns cut across every phase? (security, schemas, telemetry, etc.)

This is the **high-level outline**. Subsequent docs will break each workstream
into milestones, then into individual tasks.

---

## 1. Product Surfaces

AIPM is not a single app. It is an ecosystem with five user-facing surfaces and
several internal services. Every surface should feel like part of the same
product.

### 1.1 CLI (`aipm`)

The primary developer surface. Installed via `npm i -g aipm`, Homebrew, or a
direct binary. Used by humans during development and by CI systems for
reproducible installs.

### 1.2 Cloud Registry

The backbone. Hosts immutable package tarballs, metadata, accounts, scopes,
auth tokens, security scan results, and audit logs. Exposes a REST API
consumed by CLI, website, and desktop GUI.

### 1.3 Public Website (`aipm.dev` or similar)

Marketing, package discovery, account management, publisher dashboard, docs.
Renders security signals prominently so users can judge package trust before
install.

### 1.4 Desktop GUI

A cross-platform app for users who do not want to use the CLI. Browses
installed packages, runs installs, manages tokens, inspects security details,
detects AI tools on the machine. Reuses the CLI's install engine as a library —
no logic is duplicated.

### 1.5 Enterprise / Private Registry

Same registry codebase, deployable inside an organization (Docker/Helm) with
SSO, RBAC, audit logs, and policy enforcement. Optionally hosted by us as a
managed tier.

### 1.6 (Internal) MCP Server for AIPM

Optional surface mentioned in the product doc — exposes AIPM commands over MCP
so AI agents can install missing capabilities mid-task. Built on top of the
shared engine, not a separate runtime.

---

## 2. System Architecture (High Level)

```
            +-------------------+        +-------------------+
            |   Public Website  |        |    Desktop GUI    |
            |   (Next.js)       |        |  (Tauri + React)  |
            +---------+---------+        +---------+---------+
                      |                            |
                      | REST/JSON                  | calls engine
                      v                            v  + REST
            +--------------------+        +-------------------+
            |   Registry API     |<-------|    Shared Core    |
            |   (TS + Fastify)   |        |   Install Engine  |
            +----+---------+-----+        +---------+---------+
                 |         |                        ^
        +--------+         +---------+              |
        v                            v              | embedded
+---------------+          +--------------+         |
| Metadata DB   |          | Object Store |  +------+--------+
| (Postgres)    |          |  (S3/R2+CDN) |  |  CLI (aipm)   |
+---------------+          +------+-------+  |  Node binary  |
                                  |          +---------------+
                          +-------v--------+
                          | Scanner Workers|
                          | (Redis + queue)|
                          +----------------+
```

Key architectural ideas:

- **One install engine, three callers.** The CLI, Desktop GUI, and (optional)
  MCP server all import the same `@aipm/engine` package. Bugs are fixed once.
- **Stateless API, persistent registry.** Registry holds metadata + tarballs;
  scans are async; CLI/GUI never talk to the DB directly.
- **Adapters are first-class plugins inside the engine.** v0 ships official
  built-in adapters only (`cursor`, `claude`), but the interface is designed
  so external adapters can be added in v1+.
- **Lockfile is the source of truth, not the manifest.** Install behavior is
  driven by `aipm-lock.json`; the manifest is the user-editable intent file.

---

## 3. Workstreams

Eight parallelizable streams. The phased roadmap (section 5) sequences them.

### Workstream A — Foundations & Specifications

Lock down the formats and contracts everything else depends on. Cheap to do
upfront, expensive to change later.

- Final JSON schemas for `aipm.package.json`, `aipm.manifest.json`,
  `aipm-lock.json`, expressed as Zod (TypeScript) and exported as JSON Schema.
- Adapter interface contract (TypeScript types + reference implementation).
- Package tarball format (which files are required, max size, forbidden files).
- Registry REST API spec (OpenAPI 3) — publish, fetch, search, resolve, deprecate.
- Authentication & token format spec.
- Versioning policy for AIPM itself, for schemas, and for adapters.
- Naming conventions: `@scope/name`, reserved scopes, validation rules.

### Workstream B — CLI / Local Engine

The piece users touch every day. The local install engine lives here.

- Shared engine library (`@aipm/engine`):
  - manifest reader/writer
  - lockfile manager (read, write, verify, diff)
  - dependency resolver (semver)
  - adapter runtime (loads built-in adapters, invokes them per package)
  - tool detection (`.cursor/`, `.claude/`, CLI presence, user config)
  - transaction system (snapshot → apply → verify → commit / rollback)
  - cache manager (`~/.aipm/cache/`)
  - local security scanner (pattern-based)
- Cursor adapter (`@aipm/adapter-cursor`)
- Claude adapter (`@aipm/adapter-claude`)
- CLI binary (`@aipm/cli`):
  - commands: `init`, `install`, `add`, `remove`, `update`, `list`, `verify`,
    `clean`, `login`, `logout`, `whoami`, `scan`, `pack`, `publish`, `repair`
  - flags: `--dry-run`, `--ci`, `--target`, `--global`, `--partial`
  - interactive prompts (where appropriate) + non-interactive CI mode
  - structured logging + machine-readable output (`--json`)
- Installation channels: npm global, Homebrew tap, standalone binaries
  (later, via `pkg`/`bun build` or a Rust rewrite of hot paths).

### Workstream C — Cloud Registry / Backend

The service that makes packages discoverable, immutable, and trusted.

- Registry API service (TypeScript + Fastify or Hono):
  - publish, fetch tarball, version resolution, search, package detail,
    deprecate, block, security status fetch
- Metadata database (Postgres):
  - accounts, scopes, scope memberships + roles
  - packages, versions, manifests, dependencies, permissions
  - publisher identity, signatures
  - security scan results
  - audit log
  - download counters
- Object storage for tarballs (S3 or Cloudflare R2) behind CDN.
- Search:
  - v0: Postgres full-text search
  - upgrade path: Meilisearch / Typesense
- Async work:
  - Redis + BullMQ (or SQS) queue
  - scanner workers run security checks after upload
  - signature verifier
- Auth system:
  - email/password + OAuth (GitHub, Google) via something like Clerk/Auth0
    or a hand-rolled implementation if we want full control
  - personal access tokens for the CLI (`aipm login --token`)
  - org-level service tokens (for CI)
- Anti-abuse: rate limits, reserved scopes, takedown workflow.
- Operations: structured logs, metrics, distributed tracing, on-call alerts.

### Workstream D — Public Website

Where humans discover packages and manage their accounts.

- Next.js (App Router) + React + Tailwind. Same monorepo as backend for
  shared types/Zod schemas.
- Pages:
  - marketing landing + features
  - docs (separate or embedded)
  - search + filters (type, target, security status, publisher)
  - package detail (versions, README, dependencies, permissions, MCP risk,
    publisher, security status, install command, download stats)
  - publisher / scope pages
  - account (signup, login, password reset, profile)
  - token management (create, list, revoke)
  - scope management (members, roles, invites)
  - publisher dashboard (own packages, publish stats, scan results)
  - admin tools (for our team — block, deprecate, takedown)
  - status page
- SEO + sitemap for package pages.
- Auth flow integrated with registry API.

### Workstream E — Desktop GUI

For users who prefer a GUI over a terminal.

- Tauri (Rust shell + web frontend) — smaller bundle, native feel.
- React frontend (shares components and styling with the website where it
  makes sense).
- Embeds `@aipm/engine` as a Node sidecar (so install logic stays identical
  to the CLI).
- Core flows:
  - open a project folder → see manifest + lockfile state
  - browse installed packages, global packages
  - install / remove / update via UI
  - search public registry from inside the app
  - view security details, permission requests, MCP risk
  - update diff viewer (versions + permission changes side-by-side)
  - login / token management
  - auto-detect AI tools on the machine + suggest installs
- Update mechanism: Tauri's built-in updater.
- Packaging: signed builds for macOS, Windows, Linux (deb/rpm/AppImage).

### Workstream F — Security & Trust Layer

Cross-cuts B, C, D, E. Owned as its own stream so it does not get neglected.

- Server-side scanner pipeline:
  - manifest validity
  - prompt-injection patterns
  - secret-exfiltration heuristics
  - obfuscated/hidden instruction detection
  - dangerous MCP config detection
  - suspicious URLs
  - dependency risk scoring
  - signature validation
- Risk classification (`secure` / `warning` / `blocked`) — surfaced everywhere
  (registry API, CLI install output, website package page, desktop GUI).
- MCP risk levels (`low` / `medium` / `high` / `critical`) gating install
  prompts.
- Package signing:
  - publisher keys generated on the website
  - CLI signs tarballs at publish time
  - registry stores signatures, CLI verifies on install
  - v0 can start with HMAC over publisher tokens and upgrade to asymmetric
    signing later
- Permission diff engine on update.
- Reporting flow (`Report this package` UI → admin queue).

### Workstream G — Enterprise / Private Registry

Same code as the public registry, hardened for self-hosting and org control.

- Deployment: Docker images + Helm chart + Terraform module.
- SSO: OIDC + SAML; map IdP groups to scope roles.
- Org policies: enforce install mode (`strict`/`normal`/`unsafe`), allowlist
  publishers, block specific packages or permissions.
- Audit logs (who installed/published what, when, with which token).
- Mirroring: optionally mirror approved public packages internally for
  air-gapped or compliance-sensitive setups.
- Managed tier (we host private registries for paying customers) — same
  binary, different deployment.

### Workstream H — Quality, Operations, Documentation

The unsexy work that decides whether the product survives contact with users.

- Testing strategy:
  - unit tests for engine, adapters, resolver
  - integration tests for CLI commands (install/remove/update/verify lifecycle)
  - contract tests between CLI and registry
  - end-to-end tests covering publish → install → verify
  - golden-file tests for adapter outputs (so adapter changes are
    intentional, not accidental)
- CI/CD:
  - GitHub Actions (or similar) for every package in the monorepo
  - automated releases (changesets) for CLI, engine, adapters
  - canary deploys for registry
- Observability:
  - structured logs (JSON) everywhere
  - metrics (Prometheus / OTel)
  - tracing (OpenTelemetry)
  - error tracking (Sentry)
- Documentation:
  - user docs (install, getting started, manifest reference, lockfile,
    security model, CLI reference)
  - publisher docs (how to publish, signing, scopes)
  - API reference (auto-generated from OpenAPI)
  - architecture docs (ADRs in-repo)
- Telemetry (strictly opt-in): anonymous install counts, command usage,
  error categories. Document it clearly, make opt-out trivial.
- Crash reporting: opt-in, scrubbed.

---

## 4. Recommended Technology Stack

These are starting points, not religious commitments. Rationale included so we
can revisit specific choices when we hit their limits.

| Surface              | Choice                          | Rationale                                                                                     |
| -------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| CLI                  | Node.js + TypeScript            | Fast iteration; ships via npm; shares engine code with Desktop GUI; rewrite hotspots later if startup time becomes a problem. |
| Engine library       | TypeScript                      | Same runtime as CLI, importable by Desktop GUI's Node sidecar.                                |
| Registry API         | TypeScript + Fastify (or Hono)  | Shares schemas with CLI; fast enough; large ecosystem.                                        |
| Metadata DB          | Postgres                        | Reliable, relational data with FTS for search until we outgrow it.                            |
| Object storage       | Cloudflare R2 (or AWS S3)       | Cheap egress (R2); standard S3 API.                                                           |
| CDN                  | Cloudflare                      | Sits naturally in front of R2; global edge.                                                   |
| Queue                | Redis + BullMQ                  | Simple, well-understood; upgrade to SQS/NATS at scale if needed.                              |
| Search               | Postgres FTS → Meilisearch      | Defer the dedicated search service until v0 search hurts.                                     |
| Auth                 | Hand-rolled or Clerk/WorkOS     | Hand-rolled gives full control over tokens/scopes; Clerk/WorkOS shortens the path to SSO.     |
| Website              | Next.js + React + Tailwind      | SSR for package pages (SEO), shared types with backend, fast to build.                        |
| Desktop GUI          | Tauri + React                   | Small bundle, native feel, Rust shell; can embed Node sidecar for engine.                     |
| Enterprise deploy    | Docker + Helm + Terraform       | Standard self-host stack; works in most enterprise environments.                              |
| Monorepo tooling     | pnpm workspaces + Turborepo     | First-class TypeScript support, incremental builds, simple.                                   |
| Schema validation    | Zod (+ generated JSON Schema)   | One source of truth, types and runtime validation in one place.                               |
| API contract         | OpenAPI 3                       | Auto-generates CLI client + docs; standard for enterprise integrations.                       |
| Testing              | Vitest + Playwright             | Vitest for unit/integration; Playwright for website + desktop e2e.                            |
| Observability        | OpenTelemetry + Sentry          | Vendor-neutral telemetry; Sentry for errors.                                                  |

Open question to revisit: would a Go or Rust CLI be worth the implementation
cost? Decision deferred until we see real-world startup time on the Node CLI.

---

## 5. Phased Roadmap

Phases are designed so each one produces something usable. Later phases can
overlap with earlier ones once foundational pieces ship.

### Phase 0 — Foundations (weeks 0–2)

Goal: nothing yet builds, but everyone agrees on what to build against.

- Final schemas (Zod + JSON Schema) for the three manifest files.
- Adapter interface contract + a reference adapter stub.
- Registry OpenAPI 3 spec.
- Monorepo scaffold with CI green on an empty test suite.
- Decision log: stack confirmations, repo strategy, naming.

Exit criteria: any engineer can read the specs and start building their
workstream without blocking on architecture questions.

### Phase 1 — CLI Local Alpha (weeks 2–6)

Goal: install a real package from a local tarball end-to-end, with rollback.

- Shared engine library: manifest, lockfile, resolver, transaction, scanner.
- Cursor + Claude adapters (skill, rule, MCP).
- CLI commands: `init`, `install` (from local file/dir), `add`, `remove`,
  `update`, `list`, `verify`, `clean`, `scan`, `pack`.
- Golden-file tests for adapter outputs.
- No network, no registry yet.

Exit criteria: clone a repo with an `aipm.package.json` pointing at local
packages, run `aipm install`, and the right files appear under
`.cursor/aipm/` and `.claude/aipm/` with a valid `aipm-lock.json`.

### Phase 2 — Registry MVP (weeks 4–10, overlaps with Phase 1)

Goal: real packages live in the cloud and can be fetched by version.

- Registry API: accounts, scopes, publish, fetch, resolve, search (basic).
- Postgres schema + migrations.
- Object storage + CDN wired up.
- Token-based CLI auth.
- Minimal website: signup, login, token page, package detail page.
- Admin dashboard for our team (block, deprecate).

Exit criteria: we can publish a package via API and another machine can fetch
it by name and version.

### Phase 3 — CLI ↔ Registry Integration (weeks 10–13)

Goal: the public install flow works end-to-end.

- CLI: `login`, `logout`, `whoami`, `publish`, registry-backed `install`.
- Lockfile records integrity hash, signature reference, security status,
  registry source, adapter version.
- Local cache (`~/.aipm/cache/`).
- Offline reinstall from lockfile + cache.

Exit criteria: `git clone → aipm install` works against the public registry.

### Phase 4 — Security & Trust Layer (weeks 13–17)

Goal: the registry is not just a CDN; it is a trust system.

- Server-side scanner with rules-based detectors.
- Risk classification surfaced through CLI, website, lockfile.
- Package signing pipeline (publisher keys, signed tarballs, verified
  install).
- Permission diff on `aipm update`.
- MCP risk levels gating installs.
- `aipm install --strict` / `--unsafe` modes.

Exit criteria: a known-bad package is auto-blocked; a borderline package
shows a warning at install time with a clear permission diff.

### Phase 5 — Public Website v1 (weeks 15–20, overlaps with Phase 4)

Goal: a real product surface for discovery and trust.

- Full search + filters.
- Package detail pages with security info front and centre.
- Publisher pages, scope pages.
- Docs site live.
- Status page.
- Marketing landing page polished.

Exit criteria: a stranger can land on the homepage, find a package, judge
whether it is safe, and install it.

### Phase 6 — Desktop GUI v1 (weeks 18–26, overlaps with Phase 5)

Goal: feature parity with the CLI for the most common flows.

- Tauri shell + React frontend.
- Project picker, installed/global package views.
- Install/remove/update via UI.
- Registry browse + search inside the app.
- Security info + permission diff visualised.
- Login / token management.
- Auto-detect AI tools.
- Signed builds for macOS, Windows, Linux.

Exit criteria: a non-CLI user can install and manage AIPM packages without
ever opening a terminal.

### Phase 7 — Enterprise / Private Registry (weeks 24–32)

Goal: an organization can self-host AIPM behind their firewall.

- Docker images + Helm chart + Terraform module.
- SSO (OIDC + SAML), IdP group mapping to scope roles.
- Org-level policy enforcement.
- Audit logs.
- Public-package mirroring.
- Managed-tier offering (we host private registries).

Exit criteria: a customer can stand up a private registry, point their team's
CLIs at it, and enforce a policy that blocks unverified publishers.

### Phase 8 — Polish & v1.0 (ongoing)

Goal: leave beta.

- Additional adapters: Continue, Cline, Aider, OpenAI Custom GPTs.
- Performance work (CLI startup, registry latency).
- Telemetry (opt-in) + analytics.
- AIPM MCP server (so agents can install packages mid-task).
- Documentation polish, example packages, tutorials.
- Marketing push, ecosystem seeding.

---

## 6. Repository / Codebase Layout

Recommendation: **single monorepo** managed with pnpm workspaces + Turborepo.
Reasons: shared TypeScript types, atomic schema changes, one CI configuration,
one release process.

```
aipm/
├── apps/
│   ├── cli/                 # @aipm/cli — the aipm binary
│   ├── registry-api/        # registry HTTP service
│   ├── scanner/             # security scanner workers
│   ├── website/             # Next.js site
│   └── desktop/             # Tauri app
├── packages/
│   ├── engine/              # @aipm/engine — shared install engine
│   ├── schemas/             # Zod schemas + generated JSON Schema
│   ├── api-client/          # generated from OpenAPI; used by CLI + GUI + web
│   ├── adapter-cursor/      # cursor adapter
│   ├── adapter-claude/      # claude adapter
│   ├── adapter-sdk/         # public adapter interface (for future external adapters)
│   ├── scanner-rules/       # shared rule library used by local scan + server scan
│   ├── ui/                  # shared React components for website + desktop
│   └── config/              # shared eslint, tsconfig, prettier, etc.
├── infra/
│   ├── terraform/           # cloud infra
│   ├── docker/              # Dockerfiles for self-host
│   └── helm/                # Helm chart for enterprise
├── docs/                    # user + publisher + API docs (source)
└── specs/
    ├── openapi.yaml
    ├── manifest-schema.json
    ├── package-schema.json
    └── lockfile-schema.json
```

---

## 7. Cross-Cutting Concerns

Things that touch every workstream. Decide once, enforce everywhere.

### 7.1 Shared Engine Discipline

Any install logic that exists in two places is a bug waiting to happen. The
CLI, Desktop GUI, and AIPM MCP server must all route through `@aipm/engine`.
If a flow needs new logic, it goes in the engine first.

### 7.2 Schema Versioning

`schemaVersion` fields appear in all three manifest files for a reason.
Treat schema bumps as breaking changes — they need migration tooling, not
silent acceptance. Document migration paths from day 1.

### 7.3 Backward Compatibility

Lockfiles must remain readable across CLI versions, or installs break in
hostile ways (CI failures, lost reproducibility). Add a compatibility test
suite that exercises old lockfile formats against current code.

### 7.4 Privacy & Telemetry

Telemetry is opt-in and clearly described. Lockfiles never store secrets.
The registry never logs install command arguments that contain user data.
Make these non-negotiable from the start; retrofitting privacy is painful.

### 7.5 Security Response Process

Define before launch: who triages reports, takedown SLA, how we notify
affected users, how blocked-package warnings propagate via `aipm verify`.

### 7.6 Documentation as a Workstream

Docs are not a Phase-8 polish task. Every command, schema field, and adapter
output ships with documentation when it ships in code. Treat doc gaps as
shipped bugs.

### 7.7 Open Source Strategy

The product doc commits to open source. Decide early:
- which packages are open source (likely: engine, schemas, adapters, CLI,
  adapter-sdk, scanner-rules)
- which are source-available or closed (likely: managed-tier control plane,
  proprietary scanners)
- license (Apache 2.0 is a strong default for ecosystem packages)
- contributor guide + DCO/CLA

---

## 8. Risks & Open Questions

Things we should flag now so they get explicit attention, not silent neglect.

1. **CLI distribution.** npm global installs are convenient but have well-known
   permission and PATH issues. Plan Homebrew + standalone binaries early.
2. **Adapter drift.** Cursor and Claude change their config formats. We need a
   compatibility-matrix test suite that runs against real tool versions.
3. **Scanner false positives.** Pattern-based prompt-injection detection will
   misfire. We need a clear appeals/whitelist process before launch.
4. **Signing key management.** Lost publisher keys are catastrophic. Build
   key rotation and recovery into the publisher flow before opening publishing
   to outside users.
5. **MCP transport diversity.** MCP servers may be stdio, HTTP, SSE, or
   future transports. The MCP adapter abstraction needs room to grow.
6. **Monorepo handling deferred.** The product doc lists monorepo support as
   unresolved. We should at least decide how `aipm` behaves when invoked from
   a subdirectory of a workspace before Phase 1 ships.
7. **Enterprise sales motion.** Phase 7 implies a paid tier. Pricing,
   contracting, and support tiers are out of scope here but need their own
   plan before we accept enterprise customers.

---

## 9. Next Steps

This document is intentionally high-level. The next moves are:

1. Confirm the surfaces and phase boundaries in this plan.
2. Break Phase 0 into individual tasks (schema files, repo scaffold, CI,
   decision log entries) — this is the next planning doc.
3. Break Phase 1 into individual tasks (engine modules, adapter contracts,
   CLI commands, transaction system, tests) — the planning doc after that.
4. After Phase 0 and Phase 1 plans exist, start writing code against them.

Each subsequent breakdown should bottom out at tasks that take at most a few
days each, with clear "done" criteria.
