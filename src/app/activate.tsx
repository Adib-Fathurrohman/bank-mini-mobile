import { useState } from 'react'
import { View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { signOut } from 'firebase/auth'
import * as customerApi from '@/api/customer'
import { isApiError } from '@/api/errors'
import { Body, Button, LinkButton, Notice, Screen, TextField, Title } from '@/components/ui'
import { auth } from '@/lib/firebase'
import { firebaseMessage, freshIdToken } from '@/session/firebaseAuth'
import { useSession } from '@/session/SessionProvider'

/** Refusals that need a new Firebase sign-in (§15.10 "Activation screen"). */
const SIGN_IN_AGAIN = ['firebase_token_invalid', 'provider_not_allowed', 'account_inactive']

/** First sign-in: link the Firebase account to the account with this NIS. */
export default function ActivateScreen() {
  const { firebaseUser, startSession, signOut: endSession } = useSession()
  const [nis, setNis] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!firebaseUser) return <Redirect href="/sign-in" />

  async function submit() {
    if (!nis.trim()) return setError('Isi NIS sesuai kartu pelajar.')
    setError(null)
    setPending(true)
    try {
      const result = await customerApi.activate(nis.trim(), await freshIdToken())
      // pin_set is false: the session stage moves on to PIN creation.
      await startSession(result.data)
    } catch (e) {
      if (isApiError(e) && e.code === 'email_not_verified') {
        router.replace('/verify-email')
        return
      }
      if (isApiError(e) && e.code && SIGN_IN_AGAIN.includes(e.code)) {
        // Back to sign-in, with the backend's message there.
        await endSession({ reason: e.message })
        return
      }
      // activation_mismatch, already_activated, identity_already_linked, auth_unavailable, ...:
      // the backend's message as returned.
      setError(firebaseMessage(e))
    } finally {
      setPending(false)
    }
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Title>Aktifkan rekening</Title>
        <Body>Satu kali saja: isi NIS Anda agar akun ini terhubung ke rekening bank mini.</Body>
      </View>
      <TextField label="Akun" value={firebaseUser.email ?? ''} editable={false} />
      <TextField
        label="NIS"
        value={nis}
        onChangeText={(t) => setNis(t.replace(/\s/g, ''))}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={20}
        hint="Nomor induk siswa di kartu pelajar."
        onSubmitEditing={() => void submit()}
      />
      {error && <Notice>{error}</Notice>}
      <Button loading={pending} onPress={() => void submit()}>
        Aktifkan
      </Button>
      <LinkButton
        onPress={() => {
          void signOut(auth)
          router.replace('/sign-in')
        }}
      >
        Pakai akun lain
      </LinkButton>
    </Screen>
  )
}
