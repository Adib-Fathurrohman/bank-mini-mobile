import { Platform } from 'react-native'

// Where the Laravel API lives. Override with EXPO_PUBLIC_API_URL (see README):
// - development: the local backend (a phone on the LAN needs the computer's IP)
// - production web: same origin, app.rumput.tech/api is proxied to Laravel
// - production phones: the public API
function defaultApiUrl(): string {
  if (__DEV__) return 'http://localhost:8000/api'
  return Platform.OS === 'web' ? '/api' : 'https://bank.rumput.tech/api'
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl()).replace(/\/$/, '')

/** After this long in the background the app asks for the PIN again. */
export const LOCK_AFTER_MS = 60_000

/** How often the approvals screen checks for withdrawal requests while open (API.md: every 3–5 s; the fallback for a missed push). */
export const APPROVAL_POLL_MS = 4_000
