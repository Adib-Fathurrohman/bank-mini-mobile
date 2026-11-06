import { useState } from 'react'
import { router } from 'expo-router'
import * as customerApi from '@/api/customer'
import { isApiError } from '@/api/errors'
import { PinPad, PinPadArea } from '@/components/PinPad'
import { Body, Button, LinkButton, Notice, Screen, Title } from '@/components/ui'
import { formatDateTime, isInFuture } from '@/lib/format'
import { useSession } from '@/session/SessionProvider'

type Step = 'current' | 'new' | 'confirm'

const STEP_TEXT: Record<Step, { title: string; body: string }> = {
  current: { title: 'PIN sekarang', body: 'Masukkan PIN yang Anda pakai sekarang.' },
  new: { title: 'PIN baru', body: 'Pilih 6 angka baru, berbeda dari PIN sekarang.' },
  confirm: { title: 'Ulangi PIN baru', body: 'Masukkan PIN baru sekali lagi.' },
}

/** `POST /customer/pin`. A wrong current PIN counts toward the same lock as unlock and approvals. */
export default function ChangePinScreen() {
  const { refreshCustomer } = useSession()
  const [step, setStep] = useState<Step>('current')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [pin, setPin] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function restart(message: string | null) {
    setError(message)
    setCurrent('')
    setNext('')
    setPin('')
    setStep('current')
  }

  async function submit(confirmation: string) {
    setPending(true)
    try {
      await customerApi.changePin(current, next, confirmation)
      setDone(true)
    } catch (e) {
      // No PIN any more (reset by an administrator): the session moves to PIN creation.
      if (isApiError(e) && e.code === 'pin_not_set') {
        await refreshCustomer().catch(() => undefined)
        return
      }
      if (isApiError(e) && e.pinFailure) setLockedUntil(e.pinFailure.pin_locked_until)
      restart(isApiError(e) ? (e.kind === 'validation' ? (e.field('new_pin') ?? e.message) : e.message) : 'PIN tidak diubah. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  function onComplete(value: string) {
    setError(null)
    setPin('')
    if (step === 'current') {
      setCurrent(value)
      setStep('new')
    } else if (step === 'new') {
      if (value === current) return restart('PIN baru harus berbeda dari PIN sekarang.')
      setNext(value)
      setStep('confirm')
    } else if (value !== next) {
      restart('PIN baru tidak sama. Ulangi dari awal.')
    } else {
      void submit(value)
    }
  }

  if (done) {
    return (
      <Screen edges={['bottom']}>
        <Notice tone="success" title="PIN diubah">
          Gunakan PIN baru untuk membuka aplikasi dan menyetujui penarikan.
        </Notice>
        <Button onPress={() => router.back()}>Selesai</Button>
      </Screen>
    )
  }

  const locked = isInFuture(lockedUntil)
  return (
    <Screen edges={['bottom']} fill>
      <Title>{STEP_TEXT[step].title}</Title>
      <Body>{STEP_TEXT[step].body}</Body>
      {locked && lockedUntil ? (
        <Notice title={`PIN diblokir sampai ${formatDateTime(lockedUntil)}`}>Salah PIN 3 kali.</Notice>
      ) : (
        error && <Notice>{error}</Notice>
      )}
      <PinPadArea>
        <PinPad label={STEP_TEXT[step].title} value={pin} onChange={setPin} onComplete={onComplete} disabled={pending || locked} />
        {step !== 'current' && <LinkButton onPress={() => restart(null)}>Mulai ulang</LinkButton>}
      </PinPadArea>
    </Screen>
  )
}
