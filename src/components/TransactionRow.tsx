import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import type { StatementLine } from '@/api/types'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { colors } from '@/theme'
import { Icon } from './Icon'

/** One statement line: direction, description, time, signed amount and balance after. */
export function TransactionRow({ line }: { line: StatementLine }) {
  const incoming = line.direction === 'in'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${line.description}, ${incoming ? 'masuk' : 'keluar'} ${formatRupiah(line.amount)}`}
      onPress={() => router.push(`/transaction/${line.id}`)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.ink50 }]}
    >
      <View style={[styles.icon, { backgroundColor: incoming ? colors.pos50 : colors.neg50 }]}>
        <Icon name={incoming ? 'arrowIn' : 'arrowOut'} size={18} color={incoming ? colors.pos700 : colors.neg700} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title} numberOfLines={1}>
          {line.description}
        </Text>
        <Text style={styles.meta}>{formatDateTime(line.created_at)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={[styles.amount, { color: incoming ? colors.pos700 : colors.ink900 }]}>
          {incoming ? '+' : '−'}
          {formatRupiah(line.amount)}
        </Text>
        <Text style={styles.meta}>Saldo {formatRupiah(line.balance_after)}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: colors.ink900 },
  meta: { fontSize: 12, color: colors.ink500 },
  amount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
})
