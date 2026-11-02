import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { setApiToken, setUnauthorizedHandler } from '@/api/client'
import * as customerApi from '@/api/customer'
import { isApiError } from '@/api/errors'
import type { Customer, CustomerSession } from '@/api/types'
import { LOCK_AFTER_MS } from '@/lib/config'
import { auth } from '@/lib/firebase'
import { readItem, removeItem, writeItem } from '@/lib/secureStore'

/**
 * Which part of the app is reachable (FRONTEND_HANDOFF.md §15.10):
 * - signedOut: Firebase sign-in, activation with the NIS
 * - createPin: a backend session exists but the customer has no PIN yet
 * - locked:    the session is valid; the PIN unlocks the app
 * - ready:     the app itself
 */
export type Stage = 'loading' | 'unavailable' | 'signedOut' | 'createPin' | 'locked' | 'ready'

interface SessionValue {
  stage: Stage
  customer: Customer | null
  firebaseUser: User | null
  /** Why the customer is back at the sign-in screen, if not by choice. */
  signedOutReason: string | null
  startSession: (session: CustomerSession) => Promise<void>
  setCustomer: (customer: Customer) => void
  unlock: () => void
  lock: () => void
  refreshCustomer: () => Promise<void>
  signOut: (options?: { allDevices?: boolean; reason?: string }) => Promise<void>
  retry: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

const TOKEN_KEY = 'bank-mini.customer.token'
const EXPIRES_KEY = 'bank-mini.customer.expires_at'

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [booted, setBooted] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [signedOutReason, setSignedOutReason] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user)
        setFirebaseReady(true)
      }),
    [],
  )

  const clearLocal = useCallback(async () => {
    setApiToken(null)
    setToken(null)
    setExpiresAt(null)
    setCustomer(null)
    setUnlocked(false)
    queryClient.clear()
    await Promise.all([removeItem(TOKEN_KEY), removeItem(EXPIRES_KEY)])
  }, [queryClient])

  const signOut = useCallback(
    async (options: { allDevices?: boolean; reason?: string } = {}) => {
      // Revoke on the server first while the token still works; local data is
      // removed even if that fails (§15.10 "Logout").
      try {
        await customerApi.logout(options.allDevices ?? false)
      } catch {
        // Offline or already expired.
      }
      await firebaseSignOut(auth).catch(() => undefined)
      await clearLocal()
      setSignedOutReason(options.reason ?? null)
    },
    [clearLocal],
  )

  // The backend session is over (401): a full Firebase sign-in is required,
  // never a silent exchange of the cached Firebase session (§15.10).
  const endedRef = useRef<() => void>(() => undefined)
  useEffect(() => {
    endedRef.current = () => {
      void firebaseSignOut(auth).catch(() => undefined)
      void clearLocal()
      setSignedOutReason('Sesi Anda telah berakhir. Silakan masuk kembali.')
    }
  }, [clearLocal])
  useEffect(() => {
    setUnauthorizedHandler(() => endedRef.current())
    return () => setUnauthorizedHandler(null)
  }, [])

  // Restore a stored session and load the customer.
  useEffect(() => {
    let cancelled = false
    async function boot() {
      setUnavailable(false)
      const [storedToken, storedExpiry] = await Promise.all([readItem(TOKEN_KEY), readItem(EXPIRES_KEY)])
      if (!storedToken || !storedExpiry || new Date(storedExpiry).getTime() <= Date.now()) {
        if (storedToken) await clearLocal()
        if (!cancelled) setBooted(true)
        return
      }
      setApiToken(storedToken)
      try {
        const me = await customerApi.fetchMe()
        if (cancelled) return
        setToken(storedToken)
        setExpiresAt(storedExpiry)
        setCustomer(me.data)
        setBooted(true)
      } catch (error) {
        if (cancelled) return
        if (isApiError(error) && (error.kind === 'unauthorized' || error.kind === 'forbidden')) {
          await clearLocal()
          setBooted(true)
        } else {
          setUnavailable(true)
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [attempt, clearLocal])

  // Ask for the PIN again after some time in the background; end an expired session.
  useEffect(() => {
    let backgroundSince: number | null = null
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
          endedRef.current()
        } else if (backgroundSince !== null && Date.now() - backgroundSince >= LOCK_AFTER_MS) {
          setUnlocked(false)
        }
        backgroundSince = null
      } else if (backgroundSince === null) {
        backgroundSince = Date.now()
      }
    })
    return () => subscription.remove()
  }, [expiresAt])

  const startSession = useCallback(async (session: CustomerSession) => {
    setApiToken(session.token)
    await Promise.all([writeItem(TOKEN_KEY, session.token), writeItem(EXPIRES_KEY, session.expires_at)])
    setToken(session.token)
    setExpiresAt(session.expires_at)
    setCustomer(session.customer)
    setSignedOutReason(null)
    // A fresh Firebase sign-in just proved who this is; the PIN is asked next time.
    setUnlocked(true)
  }, [])

  const refreshCustomer = useCallback(async () => {
    const me = await customerApi.fetchMe()
    setCustomer(me.data)
  }, [])

  let stage: Stage
  if (unavailable) stage = 'unavailable'
  else if (!booted || !firebaseReady) stage = 'loading'
  else if (!token) stage = 'signedOut'
  else if (!customer) stage = 'loading'
  else if (!customer.pin_set) stage = 'createPin'
  else if (!unlocked) stage = 'locked'
  else stage = 'ready'

  const value = useMemo<SessionValue>(
    () => ({
      stage,
      customer,
      firebaseUser,
      signedOutReason,
      startSession,
      setCustomer,
      unlock: () => setUnlocked(true),
      lock: () => setUnlocked(false),
      refreshCustomer,
      signOut,
      retry: () => setAttempt((n) => n + 1),
    }),
    [stage, customer, firebaseUser, signedOutReason, startSession, refreshCustomer, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession outside SessionProvider')
  return value
}
