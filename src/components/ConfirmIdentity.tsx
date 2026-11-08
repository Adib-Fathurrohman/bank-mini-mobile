import { useState } from 'react'
import { View } from 'react-native'
import { GoogleButton } from '@/components/GoogleButton'
import { Button, Muted, Notice, TextField } from '@/components/ui'
import { confirmWithGoogle, confirmWithPassword, firebaseMessage, signInMethod } from '@/session/firebaseAuth'
import { GoogleSignInCancelled } from '@/session/googleSignIn'
import { useSession } from '@/session/SessionProvider'

/**
 * A fresh Firebase sign-in right now (forgotten PIN): Google accounts pick their
 * Google account again, password accounts type their password. Hands the fresh
 * ID token to `onToken`; the backend checks it is the same student.
 */
export function ConfirmIdentity({
  onToken,
  busy = false,
  intro,
}: {
  onToken: (idToken: string) => Promise<void>
  busy?: boolean
  intro: string
}) {
  const { firebaseUser, customer } = useSession()
  const method = signInMethod(firebaseUser)
  const [email, setEmail] = useState(firebaseUser?.email ?? customer?.email ?? '')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<'google' | 'password' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(kind: 'google' | 'password', getToken: () => Promise<string>) {
    setError(null)
    setPending(kind)
    try {
      await onToken(await getToken())
    } catch (e) {
      if (!(e instanceof GoogleSignInCancelled)) setError(firebaseMessage(e))
    } finally {
      setPassword('')
      setPending(null)
    }
  }

  const disabled = busy || pending !== null
  const showGoogle = method !== 'password'
  const showPassword = method !== 'google'

  return (
    <View style={{ gap: 12 }}>
      <Muted>{intro}</Muted>
      {showGoogle && (
        <GoogleButton
          label="Konfirmasi dengan Google"
          loading={pending === 'google'}
          disabled={disabled}
          onPress={() => void run('google', confirmWithGoogle)}
        />
      )}
      {showPassword && (
        <>
          {firebaseUser?.email ? null : (
            <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" inputMode="email" />
          )}
          <TextField
            label={firebaseUser?.email ? `Password untuk ${firebaseUser.email}` : 'Password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />
          <Button
            variant={showGoogle ? 'secondary' : 'primary'}
            loading={pending === 'password'}
            disabled={disabled || !password}
            onPress={() => void run('password', () => confirmWithPassword(email.trim(), password))}
          >
            Konfirmasi dengan password
          </Button>
        </>
      )}
      {error && <Notice>{error}</Notice>}
    </View>
  )
}
