# Prompt Delete Design

**Date:** 2026-09-19  
**Status:** Approved for implementation planning  
**Goal:** Let authorized users permanently delete a prompt from the prompt edit page, with type-to-confirm UX matching skill delete.

## Context

Prompts support create (`POST /v1/prompts`) and edit (`PATCH /v1/prompts/:publisher/:slug`) via `PromptSubmissionForm`. There is no delete path today. Edit access is enforced by `userCanEditPrompt` (personal owner, or org owner/admin for org prompts). Sample images live in blob storage and are already deleted on failed create/update and when images are replaced or cleared.

## Decisions

| Topic | Decision |
| --- | --- |
| Delete semantics | Hard delete (row removed; slug reusable) |
| Confirmation UX | Type-to-confirm danger zone (type the prompt **slug**) |
| Placement | Edit mode only, below Save/Cancel on `PromptSubmissionForm` |
| Who can delete | Same as edit: `owner_user_id` match, or org owner/admin |
| Redirect after success | `/dashboard/prompts` |
| Sample image | Delete blob best-effort after (or with) row delete |

## Approach

Add authenticated `DELETE /v1/prompts/:publisher/:slug` and a danger-zone block on the edit form. Prefer this over a separate page/component so edit and delete stay one surface, matching skill-delete on the dashboard.

## API

### `DELETE /v1/prompts/:publisher/:slug`

- Requires a signed-in session. Anonymous → `401`.
- Load prompt by publisher scope + slug. Missing → `404`.
- Enforce delete access on the server with the same rules as PATCH (`userCanEditPrompt`). Otherwise → `403`.
- Never trust client-provided ownership or `canEdit` for mutation.
- On success:
  1. Capture `sample_image_blob_path` if present
  2. `DELETE` the prompt row
  3. Best-effort `storage.delete(blobPath)` (swallow/log failures; do not fail the request if the row is gone)
  4. Return `204`
- After delete, GET/list for that slug return not found; slug may be reused by the same publisher uniqueness rules as create.

## Web UI

### Form behavior (edit mode only)

- Below the existing Save/Cancel row, show a danger section:
  - Heading: “Delete prompt”
  - Short copy: permanent removal cannot be undone
  - Label: type `{slug}` to confirm
  - Input bound to local confirm state
  - Delete button disabled until input equals the current prompt slug exactly
- On click: call `DELETE /v1/prompts/:publisher/:slug`, then navigate to `/dashboard/prompts`.
- On failure: show the error message inline (do not navigate).
- Create mode (`/prompts/new`) does not show this section.

### Auth / access UI

- Unchanged: edit page already gates on sign-in and `canEdit`. Delete UI only appears when the edit form is shown.

## Testing

- API: owner can delete personal prompt → `204`; subsequent GET → `404`.
- API: non-owner / non-admin → `403`.
- API: unknown publisher/slug → `404`.
- API: prompt with sample image → blob delete attempted; row removed.
- Web: no new e2e required for v1; rely on API route tests unless existing prompt-form tests are cheap to extend.

## Out of scope

- Soft delete / trash / undo
- Slug reservation after delete
- Admin-only delete endpoints
- Delete from directory cards or dashboard list (edit page only)
- Redirects from old public URL beyond natural `404`
