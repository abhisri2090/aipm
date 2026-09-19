# Prompt Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add permanent prompt delete from the edit page with type-to-confirm (slug) and redirect to `/dashboard/prompts`.

**Architecture:** Authenticated `DELETE /v1/prompts/:publisher/:slug` reuses `userCanEditPrompt` and `findPublicPrompt`. Edit form gains a danger zone that confirms the published slug, then deletes and navigates to the dashboard prompts list. Sample image blobs are removed best-effort after the row delete.

**Tech Stack:** Fastify registry-api, Postgres, BlobStorage, Next.js `PromptSubmissionForm`, existing `api` client.

## Global Constraints

- Hard delete only; slug reusable after delete
- Same auth as edit: owner or org owner/admin
- Confirm by typing the **published** slug (`initialPrompt.slug`)
- Redirect `/dashboard/prompts` on success
- Never trust client `canEdit`

## File map

| File | Responsibility |
| --- | --- |
| `apps/registry-api/src/prompt-routes.ts` | `DELETE` route |
| `apps/registry-api/src/prompt-delete.test.ts` | Route tests with mocked auth/pool/storage |
| `apps/web/components/prompt-submission-form.tsx` | Danger zone UI + delete handler |
| `apps/web/components/prompt-submission-form.module.css` | Danger zone styles |

---

### Task 1: DELETE API + tests

**Files:**
- Create: `apps/registry-api/src/prompt-delete.test.ts`
- Modify: `apps/registry-api/src/prompt-routes.ts`

**Interfaces:**
- Consumes: `findPublicPrompt`, `userCanEditPrompt`, `listEditableOrgIds`, `requireCurrentUser`, `options.storage.delete`, `promptPublicUrl`, `voidSearchNotification`
- Produces: `DELETE /v1/prompts/:publisher/:slug` → `204` | `401` | `403` | `404`

- [ ] **Step 1: Write failing route tests**

```ts
// prompt-delete.test.ts — mock user-auth.requireCurrentUser; registerPromptRoutes with mocked pool + storage
// 1) owner delete → 204, DELETE FROM prompts, storage.delete called when blob path set
// 2) other user → 403, no DELETE SQL
// 3) missing prompt → 404
// 4) unauthenticated (requireCurrentUser returns null after sending 401) → 401
```

- [ ] **Step 2: Run tests — expect FAIL** (no DELETE handler)

Run: `cd apps/registry-api && npx vitest run src/prompt-delete.test.ts`

- [ ] **Step 3: Implement DELETE after PATCH block**

```ts
app.delete<{ Params: { publisher: string; slug: string } }>(
  "/v1/prompts/:publisher/:slug",
  async (request, reply) => {
    const user = await requireCurrentUser(options.accountAuth, request, reply);
    if (!user || !options.accountAuth) return;

    const existing = await findPublicPrompt(
      options.accountAuth.pool,
      request.params.publisher.toLowerCase(),
      request.params.slug.toLowerCase(),
    );
    if (!existing) return reply.status(404).send({ error: "Prompt not found" });

    const editableOrgIds = await listEditableOrgIds(options.accountAuth.pool, user.id);
    if (!userCanEditPrompt(user.id, existing, editableOrgIds)) {
      return reply.status(403).send({ error: "You cannot delete this prompt" });
    }

    const blobPath = existing.sample_image_blob_path;
    await options.accountAuth.pool.query(`DELETE FROM prompts WHERE id = $1`, [existing.id]);
    if (blobPath) await options.storage.delete(blobPath).catch(() => undefined);

    voidSearchNotification(
      [promptPublicUrl(publisherScope(existing), existing.slug)],
      request.log,
    );
    return reply.status(204).send();
  },
);
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit** (if user requested commits; otherwise leave staged work)

---

### Task 2: Edit-form danger zone

**Files:**
- Modify: `apps/web/components/prompt-submission-form.tsx`
- Modify: `apps/web/components/prompt-submission-form.module.css`

**Interfaces:**
- Consumes: `initialPrompt.publisher.scope`, `initialPrompt.slug`, `api` DELETE (204)
- Produces: Delete UI only when `isEdit && initialPrompt`

- [ ] **Step 1: Add state + handler**

```ts
const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
const [deleting, setDeleting] = useState(false);

async function onDeletePrompt() {
  if (!initialPrompt || deleteConfirmSlug !== initialPrompt.slug) return;
  setDeleting(true);
  setStatus("");
  try {
    await api<void>(
      `/v1/prompts/${encodeURIComponent(initialPrompt.publisher.scope)}/${encodeURIComponent(initialPrompt.slug)}`,
      { method: "DELETE" },
    );
    router.push("/dashboard/prompts");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Failed to delete prompt");
    setDeleting(false);
  }
}
```

- [ ] **Step 2: Render danger section below submitRow (edit only)**

- Heading “Delete prompt”
- Warning: permanently removes the prompt; cannot be undone
- Label: `Type {initialPrompt.slug} to confirm`
- Input + Delete button disabled until exact slug match or while `deleting`

- [ ] **Step 3: CSS** — `.dangerZone` with border/danger-like emphasis consistent with form panels; stack gap like `.formSection`

- [ ] **Step 4: Manual check** — edit page shows zone; create page does not; mismatch keeps button disabled

---

### Task 3: Verify

- [ ] `cd apps/registry-api && npx vitest run src/prompt-delete.test.ts src/prompt-routes.test.ts`
- [ ] Typecheck web if convenient: `cd apps/web && npx tsc --noEmit` (or project script)
