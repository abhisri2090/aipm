# Prompt Edit Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let prompt owners and org owners/admins edit published prompts via the existing submission form, with server-side authorization on PATCH.

**Architecture:** Add `PATCH /v1/prompts/:publisher/:slug` with shared validation from create. Expose `canEdit` on GET responses using the same access helper. Reuse `PromptSubmissionForm` in edit mode at `/prompts/[publisher]/[slug]/edit`, and show Edit on directory cards + detail pages when `canEdit` is true.

**Tech Stack:** Fastify registry-api, Postgres, blob storage, Next.js App Router, existing `api` client + multipart FormData.

## Global Constraints

- Edit access: original `owner_user_id`, or org **owner** / **admin** only
- Publisher locked; slug editable (old URL breaks)
- Keep sample image unless replaced; clear only when output no longer includes `image`
- Backend must re-check auth on every PATCH; never trust client `canEdit`

---

### Task 1: Backend access helper + PATCH + canEdit

**Files:**
- Modify: `apps/registry-api/src/prompt-routes.ts`
- Modify: `apps/registry-api/src/prompt-routes.test.ts` (unit helpers if exported)
- Test: extend unit tests; add route integration coverage if existing harness fits, else focused unit tests for helpers + manual verify notes

- [ ] Add `userCanEditPrompt` helper (owner OR org owner/admin via membership lookup)
- [ ] Attach `canEdit` on summarize/detail when request user known
- [ ] Implement authenticated multipart PATCH with sample-image keep/replace/clear rules
- [ ] Notify search index when slug/path changes

### Task 2: Web edit form + page

**Files:**
- Modify: `apps/web/lib/prompts.ts` (`canEdit` on types)
- Modify: `apps/web/components/prompt-submission-form.tsx`
- Create: `apps/web/app/prompts/[publisher]/[slug]/edit/page.tsx`

- [ ] Accept `mode` + initial prompt; prefill; lock publisher
- [ ] Submit PATCH; keep existing image unless new file; navigate to updated path
- [ ] Edit page loads prompt, gates unauthorized users

### Task 3: Edit affordances

**Files:**
- Modify: `apps/web/components/prompt-directory.tsx` (+ CSS)
- Modify: `apps/web/app/prompts/[publisher]/[slug]/page.tsx` (+ client edit control if needed)

- [ ] Edit link on card (outside card Link) when `canEdit`
- [ ] Edit action on detail when `canEdit` (client fetch of authenticated detail or `/v1/me` + roles)

**Note:** Public SSR `getPrompt` has no cookies. Prefer client-side check: fetch authenticated GET detail (with credentials) or compute from `/v1/me` + `/v1/orgs`. Simplest: list/detail client fetch already uses `api` with cookies for directory; for SSR detail page add a small client `PromptEditLink` that GETs the prompt with credentials and shows Edit when `canEdit`.
