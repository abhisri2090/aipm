#!/usr/bin/env node
/**
 * Poll the debug log server for new entries. For agent verify loops.
 *
 * Usage:
 *   node debug-log-server/poll-logs.js --once
 *   node debug-log-server/poll-logs.js --wait-for "event=measure,name=my-step" --timeout 30000
 *   node debug-log-server/poll-logs.js --interval 2000 --json
 */
import fs from 'fs'
import http from 'http'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_FILE = path.join(__dirname, 'logs', '.poll-state.json')
const PORT = Number(process.env.DEBUG_LOG_PORT || 3927)

const parseArgs = () => {
  const args = process.argv.slice(2)
  const opts = {
    once: false,
    json: false,
    interval: 1500,
    timeout: 0,
    waitFor: null,
    since: null,
    tail: 0,
    resetBaseline: false,
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--once') opts.once = true
    else if (a === '--json') opts.json = true
    else if (a === '--interval') opts.interval = Number(args[++i] || 1500)
    else if (a === '--timeout') opts.timeout = Number(args[++i] || 0)
    else if (a === '--wait-for') opts.waitFor = args[++i] || null
    else if (a === '--since') opts.since = Number(args[++i])
    else if (a === '--tail') opts.tail = Number(args[++i] || 20)
    else if (a === '--reset-baseline') opts.resetBaseline = true
  }
  return opts
}

const parseWaitFor = (raw) => {
  if (!raw) return null
  const criteria = {}
  for (const part of raw.split(',')) {
    const [k, v] = part.split('=').map((s) => s.trim())
    if (k && v) criteria[k] = v
  }
  return Object.keys(criteria).length ? criteria : null
}

const matchesCriteria = (entry, criteria) =>
  Object.entries(criteria).every(([k, v]) => String(entry[k] ?? '') === v)

const fetchHealth = () =>
  new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(3000, () => {
      req.destroy()
      reject(new Error('health_timeout'))
    })
  })

const readState = () => {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
    return {
      cursor: s.cursor ?? { lineCount: s.lineCount ?? 0, logFile: s.logFile ?? '' },
      baseline: s.baseline ?? { lineCount: s.lineCount ?? 0, logFile: s.logFile ?? '' },
    }
  } catch {
    return {
      cursor: { lineCount: 0, logFile: '' },
      baseline: { lineCount: 0, logFile: '' },
    }
  }
}

const writeState = (state) => {
  const dir = path.dirname(STATE_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

const readNewEntries = (logFile, fromLine, tailLimit) => {
  if (!logFile || !fs.existsSync(logFile)) return { entries: [], totalLines: fromLine }
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean)
  const totalLines = lines.length
  let slice = lines.slice(fromLine)
  if (tailLimit > 0 && slice.length > tailLimit) slice = slice.slice(-tailLimit)
  const entries = slice
    .map((l) => {
      try {
        return JSON.parse(l)
      } catch {
        return null
      }
    })
    .filter(Boolean)
  return { entries, totalLines }
}

const formatEntry = (e) => {
  const ms = e.durationMs != null ? ` ${e.durationMs}ms` : ''
  const label = e.name || e.step || e.route || e.tag || e.event
  return `[${e.source || '?'}] ${e.event} ${label}${ms}`
}

const emit = (opts, payload) => {
  if (opts.json) console.log(JSON.stringify(payload))
  else if (payload.type === 'entries') {
    for (const e of payload.entries) console.log(formatEntry(e))
  } else if (payload.type === 'status') {
    if (payload.message) console.log(payload.message)
    else
      console.log(
        `server ok | file: ${payload.logFileName} | lines: ${payload.lineCount} | new: ${payload.newCount ?? 0}`
      )
  } else if (payload.message) {
    console.log(payload.message)
  }
}

const pollOnce = async (opts, state) => {
  const health = await fetchHealth()
  const logFile = health.logFile
  let fromLine = opts.since != null ? opts.since : state.cursor.lineCount
  if (opts.waitFor) {
    fromLine =
      opts.since != null
        ? opts.since
        : logFile === state.baseline.logFile
          ? state.baseline.lineCount
          : 0
  } else if (logFile !== state.cursor.logFile) {
    fromLine = 0
  }

  const { entries, totalLines } = readNewEntries(logFile, fromLine, opts.tail || 0)
  const matched = opts.waitFor ? entries.filter((e) => matchesCriteria(e, opts.waitFor)) : []

  writeState({
    baseline: state.baseline,
    cursor: { lineCount: totalLines, logFile },
  })

  return { health, entries, totalLines, fromLine, matched }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const main = async () => {
  const opts = parseArgs()
  opts.waitFor = parseWaitFor(opts.waitFor)

  if (opts.resetBaseline) {
    try {
      const health = await fetchHealth()
      const lineCount = health.lineCount ?? 0
      const logFile = health.logFile
      writeState({
        baseline: { lineCount, logFile },
        cursor: { lineCount, logFile },
      })
      emit(opts, {
        type: 'status',
        message: `baseline set: ${lineCount} lines in ${health.logFileName}`,
        logFileName: health.logFileName,
        lineCount,
      })
      process.exit(0)
    } catch {
      emit(opts, { type: 'error', message: `debug server not running on :${PORT}` })
      process.exit(1)
    }
  }

  let state = readState()
  const deadline = opts.timeout > 0 ? Date.now() + opts.timeout : 0

  const run = async () => {
    try {
      const result = await pollOnce(opts, state)
      state = readState()

      if (opts.waitFor && result.matched.length) {
        emit(opts, {
          type: 'matched',
          entries: result.matched,
          logFileName: result.health.logFileName,
          lineCount: result.totalLines,
        })
        process.exit(0)
      }

      if (result.entries.length) {
        emit(opts, {
          type: 'entries',
          entries: result.entries,
          logFileName: result.health.logFileName,
          lineCount: result.totalLines,
          newCount: result.entries.length,
        })
        if (opts.once && !opts.waitFor) process.exit(0)
      } else if (opts.once) {
        emit(opts, {
          type: 'status',
          logFileName: result.health.logFileName,
          lineCount: result.totalLines,
          newCount: 0,
          message: 'no new entries',
        })
        process.exit(opts.waitFor ? 2 : 3)
      }

      if (opts.once) {
        if (opts.waitFor) process.exit(2)
        return
      }

      if (deadline && Date.now() >= deadline) {
        emit(opts, {
          type: 'timeout',
          message: `timeout after ${opts.timeout}ms waiting for ${JSON.stringify(opts.waitFor)}`,
        })
        process.exit(2)
      }

      await sleep(opts.interval)
      await run()
    } catch (err) {
      emit(opts, {
        type: 'error',
        message: `debug server not reachable on :${PORT} (${err.message || err})`,
      })
      process.exit(1)
    }
  }

  await run()
}

main()
