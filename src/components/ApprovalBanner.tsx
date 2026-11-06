import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useOpenApprovals } from '@/features/queries'
import { formatRupiah } from '@/lib/format'
import { colors, MAX_WIDTH } from '@/theme'
import { Icon } from './Icon'

/**
 * Shown above every tab while a teller's withdrawal waits for this customer,
 * so it is seen whichever screen is open. Tapping opens the approval.
 */
export function ApprovalBanner() {
  const pathname = usePathname()
  const approvals = useOpenApprovals()
  const pending = approvals.data?.requests.find((r) => r.status === 'pending')
  if (!pending || pathname.startsWith('/approval')) return null // also covers the /approvals tab

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Permintaan tarik tunai ${formatRupiah(pending.amount)} menunggu persetujuan. Buka.`}
        onPress={() => router.push(`/approval/${pending.id}`)}
        style={({ pressed }) => [styles.banner, pressed && { backgroundColor: colors.brand800 }]}
      >
        <Icon name="phone" color={colors.white} size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Permintaan tarik tunai {formatRupiah(pending.amount)}</Text>
          <Text style={styles.sub}>dari {pending.teller.full_name} · ketuk untuk menyetujui</Text>
        </View>
        <Icon name="chevron" color={colors.white} size={18} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.canvas, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  banner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.brand700,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: { color: colors.white, fontSize: 15, fontWeight: '700' },
  sub: { color: colors.brand100, fontSize: 13 },
})
