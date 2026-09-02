# Prompt Edit Design

**Date:** 2026-09-02  
**Status:** Approved for implementation planning  
**Goal:** Let authorized users edit an existing published prompt through the same form used to create prompts, with fields prefilled from current data.

## Context

Prompts are created via authenticated `POST /v1/prompts` and the web form at `/prompts/new` (`PromptSubmissionForm`). There is no update path today. Ownership is stored as `owner_user_id`, with optional `org_id` when published under an organization.

## Decisions

| Topic | Decision |
| --- | --- |
| Edit entry points | Both directory card and prompt detail page |
| Who can edit | Original owner (`owner_user_id`), or org **owner** / **admin** for org-published prompts |
| Who cannot edit | Org members, org viewers, other users, anonymous users |
| Form UX | Reuse create form in edit mode, fields prefilled |
| Slug | Editable; changing it updates the URL; old URL breaks (no redirect in v1) |
| Publisher | Locked for the lifetime of the prompt |
| Sample image | Keep existing unless a new file is uploaded; clear only when output types no longer include `image` |
| Authorization | Backend must re-check edit access on every PATCH; client `canEdit` is UI-only |

## Approach

Reuse `PromptSubmissionForm` with `mode: "edit"` and add authenticated `PATCH /v1/prompts/:publisher/:slug` (multipart, same shape as create). Prefer this over a separate inline editor or dashboard-only flow so create and edit stay one UI.

## API

### `PATCH /v1/prompts/:publisher/:slug`

- Requires a signed-in session. Anonymous → `401`.
- Multipart body matches create:
  - `data`: JSON prompt fields (same validation as create where applicable)
  - `sampleImage`: optional image file
- Load prompt by publisher scope + slug. Missing → `404`.
- Enforce edit access **on the server** after load:
  1. Allow if `prompt.owner_user_id === session.user.id`
  2. Else allow if `prompt.org_id` is set and the user is that org’s **owner** or **admin**
  3. Otherwise → `403`
- Never trust client-provided ownership or `canEdit` for mutation.
- Updatable fields: title, slug, summary, prompt text, category, tags, input/output types, tested models, effort, variables, example input/output, usage notes, language, license, source URL, sample image alt; optional new sample image.
- Immutable fields: `id`, `owner_user_id`, `org_id`, publisher scope, `published_at` (keep original publish time), copy count.
- Slug change:
  - Normalize with the same slug rules as create
  - If the new slug conflicts for the same publisher uniqueness constraint → `409`
  - Old slug URL returns `404` (no redirect in v1)
- Sample image rules:
  - No new upload → keep existing blob path / content type / alt (alt may still be updated from `data`)
  - New upload → replace stored blob and metadata
  - If output types no longer include `image` → clear sample image blob + content type + alt (and delete old blob when present)
  - If output types include `image` and there is no existing image and no new upload → `400`
  - If output types include `image` and alt is empty → `400`
- On success: return the updated prompt detail payload (same shape as GET detail), including `canEdit: true` for the actor.
- Update `updated_at` on successful save.

### Read responses

- Prompt list and detail payloads include `canEdit: boolean` when the request is authenticated and the actor passes the same access rules as PATCH.
- Unauthenticated responses omit `canEdit` or set it `false`.
- `canEdit` is only for rendering Edit controls; PATCH always re-validates.

## Web UI

### Routes

- Edit page: `/prompts/[publisher]/[slug]/edit`
- Reuses `PromptSubmissionForm` with `mode: "edit"` and initial prompt data loaded from GET detail (or equivalent authenticated fetch).
- If the user is not signed in → same login prompt pattern as create.
- If signed in but not allowed to edit → short “You can’t edit this prompt” state (do not show a writable form).

### Form behavior (edit mode)

- Prefill every editable field from the existing prompt.
- Publisher control is read-only / locked to the current publisher.
- Slug is editable; show the current public URL under the field.
- Sample image:
  - Show current preview and alt when present
  - Allow optional replacement upload
  - Do not require re-upload when keeping the existing image
- Submit label: **Save changes**
- Submit calls `PATCH /v1/prompts/:publisher/:slug`
- On success, navigate to the prompt detail URL (using the possibly new slug)

### Edit affordances

- **Directory card:** small Edit control outside the main card link, only when `canEdit` is true.
- **Detail page:** Edit action in header/actions, only when `canEdit` is true.
- Edit links to `/prompts/{publisher}/{slug}/edit`.

## Error handling

| Case | Response / UX |
| --- | --- |
| Not signed in on PATCH | `401` |
| Prompt not found | `404` |
| Signed in but no edit access | `403` |
| Slug conflict | `409` with clear message |
| Invalid fields / missing image when required | `400` |
| Sample image too large / wrong type | Same limits as create |

## Out of scope (v1)

- Redirects from old slugs
- Changing publisher / transferring ownership
- Draft / version history
- Soft-delete or archive from the edit form
- Letting org **members** edit

## Test plan

Backend:

- Owner can PATCH personal prompt
- Org owner and org admin can PATCH org prompt
- Org member and viewer cannot (`403`)
- Non-owner / other user cannot (`403`)
- Anonymous cannot (`401`)
- Slug change succeeds; old slug GET returns `404`; conflict returns `409`
- Sample image kept when omitted; replaced when uploaded; cleared when image output removed
- Image output without existing or new sample image rejected

Web (manual or verify script where practical):

- Edit appears on card and detail only for allowed users
- Edit form is prefilled
- Publisher locked; slug editable
- Save updates detail page; slug change lands on new URL

## Implementation notes

- Prefer sharing validation helpers between create and update in `prompt-routes.ts`.
- Prefer a single `userCanEditPrompt(user, prompt)` helper used by GET serialization and PATCH.
- Delete replaced/cleared blobs from storage after a successful DB update (avoid orphan files; avoid deleting before commit succeeds).
