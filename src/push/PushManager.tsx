import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as customerApi from '@/api/customer'
import { Icon } from '@/components/Icon'
import { keys } from '@/features/queries'
import { useSession } from '@/session/SessionProvider'
import { colors, MAX_WIDTH } from '@/theme'
import {
  getInitialRequestId,
  onForegroundRequest,
  onPinResetPush,
  onPushTokenRefresh,
  onRequestOpened,
  pushPlatform,
  pushSupported,
} from './messaging'
import { isPushEnabled } from './preference'
import { setPendingRequest } from './pendingRequest'
import { registerThisDevice } from './register'

const BANNER_MS = 8_000

type Banner =
  | { kind: 'request'; id: string; title: string | null; body: string | null }
  | { kind: 'pinReset'; title: string | null; body: string | null }

/**
 * Push notifications for new withdrawal requests (FRONTEND_HANDOFF.md §15.11):
 * registers this phone's FCM token while signed in with a PIN, shows a banner for
 * a push received in the foreground, and opens a tapped request only through the
 * normal session checks (sign-in, PIN unlock). Never approves anything itself.
 */
export function PushManager() {
  const { stage, customer } = useSession()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const [banner, setBanner] = useState<Banner | null>(null)
  const signedIn = (stage === 'locked' || stage === 'ready') && customer?.pin_set === true
  const customerId = customer?.id

  // Register on every start while signed in (and right after sign-in or PIN
  // creation), and again whenever FCM rotates the token.
  useEffect(() => {
    if (!pushSupported || !signedIn || !pushPlatform) return
    const platform = pushPlatform
    void isPushEnabled().then((enabled) => (enabled ? registerThisDevice() : undefined))
    return onPushTokenRefresh((token) => {
      void isPushEnabled().then((enabled) => (enabled ? customerApi.registerPushToken(token, platform).catch(() => undefined) : undefined))
    })
  }, [signedIn, customerId])

  // Taps on a notification (background or cold start) and pushes in the foreground.
  useEffect(() => {
    if (!pushSupported) return
    void getInitialRequestId().then((id) => id && setPendingRequest(id))
    const offOpened = onRequestOpened(setPendingRequest)
    const offForeground = onForegroundRequest((push) => {
      setBanner({ kind: 'request', ...push })
      void queryClient.invalidateQueries({ queryKey: keys.approvals })
    })
    const offPinReset = onPinResetPush((push) => {
      void queryClient.invalidateQueries({ queryKey: keys.pinReset })
      if (!push.opened) setBanner({ kind: 'pinReset', title: push.title, body: push.body })
    })
    return () => {
      offOpened()
      offForeground()
      offPinReset()
    }
  }, [queryClient])

  useEffect(() => {
    if (!banner) return
    const timer = setTimeout(() => setBanner(null), BANNER_MS)
    return () => clearTimeout(timer)
  }, [banner])

  if (!banner) return null
  const fallbackTitle = banner.kind === 'request' ? 'Permintaan penarikan' : 'Reset PIN'
  return (
    <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${banner.title ?? fallbackTitle}. ${banner.body ?? ''} Buka.`}
        onPress={() => {
          if (banner.kind === 'request') setPendingRequest(banner.id)
          else if (stage === 'locked' || stage === 'ready') router.push('/pin-reset')
          setBanner(null)
        }}
        style={({ pressed }) => [styles.banner, pressed && { backgroundColor: colors.brand800 }]}
      >
        <Icon name="phone" color={colors.white} size={20} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>{banner.title ?? fallbackTitle}</Text>
          {banner.body ? <Text style={styles.body}>{banner.body}</Text> : null}
        </View>
        <Icon name="chevron" color={colors.white} size={18} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 12, right: 12, zIndex: 10, alignItems: 'center' },
  banner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.brand700,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { color: colors.white, fontSize: 15, fontWeight: '700' },
  body: { color: colors.brand100, fontSize: 13, lineHeight: 18 },
})
