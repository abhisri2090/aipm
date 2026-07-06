---
name: debug-log-server
description: Use a dev-only local debug log collector, client/Node logging helpers, and poll/analyze commands to debug browser, dashboard, iframe, API, and startup flows.
---

# Debug Log Server

Use this skill when a repo has been set up with the debug log server files from this package, or when the user wants to add them with the installed manual setup prompt.

## Setup

If the repo does not already contain `debug-log-server/` and `src/utils/debug-log/`, ask the user to run:

```bash
aipm show-prompt @aipm/debug-log-server
```

Then they should paste that prompt into their AI coding tool from the target repo root. The setup prompt installs the helper templates, adds package scripts, and keeps all setup execution manual.

## Daily Workflow

1. Start the collector:

```bash
npm run debug:server
```

2. Reset the poll baseline before reproducing the issue:

```bash
npm run debug:poll -- --reset-baseline
```

3. Add focused instrumentation around the suspected flow with `sendDebugLog(...)` in browser/client code or `sendDebugLogNode(...)` in Node code.

4. Reproduce the issue in the app.

5. Poll new logs:

```bash
npm run debug:poll -- --once
```

6. Wait for a specific event when validating a fix:

```bash
npm run debug:poll -- --wait-for event-name --timeout 15000
```

7. Analyze the latest session:

```bash
npm run debug:analyze
```

## Event Shape

Send compact, structured entries:

```ts
sendDebugLog({
  source: "dashboard",
  event: "dashboard:init:start",
  level: "info",
  step: "load-user-profile",
  durationMs: 42,
  detail: { route: "/dashboard" },
});
```

Common fields are `source`, `event`, `level`, `name`, `durationMs`, `step`, `route`, `method`, `url`, `status`, `tag`, `message`, and `detail`.

## Safety Rules

- Use this only in development.
- Do not log tokens, cookies, passwords, secrets, customer PII, or full request/response bodies.
- Prefer stable event names and small structured details.
- Remove temporary instrumentation when the issue is solved.
- The collector is intentionally unauthenticated and should bind only to trusted local or development-network use.

