import { useEffect, useState } from 'react'
import { AppState, Platform, View } from 'react-native'
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { isApiError } from '@/api/errors'
import { Body, Button, Loading, Screen, Title } from '@/components/ui'
import { PushManager } from '@/push/PushManager'
import { SessionProvider, useSession } from '@/session/SessionProvider'
import { colors } from '@/theme'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        // Never retry a refused request; one retry for a flaky connection.
        retry: (count, error) => count < 1 && isApiError(error) && (error.kind === 'network' || error.kind === 'unavailable'),
      },
    },
  })
}

/** Each stage of the session unlocks its own screens (Expo Router protected routes). */
function Navigator() {
  const { stage, retry } = useSession()

  if (stage === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Loading label="Membuka Bank Mini…" />
      </View>
    )
  }
  if (stage === 'unavailable') {
    return (
      <Screen>
        <Title>Tidak dapat terhubung</Title>
        <Body>Server Bank Mini tidak dapat dihubungi. Periksa koneksi internet lalu coba lagi.</Body>
        <Button onPress={retry}>Coba lagi</Button>
      </Screen>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Protected guard={stage === 'signedOut'}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="activate" />
      </Stack.Protected>
      <Stack.Protected guard={stage === 'createPin'}>
        <Stack.Screen name="create-pin" />
      </Stack.Protected>
      <Stack.Protected guard={stage === 'locked'}>
        <Stack.Screen name="unlock" />
      </Stack.Protected>
      <Stack.Protected guard={stage === 'ready'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient)

  // On phones "focused" means the app is in the foreground: polling for
  // withdrawal requests pauses in the background. The web uses page visibility.
  useEffect(() => {
    if (Platform.OS === 'web') return
    const subscription = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'))
    return () => subscription.remove()
  }, [])
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <Navigator />
            <PushManager />
          </View>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
