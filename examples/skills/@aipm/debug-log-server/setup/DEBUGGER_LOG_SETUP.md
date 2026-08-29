# Debug Log Server Setup Guide

This package adds a dev-only logging loop for AI-assisted debugging:

- `debug-log-server/server.js` collects JSON logs over HTTP and writes JSONL session files.
- `debug-log-server/poll-logs.js` reads new entries, supports baselines, waits for events, and returns useful exit codes.
- `debug-log-server/analyze.js` summarizes the latest session by timing, startup step, API latency, iframe activity, and timeline.
- `src/utils/debug-log/` contains browser/client and Node helpers.

The files are installed as AIPM helper templates. AIPM does not automatically write them into the target project. The user runs the manual setup prompt in their AI coding tool from the target repo root.

## Recommended Target Layout

```text
debug-log-server/
  server.js
  analyze.js
  poll-logs.js
  logs/
src/utils/debug-log/
  debug-log.const.ts
  debug-log-lan.ts
  debug-log-client.ts
  debug-log-node.ts
  index.ts
```

If the target repo is not a TypeScript browser app, adapt `src/utils/debug-log/` to the nearest local utility path and preserve the same behavior.

## Package Scripts

Add these scripts to the target repo's `package.json` when they do not already exist:

```json
{
  "debug:server": "node ./debug-log-server/server.js",
  "debug:analyze": "node ./debug-log-server/analyze.js",
  "debug:poll": "node ./debug-log-server/poll-logs.js"
}
```

Keep any existing scripts unchanged. If a script name conflicts, ask the user before replacing it.

## Git Ignore

Add these ignore rules:

```gitignore
debug-log-server/logs/
debug-log-server/logs/.poll-state.json
```

Do not ignore the server scripts or utility source files.

## Collector

The server listens on `DEBUG_LOG_PORT` or port `3927`.

Endpoints:

- `GET /health`
- `GET /api/files`
- `POST /api/log`
- `POST /api/logs`

The server writes JSONL files under `debug-log-server/logs/session-*.jsonl`.

Interactive keys when running in a TTY:

- `n`: start new session file
- `c`: clear current session file
- `s`: print status
- `a`: analyze latest logs
- `t`: toggle live tail
- `h`: help
- `q`: quit

## Poller

Useful commands:

```bash
npm run debug:poll -- --reset-baseline
npm run debug:poll -- --once
npm run debug:poll -- --json --once
npm run debug:poll -- --wait-for dashboard:init:done --timeout 15000
```

Exit codes:

- `0`: success
- `1`: no logs or timeout
- `2`: server not running
- `3`: bad arguments

## Instrumentation

Browser/client code should use `sendDebugLog`. Node code should use `sendDebugLogNode`.

Preferred event style:

```ts
sendDebugLog({
  source: "dashboard",
  event: "dashboard:init:start",
  step: "fetch-user-profile",
});
```

When timing work, use pairs or durations:

```ts
const startedAt = performance.now();
await doWork();
sendDebugLog({
  source: "dashboard",
  event: "dashboard:init:step",
  step: "do-work",
  durationMs: Math.round(performance.now() - startedAt),
});
```

## Safety

- Development use only.
- Never log tokens, cookies, auth headers, passwords, secrets, private keys, customer PII, or full request/response bodies.
- Keep details compact and structured.
- Remove temporary instrumentation after the debugging task.
- The local collector has no auth. Do not expose it on an untrusted network.

## Verification

After setup:

1. Run `npm run debug:server`.
2. In another terminal, run `npm run debug:poll -- --reset-baseline`.
3. Add or trigger one test debug log.
4. Run `npm run debug:poll -- --once`.
5. Run `npm run debug:analyze`.

If the repo uses another package manager, run the equivalent commands through that package manager.

