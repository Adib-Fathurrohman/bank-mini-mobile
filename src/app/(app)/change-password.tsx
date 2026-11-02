import { useState } from 'react'
import { router } from 'expo-router'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { Body, Button, Notice, Screen, TextField } from '@/components/ui'
import { auth } from '@/lib/firebase'
import { firebaseMessage } from '@/session/firebaseAuth'

/** Firebase password change for email/password accounts (no backend endpoint). */
export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    const user = auth.currentUser
    if (!user?.email) return setError('Masuk lagi untuk mengubah password.')
    if (next.length < 8) return setError('Password baru minimal 8 karakter.')
    if (next !== confirmation) return setError('Konfirmasi password tidak sama.')
    setError(null)
    setPending(true)
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current))
      await updatePassword(user, next)
      setDone(true)
    } catch (e) {
      setError(firebaseMessage(e))
    } finally {
      setCurrent('')
      setPending(false)
    }
  }

  if (done) {
    return (
      <Screen edges={['bottom']}>
        <Notice tone="success" title="Password diubah">
          Perangkat lain yang sudah masuk tetap masuk. Untuk mengeluarkannya, pilih &quot;Keluar dari semua perangkat&quot; di
          Akun.
        </Notice>
        <Button onPress={() => router.back()}>Selesai</Button>
      </Screen>
    )
  }

  return (
    <Screen edges={['bottom']}>
      <Body>Password akun untuk masuk ke aplikasi. PIN tidak berubah.</Body>
      <TextField label="Password sekarang" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" />
      <TextField label="Password baru" value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" hint="Minimal 8 karakter." />
      <TextField label="Ulangi password baru" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" />
      {error && <Notice>{error}</Notice>}
      <Button loading={pending} onPress={() => void submit()}>
        Simpan password
      </Button>
    </Screen>
  )
}
