import { useEffect, useState } from 'react'
import { Linking, View } from 'react-native'
import { router } from 'expo-router'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Body, Button, Card, LinkButton, Muted, Notice, Screen, TextField, Title } from '@/components/ui'
import { auth } from '@/lib/firebase'

const GOOGLE_RECOVERY = 'https://accounts.google.com/signin/recovery'
const COOLDOWN_S = 60

/**
 * Email/password accounts: Firebase sends the reset email (its own daily quota).
 * The answer is always the same so it reveals no accounts. Google accounts have no
 * app password: they recover through Google. The bank PIN is a separate thing.
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

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
      setCooldown(COOLDOWN_S)
    }
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Title>Lupa password</Title>
        <Body>PIN bank mini tidak ikut berubah. Lupa PIN? Masuk dulu, lalu pilih &quot;Lupa PIN?&quot; di layar PIN.</Body>
      </View>

      <Card style={{ gap: 10, padding: 16 }}>
        <Body style={{ fontWeight: '600' }}>Masuk dengan Google?</Body>
        <Muted>
          Akun ini masuk dengan Google dan tidak punya password di aplikasi. Pulihkan akun melalui Google
          (accounts.google.com/signin/recovery).
        </Muted>
        <Button variant="secondary" onPress={() => void Linking.openURL(GOOGLE_RECOVERY)}>
          Buka
        </Button>
      </Card>

      <View style={{ gap: 6, marginTop: 4 }}>
        <Body style={{ fontWeight: '600' }}>Masuk dengan email dan password</Body>
        <Muted>Kami kirim tautan untuk membuat password baru.</Muted>
      </View>
      {sent && (
        <Notice tone="success" title="Periksa email Anda">
          Jika email terdaftar, tautan reset telah dikirim. Ikuti tautannya lalu masuk dengan password baru.
        </Notice>
      )}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        inputMode="email"
        onSubmitEditing={() => cooldown <= 0 && void submit()}
      />
      {error && <Notice>{error}</Notice>}
      <Button loading={pending} disabled={cooldown > 0} onPress={() => void submit()}>
        {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : sent ? 'Kirim ulang tautan' : 'Kirim tautan reset'}
      </Button>
      <LinkButton onPress={() => router.back()}>Kembali ke halaman masuk</LinkButton>
    </Screen>
  )
}
