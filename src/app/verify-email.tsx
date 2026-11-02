import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { sendEmailVerification, signOut } from 'firebase/auth'
import { Body, Button, LinkButton, Notice, Screen, Title } from '@/components/ui'
import { auth } from '@/lib/firebase'
import { exchangeForSession, firebaseMessage, needsVerification } from '@/session/firebaseAuth'
import { useSession } from '@/session/SessionProvider'

const RESEND_AFTER_S = 60

/** Waiting for the Firebase verification email (§15.10, option B). */
export default function VerifyEmailScreen() {
  const { firebaseUser, startSession } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [wait, setWait] = useState(RESEND_AFTER_S)

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  if (!firebaseUser) return <Redirect href="/sign-in" />

  async function checkVerified() {
    if (!firebaseUser) return
    setError(null)
    setInfo(null)
    setPending(true)
    try {
      await firebaseUser.reload()
      if (needsVerification(firebaseUser)) {
        setInfo('Email belum terverifikasi. Buka tautan di email dari Bank Mini, lalu tekan tombol ini lagi.')
        return
      }
      const outcome = await exchangeForSession(firebaseUser, startSession)
      if (outcome === 'activate') router.replace('/activate')
    } catch (e) {
      setError(firebaseMessage(e))
    } finally {
      setPending(false)
    }
  }

  async function resend() {
    if (!firebaseUser) return
    setError(null)
    try {
      await sendEmailVerification(firebaseUser)
      setInfo('Email verifikasi dikirim ulang.')
      setWait(RESEND_AFTER_S)
    } catch (e) {
      setError(firebaseMessage(e))
    }
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Title>Cek email Anda</Title>
        <Body>
          Kami mengirim tautan verifikasi ke {firebaseUser.email}. Buka tautannya (cek juga folder spam), lalu kembali ke
          sini.
        </Body>
      </View>
      {info && <Notice tone="info">{info}</Notice>}
      {error && <Notice>{error}</Notice>}
      <Button loading={pending} onPress={() => void checkVerified()}>
        Saya sudah verifikasi
      </Button>
      <Button variant="secondary" disabled={wait > 0} onPress={() => void resend()}>
        {wait > 0 ? `Kirim ulang (${wait} dtk)` : 'Kirim ulang email'}
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
