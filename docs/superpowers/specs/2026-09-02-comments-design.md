# Comments on Skills & Prompts Design

**Date:** 2026-09-02  
**Status:** Approved for implementation planning  
**Goal:** Let logged-in users comment on package (skill) and prompt detail pages, with one level of replies, public reading, and author/admin moderation.

## Decisions

| Topic | Decision |
| --- | --- |
| Placement | End of package detail and prompt detail pages only |
| Visibility | Public read; login required to post or reply |
| Nesting | Top-level comments + one level of replies (no reply-to-reply) |
| Content | Plain text, emoji, and links (stored as text; URLs autolinked in UI) |
| Package scope | One thread per package name; shared across versions |
| Edit/delete | Authors can edit and soft-delete own; site admins can soft-delete any |
| Notifications | None in v1 |
| Sort | Top-level: most replies first, then newer first; replies: oldest → newest |

## Approach

Shared comments API with a polymorphic target (`package` \| `prompt`) and one reusable `CommentsSection` web component on both detail pages.

## Data model

Table `comments`:

| Column | Type / notes |
| --- | --- |
| `id` | TEXT UUID PK |
| `target_type` | `package` \| `prompt` |
| `target_key` | Package scoped name (`@scope/name`) or prompt UUID |
| `parent_id` | NULL for top-level; FK to top-level comment for replies |
| `author_user_id` | FK → `users(id)` |
| `body` | TEXT, 1–2000 chars after trim |
| `created_at` / `updated_at` | TIMESTAMPTZ |
| `deleted_at` | TIMESTAMPTZ NULL |
| `deleted_by_user_id` | FK → `users(id)` NULL |

Constraints / indexes:

- Check `target_type` in (`package`, `prompt`)
- Index `(target_type, target_key, created_at DESC)` for listing
- Index `(parent_id)` for replies
- Application enforces: parent is same target, parent is top-level (`parent_id IS NULL`), parent not required to be non-deleted for listing structure but new replies rejected on deleted parents

Soft delete:

- Body hidden; UI shows “Comment removed”
- Replies under a removed parent remain visible
- Soft-deleted comments still count toward reply_count for sorting unless we exclude them — **v1: count only non-deleted replies**

## API

### `GET /v1/comments?targetType=&targetKey=`

- Public
- Returns `{ comments: Thread[] }` where each top-level item includes `replies[]`, `replyCount`, author summary, timestamps, `deleted`, `canEdit`, `canDelete`
- Sort: top-level by `replyCount DESC`, `created_at DESC`; replies by `created_at ASC`
- Optional: limit top-level to 50 with `?cursor=` / “Load more” if needed later; v1 may return up to 100 top-level without pagination if cheap

### `POST /v1/comments`

- Auth required (user session)
- Body: `{ targetType, targetKey, body, parentId? }`
- Validate target exists and is publicly readable
- Validate body length; reject empty
- If `parentId` set: parent must exist, same target, top-level, not deleted
- Reject reply-to-reply
- Returns created comment (201)

### `PATCH /v1/comments/:id`

- Auth required; only author
- Body: `{ body }`
- Cannot edit soft-deleted comments
- Sets `updated_at`

### `DELETE /v1/comments/:id`

- Auth required
- Allow if author **or** active site admin session (same admin session model as existing admin UI)
- Soft-delete: set `deleted_at`, `deleted_by_user_id`; clear or retain body (retain in DB, never return after delete)

Authorization notes:

- `canEdit` / `canDelete` on GET are UI hints only; mutations always re-check server-side
- Site admin delete uses admin session cookie/flow already used by `/admin`, not org admin roles

## Web UI

Component: `CommentsSection` with props `{ targetType, targetKey }`.

Mounted at the bottom of:

- Package detail view / page
- Prompt detail page

Behavior:

1. Heading + visible comment count (non-deleted top-level + replies, or top-level only — **v1: count all non-deleted comments including replies**)
2. Composer: signed-in users get textarea + Post; others see sign-in CTA linking to `/login`
3. Thread list with agreed sort
4. Per comment: avatar/name, relative or absolute time, body with http(s) autolinks (`rel="noopener noreferrer"`, `target="_blank"`), Edit / Delete when allowed, Reply on top-level only
5. Inline edit for own comments; confirm optional for delete (simple confirm dialog is enough)
6. Soft-deleted placeholder text; no actions except admin already deleted

Out of scope v1:

- Reactions, mentions, markdown, images, notifications
- Org-role moderation (package maintainers)
- Hard delete / purge UI
- Comment search or reporting workflow (admin delete covers abuse for now)

## Error handling

| Case | Status |
| --- | --- |
| Not signed in on mutating routes | 401 |
| Target not found / not public | 404 |
| Invalid body / reply nesting | 400 |
| Not author on PATCH | 403 |
| Not author and not site admin on DELETE | 403 |
| Comment not found | 404 |

## Test plan

Backend:

- Public GET empty and populated threads
- Sort order (reply count, then newer)
- POST requires auth; reply only one level; reject reply-to-reply
- PATCH author only; DELETE author or site admin
- Soft-delete hides body; structure preserved
- Package target keyed by package name across versions

Web (manual / light verify):

- Comments section at end of package + prompt pages
- Sign-in CTA when logged out
- Post, reply, edit, delete as author
- Autolinked URLs

## Implementation notes

- Prefer `apps/registry-api/src/comment-routes.ts` (or similar) registered beside prompt routes
- Reuse `requireCurrentUser` / `getCurrentUser`; reuse existing admin session helper for admin delete
- Shared autolink helper on the web for safe URL detection (no HTML injection — escape text, wrap matches in `<a>`)
