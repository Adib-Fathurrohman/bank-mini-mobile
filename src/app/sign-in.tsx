import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { signInWithEmailAndPassword, type User } from 'firebase/auth'
import { Brand } from '@/components/Brand'
import { Body, Button, LinkButton, Muted, Notice, Screen, TextField, Title } from '@/components/ui'
import { auth } from '@/lib/firebase'
import { exchangeForSession, firebaseMessage } from '@/session/firebaseAuth'
import { googleSignInAvailable, signInWithGoogle } from '@/session/googleSignIn'
import { useSession } from '@/session/SessionProvider'

/** Sign in with the email the school registered (Google or email + password). */
export default function SignInScreen() {
  const { startSession, signedOutReason } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<'password' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function continueWith(user: User) {
    const outcome = await exchangeForSession(user, startSession)
    if (outcome === 'activate') router.push('/activate')
    else if (outcome === 'verifyEmail') router.push('/verify-email')
    // signedIn: the session stage changes and the router leaves this screen.
  }

  async function run(kind: 'password' | 'google', signIn: () => Promise<User>) {
    setError(null)
    setPending(kind)
    try {
      await continueWith(await signIn())
    } catch (e) {
      setError(firebaseMessage(e))
    } finally {
      setPending(null)
    }
  }

  function submitPassword() {
    if (!email.trim() || !password) return setError('Isi email dan password.')
    void run('password', async () => (await signInWithEmailAndPassword(auth, email.trim(), password)).user)
  }

  return (
    <Screen>
      <Brand />
      <View style={{ gap: 6, marginTop: 8 }}>
        <Title>Masuk</Title>
        <Body>Gunakan email yang didaftarkan sekolah di bank mini.</Body>
      </View>

      {signedOutReason && <Notice tone="info">{signedOutReason}</Notice>}

      {googleSignInAvailable && (
        <>
          <Button variant="secondary" loading={pending === 'google'} disabled={pending !== null} onPress={() => void run('google', signInWithGoogle)}>
            Masuk dengan Google
          </Button>
          <Muted style={{ textAlign: 'center' }}>atau dengan email</Muted>
        </>
      )}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        inputMode="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={submitPassword}
      />
      {error && <Notice>{error}</Notice>}
      <Button loading={pending === 'password'} disabled={pending !== null} onPress={submitPassword}>
        Masuk
      </Button>
      <LinkButton onPress={() => router.push('/forgot-password')}>Lupa password?</LinkButton>

      <View style={{ gap: 8, marginTop: 8 }}>
        <Muted style={{ textAlign: 'center' }}>Pertama kali dan belum punya password?</Muted>
        <Button variant="secondary" disabled={pending !== null} onPress={() => router.push('/register')}>
          Buat akun dengan email
        </Button>
      </View>
    </Screen>
  )
}
