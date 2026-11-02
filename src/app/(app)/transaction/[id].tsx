import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Card, Loading, Notice, Row, Screen } from '@/components/ui'
import { useTransaction } from '@/features/queries'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { colors } from '@/theme'

/** One statement line (`GET /customer/transactions/{id}`). */
export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const line = useTransaction(Number(id))

  if (line.isPending) return <Loading />
  if (line.error) {
    return (
      <Screen edges={['bottom']}>
        <Notice>{line.error.message}</Notice>
      </Screen>
    )
  }

  const t = line.data
  const incoming = t.direction === 'in'
  return (
    <Screen edges={['bottom']}>
      <View style={styles.head}>
        <Text style={styles.label}>{t.description}</Text>
        <Text style={[styles.amount, { color: incoming ? colors.pos700 : colors.ink900 }]}>
          {incoming ? '+' : '−'}
          {formatRupiah(t.amount)}
        </Text>
      </View>
      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Row label="Waktu">{formatDateTime(t.created_at)}</Row>
        <Row label="Arah">{incoming ? 'Masuk ke rekening' : 'Keluar dari rekening'}</Row>
        <Row label="Saldo sesudah">{formatRupiah(t.balance_after)}</Row>
        <Row label="No. transaksi" monoValue>
          #{t.id}
        </Row>
      </Card>
      {(t.type === 'deposit_correction' || t.type === 'withdrawal_correction') && (
        <Notice tone="info">Koreksi oleh petugas atas transaksi yang keliru dicatat.</Notice>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: 4, paddingVertical: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink500 },
  amount: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
})
