import { PermissionsAndroid, Platform } from 'react-native'
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging'
import type { PushPlatform, RequestPush } from './messaging'

export type { PushPlatform, RequestPush }

// Firebase Cloud Messaging through React Native Firebase (development build
// only, not Expo Go). The backend sends to raw FCM tokens, never to Expo's push
// service (FRONTEND_HANDOFF.md §15.11).

export const pushSupported = Platform.OS === 'android' || Platform.OS === 'ios'
export const pushPlatform: PushPlatform | null = Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : null

const messaging = () => getMessaging()

/** The package does not export its RemoteMessage type from the modular entry. */
type RemoteMessage = Parameters<Parameters<typeof onMessage>[1]>[0]

/** Android 13+ needs POST_NOTIFICATIONS; iOS asks through FCM. A refusal is fine: polling still works. */
export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Number(Platform.Version) < 33) return true
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
    return result === PermissionsAndroid.RESULTS.GRANTED
  }
  const status = await requestPermission(messaging())
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
}

export async function getPushToken(): Promise<string | null> {
  return getToken(messaging())
}

export function onPushTokenRefresh(listener: (token: string) => void): () => void {
  return onTokenRefresh(messaging(), listener)
}

function requestId(message: RemoteMessage | null): string | null {
  const data = message?.data
  if (data?.type !== 'withdrawal_authorization' || typeof data.id !== 'string') return null
  return data.id
}

/** App in the foreground: FCM shows no system notification, the app shows its own banner. */
export function onForegroundRequest(listener: (push: RequestPush) => void): () => void {
  return onMessage(messaging(), async (message) => {
    const id = requestId(message)
    if (id) listener({ id, title: message.notification?.title ?? null, body: message.notification?.body ?? null })
  })
}

/** App in the background, the customer tapped the notification. */
export function onRequestOpened(listener: (id: string) => void): () => void {
  return onNotificationOpenedApp(messaging(), (message) => {
    const id = requestId(message)
    if (id) listener(id)
  })
}

/** App was closed and opened by tapping the notification. */
export async function getInitialRequestId(): Promise<string | null> {
  return requestId(await getInitialNotification(messaging()))
}
