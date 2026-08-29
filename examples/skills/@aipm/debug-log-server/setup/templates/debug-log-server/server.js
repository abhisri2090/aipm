#!/usr/bin/env node
/**
 * Interactive debug log collector — pb-desktop-home perf tracing.
 * Keys: n=new c=clear s=status a=analyze t=tail h=help q=quit
 */
import http from 'http'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.DEBUG_LOG_PORT || 3927)
const LOGS_DIR = path.join(__dirname, 'logs')
const DEV_PORT = process.env.PORT || 1213
const CORS_ORIGINS = process.env.DEBUG_LOG_CORS
  ? process.env.DEBUG_LOG_CORS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : [
      `http://localhost:${DEV_PORT}`,
      `http://127.0.0.1:${DEV_PORT}`,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:1212',
      'http://127.0.0.1:1212',
    ]

const ALLOW_LAN_ORIGINS = process.env.DEBUG_LOG_ALLOW_LAN !== '0'

const isLocalHost = (hostname) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'

const isPrivateLanHost = (hostname) =>
  /^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)

const isLanOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    return isLocalHost(hostname) || isPrivateLanHost(hostname)
  } catch {
    return false
  }
}

const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const GREEN = '\x1b[32m'
const CYAN = '\x1b[36m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

let logFileName = ''
let logFilePath = ''
let writeStream = null
let lineCount = 0
let tailLive = false

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true })
}

const makeFileName = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `session-${stamp}.jsonl`
}

const closeStream = () =>
  new Promise((resolve) => {
    if (!writeStream) {
      resolve()
      return
    }
    writeStream.end(() => {
      writeStream = null
      resolve()
    })
  })

const openLogFile = async (fileName) => {
  await closeStream()
  logFileName = fileName || makeFileName()
  logFilePath = path.join(LOGS_DIR, logFileName)
  writeStream = fs.createWriteStream(logFilePath, { flags: 'a' })
  lineCount = 0
  if (fs.existsSync(logFilePath)) {
    const content = fs.readFileSync(logFilePath, 'utf8').trim()
    lineCount = content ? content.split('\n').length : 0
  }
}

const printHelp = (full = true) => {
  if (full) console.log(`${BOLD}  Commands${RESET}`)
  console.log(`  ${CYAN}n${RESET}  new file     start a fresh .jsonl log`)
  console.log(`  ${CYAN}c${RESET}  clear        truncate the current file`)
  console.log(`  ${CYAN}s${RESET}  status       show active file + line count`)
  console.log(`  ${CYAN}a${RESET}  analyze      run timeline report on current file`)
  console.log(
    `  ${CYAN}t${RESET}  tail         toggle live one-line log preview ${
      tailLive ? `${GREEN}(on)${RESET}` : `${DIM}(off)${RESET}`
    }`
  )
  console.log(`  ${CYAN}h${RESET}  help`)
  console.log(`  ${CYAN}q${RESET}  quit`)
  console.log('')
}

const printBanner = () => {
  console.log('')
  console.log(`${BOLD}${GREEN}  pb-desktop-home — debug log server${RESET}`)
  console.log(`  ${DIM}URL${RESET}       http://127.0.0.1:${PORT}`)
  console.log(`  ${DIM}Health${RESET}    http://127.0.0.1:${PORT}/health`)
  const lanIps = []
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family === 'IPv4' && !iface.internal && isPrivateLanHost(iface.address)) {
        lanIps.push(iface.address)
      }
    }
  }
  if (lanIps.length) {
    console.log(`  ${DIM}LAN${RESET}        http://${[...new Set(lanIps)][0]}:${PORT}`)
  }
  console.log(`  ${DIM}Vite dev${RESET}  port :${DEV_PORT} — set DEBUG_LOG_CORS if using another port`)
  console.log(`  ${DIM}LAN CORS${RESET}   ${ALLOW_LAN_ORIGINS ? 'on' : 'off'}`)
  console.log('')
  console.log(`  ${BOLD}${CYAN}ACTIVE LOG FILE${RESET}`)
  console.log(`  ${YELLOW}${logFileName}${RESET}`)
  console.log(`  ${DIM}${logFilePath}${RESET}`)
  console.log(`  ${DIM}lines:${RESET} ${lineCount}`)
  console.log('')
  printHelp(false)
}

const formatPreview = (entry) => {
  const src = entry.source || '?'
  const ev = entry.event || 'log'
  const name = entry.name || entry.step || entry.route || entry.tag || ''
  const ms = entry.durationMs != null ? ` ${entry.durationMs}ms` : ''
  return `[${src}] ${ev}${name ? ` ${name}` : ''}${ms}`
}

const appendEntry = (entry) => {
  const line = `${JSON.stringify(entry)}\n`
  writeStream.write(line)
  lineCount += 1
  if (tailLive) {
    console.log(`  ${DIM}+${RESET} ${formatPreview(entry)}`)
  }
}

const setCors = (req, res) => {
  const origin = req.headers.origin || ''
  const allowed =
    !origin ||
    CORS_ORIGINS.includes(origin) ||
    CORS_ORIGINS.includes('*') ||
    (ALLOW_LAN_ORIGINS && isLanOrigin(origin))
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : null)
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })

const handleClear = async () => {
  await closeStream()
  fs.writeFileSync(logFilePath, '')
  writeStream = fs.createWriteStream(logFilePath, { flags: 'a' })
  lineCount = 0
  console.log(`\n  ${GREEN}Cleared${RESET} ${YELLOW}${logFileName}${RESET}\n`)
}

const handleNewFile = async () => {
  const prev = logFileName
  await openLogFile(makeFileName())
  console.log('')
  console.log(`  ${GREEN}New log file${RESET}`)
  console.log(`  ${DIM}previous:${RESET} ${prev}`)
  console.log(`  ${BOLD}${YELLOW}${logFileName}${RESET}`)
  console.log(`  ${DIM}${logFilePath}${RESET}`)
  console.log('')
}

const handleStatus = () => {
  console.log('')
  console.log(`  ${BOLD}Status${RESET}`)
  console.log(`  file:  ${YELLOW}${logFileName}${RESET}`)
  console.log(`  path:  ${DIM}${logFilePath}${RESET}`)
  console.log(`  lines: ${lineCount}`)
  console.log(`  tail:  ${tailLive ? 'on' : 'off'}`)
  console.log('')
}

const handleAnalyze = () => {
  const analyzeScript = path.join(__dirname, 'analyze.js')
  console.log(`\n  ${DIM}Analyzing ${logFileName}…${RESET}\n`)
  const child = spawn(process.execPath, [analyzeScript, logFilePath], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  })
  child.on('close', () => {
    console.log('')
    printHelp(false)
  })
}

const handleCommand = async (key) => {
  switch (key.toLowerCase()) {
    case 'c':
      await handleClear()
      break
    case 'n':
      await handleNewFile()
      break
    case 's':
      handleStatus()
      break
    case 'a':
      handleAnalyze()
      break
    case 't':
      tailLive = !tailLive
      console.log(`\n  tail ${tailLive ? `${GREEN}enabled${RESET}` : `${DIM}disabled${RESET}`}\n`)
      break
    case 'h':
      printHelp()
      break
    case 'q':
      await shutdown()
      break
    default:
      break
  }
}

const setupInteractive = () => {
  if (!process.stdin.isTTY) return

  readline.emitKeypressEvents(process.stdin)
  if (process.stdin.isTTY) process.stdin.setRawMode(true)
  process.stdin.resume()

  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      shutdown()
      return
    }
    if (key.name === 'return') {
      handleStatus()
      return
    }
    if (str && str.length === 1) {
      handleCommand(str)
    }
  })
}

const server = http.createServer(async (req, res) => {
  setCors(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, {
        ok: true,
        port: PORT,
        logFile: logFilePath,
        logFileName,
        lineCount,
        tailLive,
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/files') {
      const files = fs
        .readdirSync(LOGS_DIR)
        .filter((f) => f.endsWith('.jsonl'))
        .map((f) => {
          const p = path.join(LOGS_DIR, f)
          const stat = fs.statSync(p)
          return { name: f, path: p, size: stat.size, mtime: stat.mtime.toISOString() }
        })
        .sort((a, b) => b.mtime.localeCompare(a.mtime))
      sendJson(res, 200, { files, active: logFileName })
      return
    }

    if (req.method === 'POST' && (url.pathname === '/api/log' || url.pathname === '/api/logs')) {
      const body = await readBody(req)
      const receivedAt = new Date().toISOString()
      const entries = url.pathname === '/api/logs' && Array.isArray(body) ? body : [body]

      for (const item of entries) {
        if (!item || typeof item !== 'object') continue
        appendEntry({
          receivedAt,
          serverSession: logFileName,
          ...item,
        })
      }

      sendJson(res, 202, { ok: true, accepted: entries.length, lineCount, logFileName })
      return
    }

    sendJson(res, 404, { error: 'not_found' })
  } catch (err) {
    sendJson(res, 400, { error: 'bad_request', message: String(err.message || err) })
  }
})

const shutdown = async () => {
  console.log(`\n  ${DIM}Shutting down…${RESET}\n`)
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false)
  }
  await closeStream()
  server.close(() => process.exit(0))
}

const main = async () => {
  await openLogFile(makeFileName())

  server.listen(PORT, '0.0.0.0', () => {
    printBanner()
    setupInteractive()
  })

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
