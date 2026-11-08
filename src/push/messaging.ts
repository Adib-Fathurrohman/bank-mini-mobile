// Web build: React Native Firebase does not run in the browser and the backend
// accepts only android and ios tokens, so there is no push. The app learns about
// withdrawal requests by polling instead. Phones: messaging.native.ts.

export type PushPlatform = 'android' | 'ios'

/** A withdrawal request announced by a push (`data.type === "withdrawal_authorization"`). */
export interface RequestPush {
  id: string
  title: string | null
  body: string | null
}

/** A step of a forgotten-PIN request (`data.type === "pin_reset"`). */
export interface PinResetPush {
  title: string | null
  body: string | null
  /** true: the student tapped the notification; false: it arrived while the app was open. */
  opened: boolean
}

export const pushSupported = false
export const pushPlatform: PushPlatform | null = null

export async function requestPushPermission(): Promise<boolean> {
  return false
}

export async function getPushToken(): Promise<string | null> {
  return null
}

export function onPushTokenRefresh(_listener: (token: string) => void): () => void {
  return () => undefined
}

export function onForegroundRequest(_listener: (push: RequestPush) => void): () => void {
  return () => undefined
}

export function onRequestOpened(_listener: (id: string) => void): () => void {
  return () => undefined
}

export async function getInitialRequestId(): Promise<string | null> {
  return null
}

export function onPinResetPush(_listener: (push: PinResetPush) => void): () => void {
  return () => undefined
}
