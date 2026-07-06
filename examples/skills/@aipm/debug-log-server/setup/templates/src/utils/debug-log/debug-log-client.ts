import {
  DEBUG_LOG_PORT,
  DEBUG_LOG_QUERY_PARAM,
  DEBUG_SESSION_QUERY_PARAM,
  DEBUG_PERF_FLAG,
  DEBUG_SESSION_STORAGE_KEY,
} from './debug-log.const'
import { isLocalhost } from './debug-log-lan'

const isDevelopment = (): boolean => import.meta.env.DEV

export type DebugLogSource = 'shell' | 'dashboard'

export type DebugLogEntry = {
  source: DebugLogSource
  level?: 'perf' | 'info' | 'warn' | 'error'
  event: string
  sessionId?: string
  name?: string
  durationMs?: number
  startMark?: string
  endMark?: string
  step?: string
  route?: string
  method?: string
  url?: string
  status?: number
  tag?: string
  message?: string
  detail?: Record<string, unknown>
  [key: string]: unknown
}

const readQueryParam = (name: string): string | null => {
  if (!isDevelopment() || typeof window === 'undefined') return null
  try {
    return new URLSearchParams(window.location.search).get(name)
  } catch {
    return null
  }
}

const resolveDebugLogUrlFromQuery = (): string | undefined => {
  const raw = readQueryParam(DEBUG_LOG_QUERY_PARAM)
  if (!raw) return undefined
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

const resolveLanDebugLogUrl = (): string | undefined => {
  if (!isDevelopment() || typeof window === 'undefined') return undefined
  const { hostname, protocol } = window.location
  if (isLocalhost(hostname)) return undefined
  const scheme = protocol === 'https:' ? 'https' : 'http'
  return `${scheme}://${hostname}:${DEBUG_LOG_PORT}`
}

export const getDebugLogUrl = (): string =>
  resolveDebugLogUrlFromQuery() || resolveLanDebugLogUrl() || `http://127.0.0.1:${DEBUG_LOG_PORT}`

export const getOrCreateDebugSessionId = (): string => {
  const fromUrl = readQueryParam(DEBUG_SESSION_QUERY_PARAM)
  if (fromUrl) {
    try {
      localStorage.setItem(DEBUG_SESSION_STORAGE_KEY, fromUrl)
    } catch {
      /* optional */
    }
    return fromUrl
  }
  try {
    const stored = localStorage.getItem(DEBUG_SESSION_STORAGE_KEY)
    if (stored) return stored
    const id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(DEBUG_SESSION_STORAGE_KEY, id)
    return id
  } catch {
    return `sess-${Date.now()}`
  }
}

export const isDebugLogEnabled = (): boolean => isDevelopment()

export const sendDebugLog = (entry: DebugLogEntry): void => {
  if (!isDebugLogEnabled()) return

  const payload = {
    ts: new Date().toISOString(),
    sessionId: entry.sessionId ?? getOrCreateDebugSessionId(),
    pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...entry,
  }

  const url = `${getDebugLogUrl().replace(/\/$/, '')}/api/log`

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    mode: 'cors',
  }).catch(() => {})
}

export const appendDashboardDebugQueryParams = (rawUrl: string): string => {
  if (!isDebugLogEnabled()) return rawUrl

  try {
    const url = new URL(rawUrl)
    url.searchParams.set(DEBUG_PERF_FLAG, '1')
    url.searchParams.set(DEBUG_SESSION_QUERY_PARAM, getOrCreateDebugSessionId())
    url.searchParams.set(DEBUG_LOG_QUERY_PARAM, getDebugLogUrl())
    return url.toString()
  } catch {
    const sep = rawUrl.includes('?') ? '&' : '?'
    return `${rawUrl}${sep}${DEBUG_PERF_FLAG}=1&${DEBUG_SESSION_QUERY_PARAM}=${encodeURIComponent(
      getOrCreateDebugSessionId()
    )}&${DEBUG_LOG_QUERY_PARAM}=${encodeURIComponent(getDebugLogUrl())}`
  }
}
