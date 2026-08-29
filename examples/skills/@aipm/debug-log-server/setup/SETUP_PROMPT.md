# Manual Setup Prompt: Debug Log Server

You are helping set up the AIPM `@aipm/debug-log-server` package in the current repository.

Do not call an AI provider, install arbitrary scripts, or run unsafe commands. This setup is manual and repo-local. Preserve existing user changes.

## Inputs

AIPM installed helper files for this package under a helper directory. Read these files first:

- `DEBUGGER_LOG_SETUP.md`
- `reference.md`
- `templates/debug-log-server/server.js`
- `templates/debug-log-server/analyze.js`
- `templates/debug-log-server/poll-logs.js`
- `templates/src/utils/debug-log/debug-log.const.ts`
- `templates/src/utils/debug-log/debug-log-lan.ts`
- `templates/src/utils/debug-log/debug-log-client.ts`
- `templates/src/utils/debug-log/debug-log-node.ts`
- `templates/src/utils/debug-log/index.ts`

If your AI tool gives you the prompt content but not the helper directory path, ask the user to run:

```bash
aipm show-prompt @aipm/debug-log-server
```

and copy the printed prompt path. Use the sibling helper files next to that prompt.

## Goal

Install a dev-only debug logging setup into the target repo, adapted to the repo's framework and style.

Recommended file layout:

```text
debug-log-server/
  server.js
  analyze.js
  poll-logs.js
src/utils/debug-log/
  debug-log.const.ts
  debug-log-lan.ts
  debug-log-client.ts
  debug-log-node.ts
  index.ts
```

## Steps

1. Inspect the target repo root, `package.json`, source layout, TypeScript config, and existing logging/debug utilities.
2. Copy or adapt the three `templates/debug-log-server/*.js` files into `debug-log-server/`.
3. Copy or adapt the `templates/src/utils/debug-log/*.ts` files into the target repo's utility area.
4. Add package scripts if `package.json` exists and the names are available:

```json
{
  "debug:server": "node ./debug-log-server/server.js",
  "debug:analyze": "node ./debug-log-server/analyze.js",
  "debug:poll": "node ./debug-log-server/poll-logs.js"
}
```

5. Add these `.gitignore` entries without duplicating them:

```gitignore
debug-log-server/logs/
debug-log-server/logs/.poll-state.json
```

6. Make the smallest compatibility edits needed for the repo:
   - Preserve ESM/CommonJS conventions.
   - Preserve TypeScript path aliases and lint style.
   - Keep browser-only code guarded from Node execution.
   - Keep Node helper usage separate from browser helper usage.
   - If the repo wants all debug helpers exported from one barrel file, include `debug-log-node` only when that will not break browser bundles.
7. Do not add any automatic prompt execution, install hooks, postinstall scripts, telemetry, or external services.
8. Verify the setup:
   - Run the repo's formatter/typecheck for touched files when practical.
   - Start `npm run debug:server` or the repo's equivalent command.
   - Confirm `GET http://127.0.0.1:3927/health` works.
   - Run `npm run debug:poll -- --reset-baseline`.
   - Trigger one debug log or add a temporary local test call.
   - Run `npm run debug:poll -- --once`.
   - Run `npm run debug:analyze`.
9. Remove any temporary test instrumentation you added for verification.
10. Tell the user what files changed, what commands passed, and remind them they may run:

```bash
aipm cleanup @aipm/debug-log-server
```

after they are done with the helper setup files.

## Safety Requirements

- Never log secrets, tokens, cookies, passwords, auth headers, private keys, customer PII, or full request/response bodies.
- This is for development only.
- The collector has no authentication. Do not expose it to an untrusted network.
- Do not overwrite existing project files unless you have compared them and the change is clearly safe.
- If there is a conflict with existing scripts or utilities, stop and ask the user.

