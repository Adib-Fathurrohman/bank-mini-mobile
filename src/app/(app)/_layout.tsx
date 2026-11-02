import { Stack } from 'expo-router'
import { colors } from '@/theme'

/** The unlocked app: tabs, plus detail screens with a back button. */
export default function AppLayout() {
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
