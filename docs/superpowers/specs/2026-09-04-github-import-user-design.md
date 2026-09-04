# User GitHub Skill Import Design

**Date:** 2026-09-04  
**Status:** Approved for implementation planning  
**Goal:** Let an org owner or admin import one public GitHub skill they own into the selected AIPM org, after reviewing and editing package metadata. Skill files stay as GitHub sent them.

## Context

Admins can already paste a GitHub URL into `/v1/admin/import-from-url`. That flow attributes the package to the **GitHub repo owner**, auto bulk-imports collections, and treats root `README.md` as a skill.

Publishers already sign in (GitHub or email) and manage names on `/dashboard/packages`. They cannot import from GitHub themselves.

This feature reuses GitHub fetch/pack code. It does **not** expose admin bulk import. The publisher is the **signed-in user and selected org**.

## Decisions

| Topic | Decision |
| --- | --- |
| Who can import | Signed-in org **owner** or **admin** of the selected dashboard org |
| GitHub identity | Required. Email users **Connect GitHub** on the same account |
| Which repos | **Public** only. Personal repo they own, or GitHub org repo they **admin** |
| AIPM scope | Always the **active dashboard org** |
| Skills per URL | **One**. No user bulk import |
| Entry file | Prefer root `SKILL.md`. Otherwise list **root files** and they pick entry |
| Collections | Hard stop if the URL is a multi-skill folder (`skills/` or several skill subfolders) and there is no root `SKILL.md` |
| Editable | All generated manifest metadata + visibility |
| Locked | Every GitHub file (`SKILL.md`, `README.md`, helpers, etc.). `entry` is the detected or chosen file, not a free-typed path outside the folder |
| Existing name in this org | Publish a **new version**. Tell them in plain language |
| Existing name in another org | Fail; pick another name |
| GitHub already an AIPM user (connect) | Do not merge. Tell them to sign in with GitHub |
| Email on both login methods | If GitHub returned an email that already has an **email** AIPM account, refuse GitHub **login** |
| GitHub with no email | Login and connect still allowed |
| Full importer UI | `/dashboard/packages` only |
| Discovery | Docs page plus short links from publish/directory pages |

## Approach

Two authenticated org endpoints: **preview** then **confirm**. Preview fetches GitHub, checks ownership, and returns prefilled metadata. Confirm re-fetches the same commit, overlays the user’s metadata, packs, reserves if needed, and publishes.

Do not add a one-shot publish from the dashboard, and do not let the browser talk to GitHub with a user token.

Admin `/v1/admin/import-from-url` and bulk import stay as they are.

## Architecture

```
Dashboard /dashboard/packages
  → Connect GitHub (email users) if github_id missing
  → POST preview (sourceUrl, optional entry)
  → Review form (editable manifest)
  → POST confirm (sourceUrl, entry, commitSha, manifest)
  → Pack + publish into selected org
```

Shared with admin import: URL parse, public GitHub fetch, tarball extract, content hash, license/description helpers, pack directory.

**Not** shared: `ensureImportAccount` / publishing as the GitHub repo owner. User import calls a new helper that publishes **as the session user into `:org`**.

Provenance still stores `source_url`, `source_commit_sha`, license, content hash.

## Auth and GitHub linking

### Login vs connect

- `GET /v1/auth/github/start` — existing **login** (no session, or replacing session).
- `GET /v1/auth/github/connect` — **link** GitHub onto the current session user. Requires login. Returns to `/dashboard/packages`.

OAuth scopes: `read:user`, `user:email`, `public_repo`.  
`public_repo` is needed to read `permissions.admin` on public org repos. Import still **rejects private** repos.

Do not store GitHub access tokens long-term. Keep a short-lived httpOnly cookie (or equivalent, ≤10 minutes) only for preview/confirm ownership checks on org repos. Personal-repo owner match can use the server GitHub token / public API.

### GitHub login (start)

After token exchange, read GitHub user and, if present, primary email from `/user/emails` or the profile `email` field. Do **not** require a verified email.

- If an email was returned **and** an `auth_provider = 'email'` user already has that `primary_email` → **do not** create a session. Show: you already have an AIPM account with this email; sign in with email.
- If no email was returned → existing GitHub user upsert/login (no uniqueness check).
- If email was returned and no email-auth user has it → proceed; store it on the GitHub user as **`contact_email` only**. Do **not** set `primary_email` on GitHub-auth users. Email login looks up `primary_email` on email-auth users; putting the same address in `primary_email` on a GitHub user would log them into the wrong account.

Email **signup** already refuses when that address is a GitHub user’s `contact_email`. Keep that.

### Connect GitHub (email user)

Attach `github_id` / `github_login` to the current user when:

- Current user has no `github_id`
- That `github_id` is not used by another AIPM user
- If GitHub returned an email, it is not another user’s `primary_email` (unless it is this user)

Otherwise keep the email session and show a clear error:

- GitHub already used on AIPM → sign in with GitHub to import; do not merge accounts.
- Email collision with a different user → use a different GitHub account.

Do not change `auth_provider` from `email` to `github` when linking. The user stays an email account with GitHub attached.

## Ownership (public repos only)

Parse `sourceUrl` (same rules as admin). Load the public GitHub repo.

| Repo | Allow when |
| --- | --- |
| Private / 404 | Deny. Public repos only |
| `owner.login` equals the user’s `github_login` (case-insensitive) | Allow |
| Owner is a GitHub org | Allow only if the user’s GitHub token reports `permissions.admin` on that repo |
| Otherwise | Deny |

## Preview and confirm API

Both routes require a session, account services, and `canManagePackages` on `:org`. Rate-limit similarly to admin import (preview max 10/min, confirm max 5/min per user).

### `POST /v1/orgs/:org/imports/github/preview`

Body: `{ sourceUrl: string, entry?: string }`

1. Resolve the GitHub folder (default branch, `skills/` peek as today).
2. If mode is **collection** (including a `skills/` tree with no root `SKILL.md`) → `400` with a stable `code` such as `collection_not_supported`. Message: this URL has more than one skill; paste a folder that is a single skill (one that contains `SKILL.md`, or pick a file in a one-skill folder).
3. If the folder has no `SKILL.md` and `entry` is missing → `400` `entry_required` plus **root file names** (files in that folder only, not nested `skills/` children).
4. If `entry` is set, it must be one of those root files. Use it as `entry`.
5. If `SKILL.md` exists, ignore a client `entry` that tries to replace it unless we explicitly allow override; **v1: root `SKILL.md` always wins** when present.
6. Fetch files, compute hash, prefill manifest fields (same defaults as admin: version `1.0.0` or next patch if this org already has the package, `targets: ["*"]`, description/license/`agentDescription` from files).
7. Package name default: `@:org/<folder-or-repo-slug>`. Scope is locked to `:org`.

Success `200`:

- `sourceUrl` (canonical tree URL)
- `commitSha`
- `entry`
- `files` (root file names only, for the picker / review)
- `packageName`, `existingVersion` (latest in this org or `null`)
- `updateNotice` (non-null when this org already reserved/published the default name)
- `manifest` (full prefilled `aipm.manifest.json` object)
- `visibility` (org default, or existing reservation visibility)
- `provenance`: license, contentHash

`updateNotice` copy (plain language):

> This skill is already on AIPM under this name. We’ll publish a **new version** so the current one stays available. You can change the version or the package name before you import.

### `POST /v1/orgs/:org/imports/github`

Body: `{ sourceUrl, entry?, commitSha, manifest, visibility? }`

1. Repeat auth, ownership, collection, and entry rules. Re-fetch GitHub files.
2. If the live `commitSha` ≠ body `commitSha` → `409` `source_changed`: GitHub changed; preview again.
3. Validate `manifest` with `PackageManifestSchema`. `name` must be `@:org/<name>`. `entry` must match the resolved entry file and must exist in the fetched files. Do not accept file contents from the client.
4. Write fetched GitHub files + `aipm.manifest.json` from the **client-edited** manifest (server still sets `schemaVersion`, `type: "skill"`, and `entry`).
5. If the package name is free → reserve in this org (same as dashboard reserve), using requested visibility or org default.
6. If reserved in this org → allow. **Never overwrite** a published version. Preview prefills the next unused version when the name already exists. If confirm’s `manifest.version` already exists → `409` (change the version). Do not auto-bump on confirm; the review form is the source of truth.
7. If reserved in another org → `409`.
8. Publish tarball via metadata/storage as the **session user** (not GitHub owner upsert).
9. Write provenance.

Success `201` with `packageName`, `version`, `sourceUrl`, `contentHash`, `integrity`, and whether it was a first publish or an update.

## User-flow vs admin-flow differences

| | Admin import | User import |
| --- | --- | --- |
| Auth | Admin session | Org owner/admin + GitHub linked |
| Publisher | GitHub repo owner account | Session user + selected org |
| `README.md` without `SKILL.md` | Treated as a skill | Entry picker (or collection hard stop) |
| Collection / `skills/` | Auto bulk-import | Hard stop |
| Metadata | Generated only | Preview, user edits, then confirm |

## Web UI

Only `/dashboard/packages`, in the selected org, next to “Claim a skill name”.

1. If not GitHub-linked → **Connect GitHub** (no URL import until linked).
2. Paste GitHub repo or folder URL → Preview.
3. `entry_required` → file `<select>` of root files → Preview again.
4. Review form: all manifest fields except files; scope `@org` locked; short name editable; visibility if the org supports private packages.
5. Show `updateNotice` when applicable.
6. Import → on success, link to `@org/name@version` and refresh the reserved-package list.

Members/viewers: panel visible, controls disabled, “Only owners and admins can import from GitHub.”

Unauthenticated users hitting dashboard stay on the existing login redirect. Login page is **not** an importer.

## Discovery (no importer chrome)

- New doc: `/publish/github` (also listed under Publish package in `docs-nav`).
- Publishing guide and `/publish` get a short paragraph + link.
- Skills directory `DirectoryListTile` (`kind: "skill"`): extra line that you can import a skill you own from GitHub, linking to `/publish/github`. That doc links to `/login` and `/dashboard/packages`.

Do not add the preview form to `/login` or the homepage.

## Error handling

| Case | API | UX |
| --- | --- | --- |
| Not signed in | `401` | Existing dashboard login |
| Not owner/admin | `403` | Disabled panel copy |
| No GitHub linked | `403` `github_required` | Connect GitHub |
| Private / not found | `400` | Public GitHub URLs only |
| Not owner/admin on GitHub repo | `403` | You can only import public repos you own or admin |
| Collection URL | `400` `collection_not_supported` | Hard stop copy |
| Missing `SKILL.md`, no entry | `400` `entry_required` | File picker |
| Invalid entry | `400` | Pick a file from the list |
| Commit changed | `409` `source_changed` | Preview again |
| Name owned elsewhere | `409` | Change the package name |
| Version exists | `409` | Change the version |
| GitHub login email matches email account | login error page/JSON | Sign in with email |
| Connect GitHub id already used | connect error | Sign in with GitHub; no merge |
| GitHub auth not configured | `503` | Same as rest of dashboard |

## Out of scope (v1)

- Private GitHub repos
- Bulk / multi-skill import for users
- Editing GitHub file contents in the dashboard
- Merging email and GitHub AIPM users
- Requiring a verified GitHub email
- Putting the importer on `/login`
- Changing admin import behavior
- CLI `aipm publish` GitHub URL import

## Test plan

Backend:

- Owner/admin preview + confirm into their org; member/viewer `403`; anonymous `401`
- Personal public repo allowed; org public repo allowed only with `admin`; private denied
- Collection URL `collection_not_supported`; no bulk
- No `SKILL.md` without `entry` → `entry_required` + root files; with valid `entry` → preview succeeds
- Root `SKILL.md` wins over a different `entry`
- Confirm rejects client-supplied files (only overlay manifest); commit mismatch `409`
- New name reserved in `:org`; existing reservation in `:org` publishes next version; other org’s name `409`; duplicate version `409`
- Publisher is session user/org, not GitHub owner
- GitHub login with colliding email refused; GitHub login with no email succeeds
- Email signup still refuses GitHub `contact_email`
- Connect GitHub on email user succeeds when id is free; refuses when github user already exists
- Admin import still bulk-imports collections

Web (manual or closest automated check):

- Import panel only on `/dashboard/packages`
- Connect GitHub → return to packages
- Review form prefills; files not editable
- Update notice shown for existing org package
- Doc and directory tile link to `/publish/github`

## Implementation notes

- Split “fetch and interpret GitHub folder” from “publish as GitHub owner” in `import-from-github.ts` / `admin-import.ts`.
- Add `publishImportedSkillForOrg({ user, orgSlug, tarball, provenance })` that reuses reservation + blob + metadata insert without `upsertGithubUser` for the repo owner.
- Reuse `PackageManifestSchema` for confirm body validation.
- Keep GitHub collection auto-bulk **only** on the admin route.
- Proxy `/v1/orgs/:org/imports/github` through the web app the same way as other `/v1` dashboard calls.
- Prefer a dedicated connect OAuth state payload (`intent=connect`) over overloading login callback blindly.
