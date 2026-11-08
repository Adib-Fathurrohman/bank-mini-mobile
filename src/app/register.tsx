import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { Body, Button, LinkButton, Notice, Screen, TextField, Title } from '@/components/ui'
import { auth } from '@/lib/firebase'
import { firebaseMessage } from '@/session/firebaseAuth'

/** First time with email: create the Firebase account, then verify the address. */
export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Isi alamat email yang valid.')
    if (password.length < 8) return setError('Password minimal 8 karakter.')
    if (password !== confirmation) return setError('Konfirmasi password tidak sama.')
    setError(null)
    setPending(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await sendEmailVerification(user)
      router.replace('/verify-email')
    } catch (e) {
      setError(firebaseMessage(e))
    } finally {
      setPending(false)
    }
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Title>Buat akun</Title>
        <Body>
          Pakai email yang didaftarkan sekolah di bank mini. Setelah itu kami kirim email verifikasi, lalu Anda mengisi NIS
          dan membuat PIN.
        </Body>
      </View>
      <Notice tone="info">
        Email sekolah Anda akun Google (misalnya Gmail)? Lebih mudah kembali dan pilih &quot;Lanjutkan dengan Google&quot;:
        tanpa password baru dan tanpa email verifikasi.
      </Notice>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        inputMode="email"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        hint="Minimal 8 karakter. Ini password akun, bukan PIN."
      />
      <TextField label="Ulangi password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" onSubmitEditing={() => void submit()} />
      {error && <Notice>{error}</Notice>}
      <Button loading={pending} onPress={() => void submit()}>
        Buat akun
      </Button>
      <LinkButton onPress={() => router.back()}>Sudah punya akun? Masuk</LinkButton>
    </Screen>
  )
}
