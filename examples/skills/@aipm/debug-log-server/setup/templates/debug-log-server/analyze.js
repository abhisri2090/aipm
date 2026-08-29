#!/usr/bin/env node
/**
 * Analyze a .jsonl log file from the debug log server.
 * Usage: node debug-log-server/analyze.js [path-to.jsonl]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logsDir = path.join(__dirname, 'logs')
const arg = process.argv[2]

const resolveLogFile = () => {
  if (arg) return path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg)
  if (!fs.existsSync(logsDir)) {
    console.error('No logs directory. Run npm run debug:server and reproduce the flow.')
    process.exit(1)
  }
  const files = fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ f, mtime: fs.statSync(path.join(logsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  if (!files.length) {
    console.error('No .jsonl logs found in', logsDir)
    process.exit(1)
  }
  return path.join(logsDir, files[0].f)
}

const file = resolveLogFile()
const lines = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean)
const entries = lines
  .map((l) => {
    try {
      return JSON.parse(l)
    } catch {
      return null
    }
  })
  .filter(Boolean)

console.log('\n=== Debug log analysis ===')
console.log(`File: ${file}`)
console.log(`Entries: ${entries.length}\n`)

const sessions = new Map()
for (const e of entries) {
  const sid = e.sessionId || 'unknown'
  if (!sessions.has(sid)) sessions.set(sid, [])
  sessions.get(sid).push(e)
}

for (const [sessionId, rows] of sessions) {
  console.log(`--- Session: ${sessionId} (${rows.length} events) ---`)

  const measures = rows.filter((r) => r.event === 'measure' && r.durationMs != null)
  const apis = rows.filter((r) => r.event === 'api')
  const inits = rows.filter((r) => r.event === 'app-init-step')
  const iframeLogs = rows.filter((r) => r.event === 'iframe-log')

  if (measures.length) {
    console.log('\nDurations (ms):')
    for (const m of measures.sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))) {
      console.log(
        `  [${m.source || '?'}] ${m.name}: ${m.durationMs}ms` +
          (m.startMark ? ` (${m.startMark} → ${m.endMark || 'now'})` : '')
      )
    }
  }

  if (inits.length) {
    console.log('\nApp init steps:')
    for (const s of inits) {
      console.log(`  ${s.step}${s.durationMs != null ? ` (+${s.durationMs}ms)` : ''}`)
    }
  }

  if (apis.length) {
    console.log('\nSlow APIs (≥300ms):')
    for (const a of apis.sort((aa, bb) => bb.durationMs - aa.durationMs).slice(0, 15)) {
      console.log(`  ${a.method} ${a.url} — ${a.durationMs}ms (${a.status ?? '?'})`)
    }
  }

  if (iframeLogs.length) {
    console.log('\nIframe logs (last 20):')
    for (const log of iframeLogs.slice(-20)) {
      console.log(`  [${log.level || 'info'}] ${log.tag || ''}: ${log.message || ''}`)
    }
  }

  const timeline = rows
    .filter((r) => r.event === 'mark' || r.event === 'app-init-step' || r.event === 'route-ready')
    .sort((a, b) => (a.elapsedMs || 0) - (b.elapsedMs || 0))
  if (timeline.length) {
    console.log('\nTimeline (elapsedMs):')
    for (const r of timeline) {
      const label = r.step || r.route || r.name || r.event
      console.log(`  [${r.source || '?'}] +${r.elapsedMs ?? '?'}ms  ${label}`)
    }
  }

  const resources = rows
    .filter((r) => r.event === 'resource')
    .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))
    .slice(0, 8)
  if (resources.length) {
    console.log('\nHeavy resources:')
    for (const r of resources) {
      console.log(`  ${r.durationMs}ms  ${r.detail?.url || r.name}`)
    }
  }

  console.log('')
}

console.log('Tip: filter with: jq \'select(.event=="measure")\'', file)
