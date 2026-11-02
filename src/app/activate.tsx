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

/** Messages for the activation refusals (API.md `POST /customer/activation`). */
const ACTIVATION_MESSAGES: Record<string, string> = {
  activation_mismatch:
    'NIS tidak cocok dengan email akun ini. Periksa NIS di kartu pelajar, atau masuk dengan email yang didaftarkan sekolah.',
  already_activated:
    'Rekening ini sudah diaktifkan dengan akun Google atau email lain. Masuk dengan akun tersebut, atau hubungi petugas.',
  identity_already_linked: 'Akun ini sudah terhubung ke rekening lain. Gunakan akun lain atau hubungi petugas.',
  account_inactive: 'Rekening ini sudah ditutup.',
}

/** First sign-in: link the Firebase account to the account with this NIS. */
export default function ActivateScreen() {
  const { firebaseUser, startSession } = useSession()
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
      setError(isApiError(e) && e.code && ACTIVATION_MESSAGES[e.code] ? ACTIVATION_MESSAGES[e.code]! : firebaseMessage(e))
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
