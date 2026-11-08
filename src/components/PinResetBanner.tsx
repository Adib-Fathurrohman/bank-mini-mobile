import { View } from 'react-native'
import { router } from 'expo-router'
import { LinkButton, Notice } from '@/components/ui'
import { usePinResetRequest } from '@/features/queries'

/**
 * An open forgotten-PIN request, shown where the student looks first (unlock and
 * home), so the real owner notices a request they did not make and can cancel it.
 */
export function PinResetBanner() {
  const { data } = usePinResetRequest()
  if (!data) return null
  const text =
    data.status === 'pending'
      ? 'Permintaan reset PIN menunggu persetujuan admin. Penarikan ditunda.'
      : data.ready
        ? 'Reset PIN disetujui. Buat PIN baru sekarang.'
        : 'Reset PIN disetujui. Penarikan ditunda sampai PIN baru dibuat.'
  return (
    <View style={{ gap: 2 }}>
      <Notice tone="warning" title="Reset PIN sedang berjalan">
        {text}
      </Notice>
      <LinkButton onPress={() => router.push('/pin-reset')}>Lihat atau batalkan</LinkButton>
    </View>
  )
}
