# User GitHub Skill Import Implementation Plan

> **For agentic workers:** Implement task-by-task. Spec: `docs/superpowers/specs/2026-09-04-github-import-user-design.md`.

**Goal:** Org owners/admins import one public GitHub skill they own into the selected AIPM org via preview → review → confirm on `/dashboard/packages`.

**Architecture:** Extend GitHub OAuth (login email collision + connect-to-account). New org-scoped preview/confirm APIs that fetch GitHub, check ownership, and publish as the session user into `:org` (not as the GitHub repo owner). Dashboard import panel + discovery docs.

**Tech Stack:** Fastify, Postgres, Next.js, existing `import-from-github.ts` / `admin-import.ts` helpers, session cookies.

## Global Constraints

- One skill per URL; collections hard-stop (no user bulk)
- Public GitHub repos only; personal owner or org admin
- Skill files locked; manifest metadata editable
- Publisher = session user + selected org
- Admin import unchanged
- No account merge on connect/login collisions

---

### Task 1: DB + GitHub OAuth connect / login email rules

**Files:**
- Modify: `apps/registry-api/src/db.ts` — `linkGithubToUser`, `getUserByGithubId`
- Modify: `apps/registry-api/src/user-auth.ts` — scopes, connect start, callback intents, email collision, short-lived GitHub token cookie
- Modify: `apps/registry-api/src/index.ts` — `/v1/auth/github/connect` route
- Modify: `apps/web/next.config.ts` — redirect for connect start
- Test: `apps/registry-api/src/user-auth.test.ts` (extend) or new `github-connect.test.ts`

**Steps:**
- [x] OAuth scopes: `read:user user:email public_repo`
- [x] Login callback: if GitHub email matches email-auth `primary_email` → refuse; else upsert GitHub user and store email as `contact_email` only
- [x] Connect: require session; state `intent=connect`; on success attach github to current user or error without merge
- [x] Short-lived httpOnly cookie for GitHub access token (≤10 min) after login/connect for org-admin checks
- [x] Tests for collision + connect success/fail

### Task 2: Ownership + preview/confirm helpers

**Files:**
- Create: `apps/registry-api/src/user-github-import.ts`
- Create: `apps/registry-api/src/user-github-import.test.ts`
- Modify: `apps/registry-api/src/admin-import.ts` — extract `publishImportedSkillForOrg` (or add alongside)
- Modify: `apps/registry-api/src/import-from-github.ts` — export helpers needed for entry/root listing if not already

**Steps:**
- [x] `assertPublicRepoImportAllowed(repo, githubLogin, userToken)`
- [x] Preview: resolve folder; collection → error; no SKILL.md → entry_required + root files; SKILL.md wins; prefill manifest for `@org/slug`
- [x] Confirm: re-fetch, commit match, validate manifest, pack with GitHub files + edited manifest, publish as session user
- [x] Unit tests with mocked GitHub

### Task 3: Org import API routes

**Files:**
- Modify: `apps/registry-api/src/index.ts`
- Create: `apps/registry-api/src/user-github-import.integration.test.ts` (or route tests)

**Steps:**
- [x] `POST /v1/orgs/:org/imports/github/preview` (rate limit 10/min)
- [x] `POST /v1/orgs/:org/imports/github` (rate limit 5/min)
- [x] Require owner/admin + github linked; return stable error codes from spec
- [x] Tests: authz, collection, entry_required, version conflict

### Task 4: Dashboard import UI

**Files:**
- Create: `apps/web/components/github-import-panel.tsx` (+ CSS module if needed)
- Modify: `apps/web/components/dashboard-ui.tsx` — mount in `PackagesContent`
- Modify: `apps/web/lib/registry.ts` — `GITHUB_CONNECT_URL` if needed

**Steps:**
- [x] Connect GitHub CTA when `!githubLogin`
- [x] URL → preview → entry picker → review form → confirm
- [x] Owner/admin only; members see disabled copy
- [x] Show updateNotice; refresh package list on success

### Task 5: Discovery docs

**Files:**
- Create: `apps/web/app/publish/github/page.tsx`
- Modify: `apps/web/lib/docs-nav.ts`
- Modify: `apps/web/app/publish/guide/page.tsx`, `apps/web/app/publish/page.tsx`
- Modify: `apps/web/components/directory-list-tile.tsx`

**Steps:**
- [x] Doc page with steps + links to login / dashboard packages
- [x] Nav + publish pages + directory tile line

### Task 6: Verify

- [x] `pnpm --filter @aipm-registry/registry-api test` (relevant files)
- [x] Typecheck registry-api + web
- [ ] Admin import still bulk-imports collections
