import { useState } from 'react'
import { RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Brand } from '@/components/Brand'
import { PinResetBanner } from '@/components/PinResetBanner'
import { TransactionRow } from '@/components/TransactionRow'
import { Body, Button, Card, Eyebrow, LinkButton, Loading, Muted, Notice, Screen } from '@/components/ui'
import { useBalance, useOpenApprovals, useRecentTransactions, useRefreshAccount } from '@/features/queries'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { useSession } from '@/session/SessionProvider'
import { colors } from '@/theme'

/** Balance, a waiting withdrawal request, and the latest five lines (§15.9). */
export default function HomeScreen() {
  const { customer } = useSession()
  const balance = useBalance()
  const recent = useRecentTransactions()
  const approvals = useOpenApprovals()
  const refreshAccount = useRefreshAccount()
  const [refreshing, setRefreshing] = useState(false)

  async function refresh() {
    setRefreshing(true)
    await refreshAccount().finally(() => setRefreshing(false))
  }

  const approved = approvals.data?.requests.filter((r) => r.status === 'approved') ?? []

  return (
    <Screen edges={[]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}>
      <Brand />
      <Body>Halo, {customer?.full_name ?? ''}</Body>
      <PinResetBanner />

      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>Saldo tabungan</Text>
        {balance.data ? (
          <>
            <Text style={styles.balanceValue} accessibilityLabel={`Saldo ${formatRupiah(balance.data.balance)}`}>
              {formatRupiah(balance.data.balance)}
            </Text>
            <Text style={styles.balanceMeta}>
              {balance.data.account_number} · saldo minimum {formatRupiah(balance.data.min_balance)}
            </Text>
            <Text style={styles.balanceMeta}>Per {formatDateTime(balance.data.as_of)}</Text>
          </>
        ) : balance.error ? (
          <Text style={styles.balanceMeta}>{balance.error.message}</Text>
        ) : (
          <Text style={styles.balanceValue}>…</Text>
        )}
      </View>

      {balance.data?.account_status === 'suspended' && (
        <Notice tone="warning" title="Rekening ditangguhkan">
          Saldo tetap bisa dilihat, tetapi setor dan tarik di loket tidak dapat dilakukan. Hubungi petugas bank mini.
        </Notice>
      )}

      {approved.map((r) => (
        <Notice key={r.id} tone="success" title={`Tarik tunai ${formatRupiah(r.amount)} sudah disetujui`}>
          Tunjukkan ke {r.teller.full_name} di loket; teller akan menyelesaikan dan menyerahkan uangnya.
        </Notice>
      ))}

      <Card style={{ gap: 0, paddingVertical: 8 }}>
        <View style={styles.sectionHead}>
          <Eyebrow>Transaksi terakhir</Eyebrow>
          <LinkButton onPress={() => router.push('/history')}>Lihat semua</LinkButton>
        </View>
        {recent.isPending ? (
          <Loading />
        ) : recent.error ? (
          <View style={{ gap: 8, paddingVertical: 8 }}>
            <Notice>{recent.error.message}</Notice>
            <Button variant="secondary" onPress={() => void recent.refetch()}>
              Coba lagi
            </Button>
          </View>
        ) : recent.data.length === 0 ? (
          <Muted style={{ paddingVertical: 12 }}>Belum ada transaksi. Setoran pertama dilakukan di loket bank mini.</Muted>
        ) : (
          recent.data.map((line) => <TransactionRow key={line.id} line={line} />)
        )}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  balance: { backgroundColor: colors.brand800, borderRadius: 16, padding: 20, gap: 4 },
  balanceLabel: { color: colors.brand100, fontSize: 13, fontWeight: '600' },
  balanceValue: { color: colors.white, fontSize: 32, fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  balanceMeta: { color: colors.brand100, fontSize: 13 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})
