import { API_URL } from '@/lib/config'
import { errorFromResponse, networkError } from './errors'

// Bearer-token JSON client. The session provider sets the token and is told
// when the backend answers 401 so it can end the session.

let token: string | null = null
let onUnauthorized: (() => void) | null = null

export function setApiToken(value: string | null) {
  token = value
}

export function getApiToken(): string | null {
  return token
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

type Query = Record<string, string | number | undefined>

export function apiUrl(path: string, query?: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const search = params.toString()
  return `${API_URL}${path}${search ? `?${search}` : ''}`
}

export function authHeaders(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(method: string, path: string, options: { body?: unknown; query?: Query; timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000)
  let response: Response
  try {
    response = await fetch(apiUrl(path, options.query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
  } catch {
    throw networkError()
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    const error = errorFromResponse(response.status, body)
    // A 401 on an authenticated call means the backend session is over. The
    // public auth endpoints answer 401 for a bad Firebase token instead.
    if (response.status === 401 && token && !path.startsWith('/customer/auth') && path !== '/customer/activation') {
      onUnauthorized?.()
    }
    throw error
  }
  return body as T
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
}
