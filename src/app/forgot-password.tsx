import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Body, Button, LinkButton, Notice, Screen, TextField, Title } from '@/components/ui'
import { auth } from '@/lib/firebase'

/** Firebase sends the reset email. The answer is always the same so it reveals no accounts. */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Isi alamat email yang valid.')
    setError(null)
    setPending(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch {
      // Same message whatever Firebase answers (§15.10 "Forgot password").
    } finally {
      setPending(false)
      setSent(true)
    }
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Title>Lupa password</Title>
        <Body>Untuk akun yang dibuat dengan email dan password. PIN bank mini tidak berubah; lupa PIN diurus oleh petugas.</Body>
      </View>
      {sent ? (
        <Notice tone="success" title="Periksa email Anda">
          Jika email terdaftar, tautan reset telah dikirim. Ikuti tautannya lalu masuk dengan password baru.
        </Notice>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            onSubmitEditing={() => void submit()}
          />
          {error && <Notice>{error}</Notice>}
          <Button loading={pending} onPress={() => void submit()}>
            Kirim tautan reset
          </Button>
        </>
      )}
      <LinkButton onPress={() => router.back()}>Kembali ke halaman masuk</LinkButton>
    </Screen>
  )
}
