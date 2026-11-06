import { useEffect } from 'react'
import { router, Stack } from 'expo-router'
import { subscribePendingRequest, takePendingRequest } from '@/push/pendingRequest'
import { useSession } from '@/session/SessionProvider'
import { colors } from '@/theme'

/** The unlocked app: tabs, plus detail screens with a back button. */
export default function AppLayout() {
  // A notification the student tapped (possibly before signing in or unlocking)
  // opens its request once the app is on screen; the approval screen loads it.
  // This layout stays mounted while the app is locked, so wait for the unlock.
  const { stage } = useSession()
  useEffect(() => {
    if (stage !== 'ready') return
    function open() {
      const id = takePendingRequest()
      if (id) router.push(`/approval/${id}`)
    }
    // After the commit that swaps the unlock screen for the app.
    const timer = setTimeout(open, 0)
    const unsubscribe = subscribePendingRequest(open)
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [stage])

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand700,
        headerTitleStyle: { color: colors.ink900, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.white },
        headerTransparent: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/[id]" options={{ title: 'Detail transaksi' }} />
      <Stack.Screen name="approval/[id]" options={{ title: 'Persetujuan tarik tunai' }} />
      <Stack.Screen name="change-pin" options={{ title: 'Ubah PIN' }} />
      <Stack.Screen name="change-password" options={{ title: 'Ubah password' }} />
      <Stack.Screen name="statement" options={{ title: 'Unduh mutasi' }} />
    </Stack>
  )
}
