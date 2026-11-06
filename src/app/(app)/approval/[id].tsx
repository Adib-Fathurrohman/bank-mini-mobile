import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as customerApi from '@/api/customer'
import type { ApiError } from '@/api/errors'
import type { WithdrawalAuthorization } from '@/api/types'
import { PinPad } from '@/components/PinPad'
import { Body, Button, Card, Loading, Muted, Notice, Row, Screen } from '@/components/ui'
import { keys, useRefreshAccount } from '@/features/queries'
import { useSession } from '@/session/SessionProvider'
import { formatCountdown, formatDateTime, formatRupiah, isInFuture } from '@/lib/format'
import { colors } from '@/theme'

const ENDED: Partial<Record<WithdrawalAuthorization['status'], { title: string; body: string }>> = {
  rejected: { title: 'Permintaan ditolak', body: 'Anda menolak penarikan ini. Tidak ada uang yang ditarik.' },
  cancelled: { title: 'Permintaan dibatalkan teller', body: 'Tidak ada uang yang ditarik.' },
  expired: { title: 'Waktu persetujuan habis', body: 'Permintaan kedaluwarsa. Minta teller mengirim ulang bila masih ingin menarik.' },
  consumed: { title: 'Penarikan selesai', body: 'Teller sudah mencatat penarikan dan menyerahkan uangnya.' },
}

/** Milliseconds left until `deadline`, on the server clock (`server_time`) so a wrong phone clock does not matter. */
function useCountdown(deadline: string | null, serverTime: string | null, receivedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])
  if (!deadline || !serverTime || receivedAt === null) return 0
  const skew = new Date(serverTime).getTime() - receivedAt
  return new Date(deadline).getTime() - (now + skew)
}

/**
 * A withdrawal the teller started (API.md "Withdrawal authorizations"): the
 * customer checks it and approves with their PIN, or rejects it. The PIN is
 * cleared after every attempt and never stored.
 */
export default function ApprovalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const refreshAccount = useRefreshAccount()
  const { refreshCustomer } = useSession()
  const [pin, setPin] = useState('')
  const [confirmReject, setConfirmReject] = useState(false)

  const request = useQuery({
    queryKey: keys.approval(id),
    queryFn: async () => ({ request: (await customerApi.fetchAuthorization(id)).data, received: Date.now() }),
    // Status can change on the teller's side (cancel, complete) or by time.
    refetchInterval: (query) => {
      const status = query.state.data?.request.status
      return status === 'pending' || status === 'approved' ? 3_000 : false
    },
    staleTime: 0,
  })

  function settled(result: WithdrawalAuthorization) {
    queryClient.setQueryData(keys.approval(id), { request: result, received: Date.now() })
    void refreshAccount()
  }

  const approve = useMutation<WithdrawalAuthorization, ApiError, string>({
    mutationFn: async (value) => (await customerApi.approveAuthorization(id, value)).data,
    onSuccess: settled,
    onError: (error) => {
      // No longer pending (expired, cancelled): show the current state.
      if (error.requestStatus) void request.refetch()
      // The PIN was reset by an administrator: the session moves to PIN creation.
      if (error.code === 'pin_not_set') void refreshCustomer().catch(() => undefined)
    },
    onSettled: () => setPin(''),
  })

  const reject = useMutation<WithdrawalAuthorization, ApiError>({
    mutationFn: async () => (await customerApi.rejectAuthorization(id)).data,
    onSuccess: settled,
    onError: () => void request.refetch(),
  })

  const data = request.data
  const current = data?.request

  // The teller completes or cancels on their side: refresh balance and statement once it ends.
  const status = current?.status
  useEffect(() => {
    if (status && status !== 'pending' && status !== 'approved') void refreshAccount()
  }, [status, refreshAccount])
  const deadline = current?.status === 'approved' ? current.approval_expires_at : (current?.expires_at ?? null)
  const left = useCountdown(deadline, current?.server_time ?? null, data?.received ?? null)

  if (request.isPending) return <Loading />
  if (request.error || !current) {
    return (
      <Screen edges={['bottom']}>
        <Notice>{request.error?.message ?? 'Permintaan tidak ditemukan.'}</Notice>
        <Button variant="secondary" onPress={() => router.back()}>
          Kembali
        </Button>
      </Screen>
    )
  }

  const timedOut = (current.status === 'pending' || current.status === 'approved') && left <= 0
  const ended = timedOut ? ENDED.expired : ENDED[current.status]
  const pinError = approve.error
  const locked = pinError?.pinFailure ? isInFuture(pinError.pinFailure.pin_locked_until) : false

  return (
    <Screen edges={['bottom']}>
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Tarik tunai</Text>
        <Text style={styles.amount}>{formatRupiah(current.amount)}</Text>
        <Text style={styles.words}>{current.amount_in_words}</Text>
      </View>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Row label="Teller">{current.teller.full_name}</Row>
        <Row label="Rekening" monoValue>
          {current.account_number}
        </Row>
        <Row label="Saldo sekarang">{formatRupiah(current.balance)}</Row>
        {current.balance_after !== null && <Row label="Saldo sesudah">{formatRupiah(current.balance_after)}</Row>}
        <Row label="Diminta">{formatDateTime(current.created_at)}</Row>
      </Card>

      {ended ? (
        <>
          <Notice tone={current.status === 'consumed' ? 'success' : 'info'} title={ended.title}>
            {ended.body}
          </Notice>
          <Button variant="secondary" onPress={() => router.back()}>
            Kembali
          </Button>
        </>
      ) : current.status === 'approved' ? (
        <>
          <Notice tone="success" title="Disetujui">
            Tunjukkan layar ini ke teller. Teller menyelesaikan penarikan dan menyerahkan uangnya.
          </Notice>
          <Muted style={{ textAlign: 'center' }}>Teller perlu menyelesaikan dalam {formatCountdown(left)}</Muted>
        </>
      ) : (
        <>
          <View style={styles.countdown} accessibilityLiveRegion="polite">
            <Text style={styles.countdownText}>Sisa waktu {formatCountdown(left)}</Text>
          </View>
          <Body style={{ textAlign: 'center' }}>Periksa nominal dan nama teller. Setujui dengan PIN Anda.</Body>
          {pinError &&
            (locked && pinError.pinFailure?.pin_locked_until ? (
              <Notice title={`PIN diblokir sampai ${formatDateTime(pinError.pinFailure.pin_locked_until)}`}>
                Salah PIN 3 kali. Penarikan tidak dapat disetujui sampai waktu tersebut.
              </Notice>
            ) : (
              <Notice>{pinError.message}</Notice>
            ))}
          {reject.error && <Notice>{reject.error.message}</Notice>}
          <PinPad
            label="PIN persetujuan"
            value={pin}
            onChange={setPin}
            onComplete={(value) => approve.mutate(value)}
            disabled={approve.isPending || reject.isPending || locked}
          />
          {confirmReject ? (
            <View style={{ gap: 8 }}>
              <Body style={{ textAlign: 'center' }}>Tolak penarikan ini? Teller harus mengirim ulang bila keliru.</Body>
              <Button variant="danger" loading={reject.isPending} onPress={() => reject.mutate()}>
                Ya, tolak
              </Button>
              <Button variant="ghost" disabled={reject.isPending} onPress={() => setConfirmReject(false)}>
                Batal
              </Button>
            </View>
          ) : (
            <Button variant="danger" disabled={approve.isPending} onPress={() => setConfirmReject(true)}>
              Tolak
            </Button>
          )}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  amountBox: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  amountLabel: { fontSize: 13, fontWeight: '600', color: colors.ink500 },
  amount: { fontSize: 36, fontWeight: '700', color: colors.ink900, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  words: { fontSize: 14, color: colors.ink500, textAlign: 'center' },
  countdown: { alignSelf: 'center', backgroundColor: colors.warn50, borderColor: colors.warn200, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  countdownText: { color: colors.warn800, fontWeight: '700', fontVariant: ['tabular-nums'] },
})
