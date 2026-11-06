import * as customerApi from '@/api/customer'
import { getPushToken, pushPlatform, pushSupported, requestPushPermission } from './messaging'

export type RegisterResult = { ok: true; message: string } | { ok: false; reason: 'unsupported' | 'denied' | 'failed'; message?: string }

/**
 * Ask for the notification permission and send this phone's FCM token to the
 * backend (FRONTEND_HANDOFF.md §15.11). Called after sign-in once the PIN exists,
 * on every start while signed in, and from the "Notifikasi" switch.
 */
export async function registerThisDevice(): Promise<RegisterResult> {
  if (!pushSupported || !pushPlatform) return { ok: false, reason: 'unsupported' }
  try {
    if (!(await requestPushPermission())) return { ok: false, reason: 'denied' }
    const token = await getPushToken()
    if (!token) return { ok: false, reason: 'failed' }
    const result = await customerApi.registerPushToken(token, pushPlatform)
    return { ok: true, message: result.message }
  } catch (error) {
    return { ok: false, reason: 'failed', message: error instanceof Error ? error.message : undefined }
  }
}

/** The switch turned off: the server stops pushing to this phone. */
export async function unregisterThisDevice(): Promise<string | null> {
  if (!pushSupported) return null
  const token = await getPushToken()
  if (!token) return null
  return (await customerApi.unregisterPushToken(token)).message
}
