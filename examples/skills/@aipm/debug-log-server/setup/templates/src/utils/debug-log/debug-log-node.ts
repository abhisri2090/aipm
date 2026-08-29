import http from 'http'

import { DEBUG_LOG_PORT } from './debug-log.const'
import type { DebugLogEntry } from './debug-log-client'

const isDevelopment = (): boolean => process.env.NODE_ENV !== 'production'

export const sendDebugLogNode = (entry: DebugLogEntry): void => {
  if (!isDevelopment()) return

  const payload = JSON.stringify({
    ts: new Date().toISOString(),
    ...entry,
  })

  const req = http.request({
    hostname: '127.0.0.1',
    port: DEBUG_LOG_PORT,
    path: '/api/log',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  })

  req.on('error', () => {})
  req.write(payload)
  req.end()
}
