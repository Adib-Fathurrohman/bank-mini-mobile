import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import type { User } from 'firebase/auth'
import { Brand } from '@/components/Brand'
import { GoogleButton } from '@/components/GoogleButton'
import { Body, Button, LinkButton, Muted, Notice, Screen, TextField, Title } from '@/components/ui'
import {
  exchangeForSession,
  firebaseMessage,
  GoogleNeedsExistingSignIn,
  hasPendingGoogleLink,
  signInWithGoogle,
  signInWithPassword,
} from '@/session/firebaseAuth'
import { GoogleSignInCancelled } from '@/session/googleSignIn'
import { useSession } from '@/session/SessionProvider'
import { colors } from '@/theme'

/**
 * Google first: it sends no email at all, while every email/password sign-up
 * sends a verification email from a small daily quota. Email and password stay
 * as the second option. No email-link (passwordless) sign-in anywhere.
 */
export default function SignInScreen() {
  const { startSession, signedOutReason } = useSession()
  const [withEmail, setWithEmail] = useState(false)
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
      if (e instanceof GoogleSignInCancelled) return
      // Same email already has a password account: continue with the email form.
      if (e instanceof GoogleNeedsExistingSignIn) setWithEmail(true)
      setError(firebaseMessage(e))
    } finally {
      setPending(null)
    }
  }

  function submitPassword() {
    if (!email.trim() || !password) return setError('Isi email dan password.')
    void run('password', () => signInWithPassword(email.trim(), password))
  }

  return (
    <Screen>
      <Brand />
      <View style={{ gap: 6, marginTop: 8 }}>
        <Title>Masuk</Title>
        <Body>Gunakan email yang didaftarkan sekolah.</Body>
      </View>

      {signedOutReason && <Notice tone="info">{signedOutReason}</Notice>}

      <GoogleButton loading={pending === 'google'} disabled={pending !== null} onPress={() => void run('google', signInWithGoogle)} />

      <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.line} />
        <Text style={styles.dividerText}>ATAU</Text>
        <View style={styles.line} />
      </View>

      {!withEmail ? (
        <>
          {error && <Notice>{error}</Notice>}
          <Button variant="secondary" disabled={pending !== null} onPress={() => setWithEmail(true)}>
            Lanjutkan dengan Email
          </Button>
        </>
      ) : (
        <>
          {hasPendingGoogleLink() && (
            <Notice tone="info">Setelah masuk dengan password, akun Google Anda disambungkan ke akun ini.</Notice>
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
              Buat akun
            </Button>
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.ink300 },
  dividerText: { fontSize: 12, fontWeight: '600', letterSpacing: 1, color: colors.ink500 },
})
