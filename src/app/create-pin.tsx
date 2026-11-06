import { useState } from 'react'
import { View } from 'react-native'
import * as customerApi from '@/api/customer'
import { isApiError } from '@/api/errors'
import { PinPad, PinPadArea } from '@/components/PinPad'
import { Body, Button, LinkButton, Notice, Screen, Title } from '@/components/ui'
import { FirebaseSignInRequired, firebaseMessage, freshIdToken } from '@/session/firebaseAuth'
import { useSession } from '@/session/SessionProvider'

/**
 * After activation, and after an administrator reset: the customer chooses
 * their own PIN. It is sent once with a fresh Firebase ID token and never stored.
 */
export default function CreatePinScreen() {
  const { customer, setCustomer, refreshCustomer, unlock, signOut } = useSession()
  const [first, setFirst] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsSignIn, setNeedsSignIn] = useState(false)

  async function submit(chosen: string, confirmation: string) {
    setPending(true)
    setError(null)
    try {
      await customerApi.setUpPin(await freshIdToken(), chosen, confirmation)
      if (customer) setCustomer({ ...customer, pin_set: true })
      unlock()
    } catch (e) {
      if (isApiError(e) && e.code === 'pin_already_set') {
        // Created meanwhile (another device): unlock with it instead.
        await refreshCustomer().catch(() => undefined)
        return
      }
      const signInAgain =
        e instanceof FirebaseSignInRequired || (isApiError(e) && (e.code === 'identity_mismatch' || e.code === 'firebase_token_invalid'))
      setNeedsSignIn(signInAgain)
      // The backend's message as returned (identity_mismatch, firebase_token_invalid, ...).
      setError(isApiError(e) && e.kind === 'validation' ? (e.field('pin') ?? e.message) : firebaseMessage(e))
      setFirst(null)
    } finally {
      setPin('')
      setPending(false)
    }
  }

  function onComplete(value: string) {
    if (first === null) {
      setFirst(value)
      setPin('')
      return
    }
    if (value !== first) {
      setError('PIN tidak sama. Ulangi dari awal.')
      setFirst(null)
      setPin('')
      return
    }
    void submit(first, value)
  }

  return (
    <Screen fill>
      <View style={{ gap: 6 }}>
        <Title>{first === null ? 'Buat PIN' : 'Ulangi PIN'}</Title>
        <Body>
          {first === null
            ? 'PIN 6 angka untuk membuka aplikasi dan menyetujui penarikan. Jangan beri tahu siapa pun, termasuk petugas.'
            : 'Masukkan PIN yang sama sekali lagi.'}
        </Body>
      </View>
      {error && <Notice>{error}</Notice>}
      <PinPadArea>
        {needsSignIn ? (
          <Button onPress={() => void signOut()}>Masuk lagi</Button>
        ) : (
          <PinPad label={first === null ? 'PIN baru' : 'Ulangi PIN'} value={pin} onChange={setPin} onComplete={onComplete} disabled={pending} />
        )}
        {first !== null && !pending && (
          <LinkButton
            onPress={() => {
              setFirst(null)
              setPin('')
            }}
          >
            Mulai ulang
          </LinkButton>
        )}
        <LinkButton onPress={() => void signOut()}>Keluar</LinkButton>
      </PinPadArea>
    </Screen>
  )
}
