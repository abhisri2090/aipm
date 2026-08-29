# Debug Log Server — Reference

## File layout

```
debug-log-server/
  server.js       # collector :3927
  analyze.js      # CLI report
  poll-logs.js    # agent poll / wait-for loop
  logs/           # gitignored *.jsonl
src/utils/debug-log/
  debug-log.const.ts
  debug-log-lan.ts
  debug-log-client.ts   # sendDebugLog (renderer)
  debug-log-node.ts     # sendDebugLogNode (Node only)
  index.ts
```

## DebugLogEntry shape

```ts
{
  source: 'shell' | 'dashboard'
  event: string
  level?: 'perf' | 'info' | 'warn' | 'error'
  name?: string
  durationMs?: number
  step?: string
  route?: string
  method?: string
  url?: string
  status?: number
  tag?: string
  message?: string
  detail?: Record<string, unknown>
}
```

## poll-logs.js flags

| Flag | Default | Description |
|------|---------|-------------|
| `--once` | off | Single poll then exit |
| `--json` | off | JSON lines for agent parsing |
| `--interval` | 1500 | Ms between polls |
| `--timeout` | 0 | Max wait ms with `--wait-for` |
| `--wait-for` | — | `key=val,key=val` match criteria |
| `--reset-baseline` | — | Set cursor to current lineCount |

Exit codes: `0` ok/matched, `1` server down, `2` timeout/no match, `3` no new lines.

## Security

- Never log auth tokens, cookies, passwords, or PII
- Dev-only guards; collector has no auth
