import { useState } from 'react'
import { View } from 'react-native'
import * as customerApi from '@/api/customer'
import { isApiError } from '@/api/errors'
import { PinPad } from '@/components/PinPad'
import { Brand } from '@/components/Brand'
import { Body, LinkButton, Muted, Notice, Screen, Title } from '@/components/ui'
import { formatDateTime, isInFuture } from '@/lib/format'
import { useSession } from '@/session/SessionProvider'

/** The PIN opens the app while the session is valid. Three wrong PINs anywhere lock it for 15 minutes. */
export default function UnlockScreen() {
  const { customer, unlock, refreshCustomer, signOut } = useSession()
  const [pin, setPin] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)

  async function submit(value: string) {
    setPending(true)
    setError(null)
    try {
      await customerApi.unlock(value)
      unlock()
    } catch (e) {
      if (isApiError(e) && e.code === 'pin_not_set') {
        // Reset by an administrator: the session moves to PIN creation.
        await refreshCustomer().catch(() => undefined)
        return
      }
      if (isApiError(e) && e.pinFailure) {
        setLockedUntil(e.pinFailure.pin_locked_until)
      }
      setError(isApiError(e) ? e.message : 'PIN tidak dapat diperiksa. Coba lagi.')
    } finally {
      setPin('')
      setPending(false)
    }
  }

  const locked = isInFuture(lockedUntil)

  return (
    <Screen>
      <Brand />
      <View style={{ gap: 6, marginTop: 8 }}>
        <Title>Masukkan PIN</Title>
        <Body>{customer ? `Halo, ${customer.full_name.split(' ')[0]}.` : ''} Buka aplikasi dengan PIN Anda.</Body>
      </View>
      {locked && lockedUntil ? (
        <Notice title={`PIN diblokir sampai ${formatDateTime(lockedUntil)}`}>
          Salah PIN 3 kali. Coba lagi setelah waktu tersebut, atau minta petugas mereset PIN.
        </Notice>
      ) : (
        error && <Notice>{error}</Notice>
      )}
      <PinPad label="PIN" value={pin} onChange={setPin} onComplete={(v) => void submit(v)} disabled={pending || locked} />
      <LinkButton onPress={() => void signOut()}>Keluar dan masuk dengan akun lain</LinkButton>
      <Muted style={{ textAlign: 'center' }}>Lupa PIN? Minta petugas bank mini untuk mereset.</Muted>
    </Screen>
  )
}
