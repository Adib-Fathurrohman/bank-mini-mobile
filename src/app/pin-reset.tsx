import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import * as customerApi from '@/api/customer'
import { isApiError } from '@/api/errors'
import type { PinResetRequest } from '@/api/types'
import { ConfirmIdentity } from '@/components/ConfirmIdentity'
import { PinPad, PinPadArea } from '@/components/PinPad'
import { Body, Button, Card, LinkButton, Loading, Muted, Notice, Screen, Title } from '@/components/ui'
import { keys, usePinResetRequest } from '@/features/queries'
import { formatDateTime } from '@/lib/format'
import { firebaseMessage } from '@/session/firebaseAuth'
import { useSession } from '@/session/SessionProvider'

const WARNING = 'Selama permintaan terbuka, penarikan ditunda. Jika bukan Anda yang meminta, batalkan sekarang.'

/**
 * Forgotten PIN (backend v0.1.1). Two routes: an administrator resets it at the
 * counter (the app then asks for a new PIN by itself), or self-service here: the
 * request needs a fresh sign-in, an administrator's approval and a 24-hour wait,
 * so a stolen phone that is still signed in cannot take over the PIN.
 */
export default function PinResetScreen() {
  const query = usePinResetRequest()
  const queryClient = useQueryClient()
  const { refreshCustomer } = useSession()
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    await queryClient.invalidateQueries({ queryKey: keys.pinReset })
  }

  /** Refusals that change what this screen should show. */
  async function handle(e: unknown) {
    if (isApiError(e) && e.code === 'pin_not_set') {
      // No PIN at all (reset at the counter): the session moves to PIN creation.
      await refreshCustomer().catch(() => undefined)
      return
    }
    if (isApiError(e) && e.code?.startsWith('pin_reset_')) await reload()
    setError(firebaseMessage(e))
  }

  const request = query.data

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Title>Lupa PIN</Title>
        <Body>PIN tidak bisa dilihat siapa pun, termasuk petugas. Yang bisa dilakukan adalah membuat PIN baru.</Body>
      </View>
      <Notice tone="warning">{WARNING}</Notice>
      {error && <Notice>{error}</Notice>}

      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <>
          <Notice>{query.error.message}</Notice>
          <Button variant="secondary" onPress={() => void query.refetch()}>
            Coba lagi
          </Button>
        </>
      ) : !request ? (
        <NoRequest
          onRequested={async (idToken) => {
            setError(null)
            try {
              await customerApi.requestPinReset(idToken)
              await reload()
            } catch (e) {
              await handle(e)
            }
          }}
        />
      ) : request.status === 'approved' && request.ready ? (
        <CreateNewPin request={request} onError={handle} onCancel={reload} />
      ) : (
        <Waiting request={request} onChanged={reload} onError={handle} />
      )}

      <LinkButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>Kembali</LinkButton>
    </Screen>
  )
}

function NoRequest({ onRequested }: { onRequested: (idToken: string) => Promise<void> }) {
  return (
    <>
      <Card style={{ gap: 6, padding: 16 }}>
        <Body style={{ fontWeight: '600' }}>Cara 1: di loket bank mini</Body>
        <Muted>
          Temui petugas dengan membawa kartu pelajar. Setelah admin mereset PIN, aplikasi langsung meminta Anda membuat PIN
          baru.
        </Muted>
      </Card>
      <Card style={{ gap: 12, padding: 16 }}>
        <Body style={{ fontWeight: '600' }}>Cara 2: ajukan dari aplikasi</Body>
        <Muted>
          Admin harus menyetujui, lalu PIN baru bisa dibuat 24 jam setelah permintaan diajukan. Selama itu penarikan ditunda.
        </Muted>
        <ConfirmIdentity intro="Untuk mengajukan, masuk ulang dengan akun Anda." onToken={onRequested} />
      </Card>
    </>
  )
}

function Waiting({
  request,
  onChanged,
  onError,
}: {
  request: PinResetRequest
  onChanged: () => Promise<void>
  onError: (e: unknown) => Promise<void>
}) {
  const [cancelling, setCancelling] = useState(false)
  const now = useNow(request.status === 'approved')
  const remaining = request.available_at ? new Date(request.available_at).getTime() - now : 0
  const waitOver = request.status === 'approved' && request.available_at !== null && remaining <= 0
  const onChangedRef = useRef(onChanged)
  useEffect(() => {
    onChangedRef.current = onChanged
  }, [onChanged])

  // The wait is over: ask the server, which decides `ready`.
  useEffect(() => {
    if (waitOver) void onChangedRef.current()
  }, [waitOver])

  async function cancel() {
    setCancelling(true)
    try {
      await customerApi.cancelPinReset(request.id)
      await onChanged()
    } catch (e) {
      await onError(e)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Card style={{ gap: 12, padding: 16 }}>
      {request.status === 'pending' ? (
        <>
          <Body style={{ fontWeight: '600' }}>Menunggu persetujuan admin</Body>
          <Muted>Temui petugas bank mini dengan membawa kartu pelajar.</Muted>
          <Muted>Diajukan {formatDateTime(request.requested_at)}</Muted>
        </>
      ) : (
        <>
          <Body style={{ fontWeight: '600' }}>
            Disetujui. PIN baru bisa dibuat mulai {request.available_at ? formatDateTime(request.available_at) : '-'}
          </Body>
          {remaining > 0 && <Title style={{ fontVariant: ['tabular-nums'] }}>{formatHms(remaining)}</Title>}
          {request.decision_note ? <Muted>Catatan admin: {request.decision_note}</Muted> : null}
        </>
      )}
      <Button variant="danger" loading={cancelling} onPress={() => void cancel()}>
        Batalkan permintaan
      </Button>
    </Card>
  )
}

function CreateNewPin({
  request,
  onError,
  onCancel,
}: {
  request: PinResetRequest
  onError: (e: unknown) => Promise<void>
  onCancel: () => Promise<void>
}) {
  const { lock, refreshCustomer } = useSession()
  const [first, setFirst] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  function onComplete(value: string) {
    setMismatch(false)
    if (first === null) {
      setFirst(value)
    } else if (value === first) {
      setChosen(value)
    } else {
      setMismatch(true)
      setFirst(null)
    }
    setPin('')
  }

  async function complete(idToken: string) {
    if (!chosen) return
    try {
      await customerApi.completePinReset(request.id, idToken, chosen, chosen)
    } catch (e) {
      if (isApiError(e) && e.kind === 'validation') {
        setChosen(null)
        setFirst(null)
      }
      await onError(e)
      return
    }
    // Done: open the app with the new PIN.
    await refreshCustomer().catch(() => undefined)
    lock()
    setTimeout(() => router.replace('/unlock'), 0)
  }

  async function cancel() {
    setCancelling(true)
    try {
      await customerApi.cancelPinReset(request.id)
    } catch (e) {
      await onError(e)
    } finally {
      setCancelling(false)
      await onCancel()
    }
  }

  if (chosen) {
    return (
      <Card style={{ gap: 12, padding: 16 }}>
        <Body style={{ fontWeight: '600' }}>Simpan PIN baru</Body>
        <ConfirmIdentity intro="Terakhir, masuk ulang dengan akun Anda untuk menyimpan PIN baru." onToken={complete} />
        <LinkButton
          onPress={() => {
            setChosen(null)
            setFirst(null)
          }}
        >
          Ganti PIN yang dipilih
        </LinkButton>
      </Card>
    )
  }

  return (
    <>
      <Notice tone="success" title="Disetujui">
        Sekarang Anda bisa membuat PIN baru.
      </Notice>
      {mismatch && <Notice>PIN tidak sama. Ulangi dari awal.</Notice>}
      <Body style={{ textAlign: 'center', fontWeight: '600' }}>
        {first === null ? 'Masukkan PIN baru (6 angka)' : 'Ulangi PIN baru'}
      </Body>
      <PinPadArea>
        <PinPad label={first === null ? 'PIN baru' : 'Ulangi PIN baru'} value={pin} onChange={setPin} onComplete={onComplete} />
      </PinPadArea>
      <Button variant="danger" loading={cancelling} onPress={() => void cancel()}>
        Batalkan permintaan
      </Button>
    </>
  )
}

/** The current time, ticking every second while `active`. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])
  return now
}

/** `23:59:58` */
function formatHms(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}
