# Phase 1: Package user-flow e2e

Date: 2026-08-17

## Goal

Replicate a real publisher on production: install the CLI, sign in on the website, reserve a package, generate a publish token in the dashboard, publish a skill, confirm it on the website, install it, then delete it.

This is phase 1. Later phases cover search, private packages, org invites, admin, and docs. `scripts/production-smoke.mjs` stays the fast HTTP smoke and is not merged into this flow.

## Non-goals (phase 1)

- Homebrew, Scoop, winget
- Email inbox polling or GitHub OAuth
- Publisher-facing Delete button on the dashboard
- Changing the 5-minute token TTL
- Running this e2e in CI by default

## Architecture

Two pieces:

1. **Registry API test PIN** — env-gated bypass so allowlisted emails can complete the existing email+code login without reading a mailbox.
2. **`scripts/e2e-user-flow.mjs`** — headed Playwright plus shell. Drives the dashboard, then calls the real `aipm` binary from isolated install dirs.

```txt
.env.e2e (local)          Azure/API env (prod)
AIPM_TEST_EMAIL      -->  AIPM_TEST_AUTH_EMAILS (exact match)
AIPM_TEST_AUTH_PIN   -->  AIPM_TEST_AUTH_PIN (same 6 digits)
AIPM_TEST_ORG
```

The PIN lives only in env. It is never committed.

## Backend: test PIN

Env:

- `AIPM_TEST_AUTH_EMAILS` — comma-separated exact emails, normalized the same way as login (`trim`, NFKC, lowercase).
- `AIPM_TEST_AUTH_PIN` — exactly six digits.

Fail closed: if either var is missing, or the PIN is not `^\d{6}$`, there is no bypass.

On `POST /v1/auth/email/request-code`, if the normalized email is in the allowlist:

- Store a challenge whose hash is `sha256(PIN)`, same as a normal code.
- Do **not** send email.
- Do **not** return the PIN in the JSON (no `devCode`).
- Response shape stays `{ ok, email, expiresAt, emailSent: false }`.

`POST /v1/auth/email/verify-code` is unchanged. The browser still types the PIN into `#login-code`. Wrong PIN, unknown email, or unset env fail like today.

Rate limits still apply. Compare using the existing hash helper. API errors must not say that an email is on the test list.

### API tests (`apps/registry-api/src/email-auth.test.ts` and/or `email-auth-api.test.ts`)

- Allowlisted email + correct PIN after `request-code` → 200 and session cookie.
- Allowlisted email + wrong PIN → generic incorrect-code failure.
- Non-allowlisted email + test PIN → failure (unless it happens to match a real challenge).
- Env unset → PIN is not accepted.
- Allowlisted `request-code` does not call the email sender and does not include `devCode`.

## E2E script

Path: `scripts/e2e-user-flow.mjs`  
Command: `pnpm e2e:user`  
Browser: Playwright Chromium, headed.  
Secrets file: gitignored `.env.e2e`. Committed template: `.env.e2e.example`.

Required in `.env.e2e`:

```txt
AIPM_TEST_EMAIL=
AIPM_TEST_AUTH_PIN=
AIPM_TEST_ORG=
WEB_URL=https://www.aipm-registry.com
API_URL=https://api.aipm-registry.com
```

Optional: `AIPM_CLI_RELEASE_INSTALL_SH` (defaults to the same `install.sh` URL the website advertises).

Fail immediately if any required var is missing. Do not log the PIN or publish token.

Install dirs are temp prefixes so the machine’s global `aipm` is not overwritten.

### Run order

1. **npm** — `npm install -g --prefix <tmp>/npm-prefix @aipm-registry/cli` → `<prefix>/bin/aipm --version` → remove that prefix.
2. **curl** — `AIPM_INSTALL_DIR=<tmp>/curl-bin` run `install.sh` → `aipm --version`. Keep this binary as `AIPM_CLI` for the rest.
3. **Browser** — `WEB_URL/dashboard`. Fill `#login-email`, submit **Send verification code**, fill `#login-code` with the PIN, submit **Verify and continue**. Assert the dashboard is shown (not the login card).
4. **Org** — if `AIPM_TEST_ORG` is already in the user’s org list, select it. Otherwise open `/dashboard/orgs`, fill `#org-slug` (and `#org-name` if empty) with that slug, submit **Create organization**.
5. **Reserve** — on `/dashboard/packages`, fill `#package-name` with `e2e-<unixSeconds>` (or `@<org>/e2e-<unixSeconds>`), submit **Reserve package**. Default visibility is public. If the org default is private, set this package to public before publish so the website listing is reachable without login.
6. **Token** — open `/dashboard/packages/<scope>/<name>`, click **Generate token**, read the token from the first token result `CodeBlock` (the raw token, not the `AIPM_TOKEN=...` command).
7. **Publish** — in a temp folder, `aipm publish init --name <pkg> --version 0.0.<unixSeconds> --template blank --here`, then `aipm publish <dir> --registry <API_URL> --token <token>` (same one-shot publish the CLI already supports). Must finish within the 5-minute TTL.
8. **Website** — GET the public package page; assert it is 200 and includes `aipm add <name>@<version>`.
9. **Install** — temp Cursor project: `aipm init --registry <API_URL> --target cursor`, then `aipm add <name>@<version> --target cursor --ci`. Assert at least one markdown file under `.cursor/aipm/skills`.
10. **Cleanup** — always, in `finally`.

### Cleanup

Always, even on failure:

1. If a version was published: `DELETE {API_URL}/v1/packages/{name}` using the Playwright session cookies. There is no publisher Delete button today; this is an org owner/admin API. Then confirm the public package page is not 200 (404).
2. Else if only reserved: `DELETE {API_URL}/v1/orgs/{org}/packages/{name}` to drop the reservation.
3. Delete temp project, staged skill, npm prefix, curl prefix.
4. Close the browser. On failure, save a screenshot under `.tmp/e2e-user-flow/` (already gitignored).

If cleanup fails, log it and still rethrow the original error.

Do not delete `AIPM_TEST_ORG`.

## Error handling

- Missing env → exit before browser or network publish.
- Login / org / reserve / token UI failure → screenshot, cleanup, fail.
- Publish failure → cleanup reservation if it exists.
- Website or install assertion failure → still delete the published package.

## Operator setup (prod)

1. Create the dedicated test publisher account (email login).
2. Set on the production API: `AIPM_TEST_AUTH_EMAILS` and `AIPM_TEST_AUTH_PIN`.
3. Deploy the API **before** running the e2e; the PIN bypass is server-side.
4. Copy `.env.e2e.example` to `.env.e2e` with the same email, PIN, and org slug.
5. Run `pnpm e2e:user` locally. Not part of default `pnpm test` or CI.

Document `pnpm e2e:user` next to `pnpm prod:smoke` in `infra/azure/PRODUCTION_RUNBOOK.md`.

## Dependencies

- Add `playwright` as a root devDependency.
- Script installs Chromium via Playwright if needed, or documents `pnpm exec playwright install chromium`.

## Later phases (out of this spec)

Website search/docs, private install tokens, org invites, admin, Homebrew/Scoop/winget, CI scheduling.
