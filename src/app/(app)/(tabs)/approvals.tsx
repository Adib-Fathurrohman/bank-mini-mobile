import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Icon } from '@/components/Icon'
import { Body, Button, Card, Loading, Muted, Notice, Screen, Title } from '@/components/ui'
import { useApprovalsScreen } from '@/features/queries'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { pushSupported } from '@/push/messaging'
import { colors } from '@/theme'

/**
 * Withdrawals a teller started for this account that are still open. New ones
 * arrive by push; while this screen is open it also checks every few seconds,
 * in case a push was missed.
 */
export default function ApprovalsScreen() {
  const approvals = useApprovalsScreen()
  const requests = approvals.data?.requests ?? []

  return (
    <Screen
      edges={[]}
      refreshControl={<RefreshControl refreshing={approvals.isRefetching} onRefresh={() => void approvals.refetch()} />}
    >
      <Title>Persetujuan</Title>
      <Body>
        Teller mengirim permintaan ke sini saat Anda menarik tunai di loket. Periksa nominalnya, lalu setujui dengan PIN atau
        tolak.
      </Body>

      {approvals.isPending ? (
        <Loading />
      ) : approvals.error ? (
        <>
          <Notice>{approvals.error.message}</Notice>
          <Button variant="secondary" onPress={() => void approvals.refetch()}>
            Coba lagi
          </Button>
        </>
      ) : requests.length === 0 ? (
        <Card>
          <Muted>
            Tidak ada permintaan yang menunggu.{' '}
            {pushSupported ? 'Permintaan baru muncul sebagai notifikasi.' : 'Halaman ini memeriksa permintaan baru secara otomatis.'}
          </Muted>
        </Card>
      ) : (
        requests.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            accessibilityLabel={`Tarik tunai ${formatRupiah(r.amount)} dari ${r.teller.full_name}. Buka.`}
            onPress={() => router.push(`/approval/${r.id}`)}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.ink50 }]}
          >
            <View style={styles.icon}>
              <Icon name="phone" color={colors.brand700} size={20} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.amount}>Tarik tunai {formatRupiah(r.amount)}</Text>
              <Text style={styles.meta}>
                {r.teller.full_name} · {formatDateTime(r.created_at)}
              </Text>
              <Text style={[styles.status, r.status === 'approved' && { color: colors.pos700 }]}>
                {r.status === 'approved' ? 'Disetujui, tunggu teller menyelesaikan' : r.status_label}
              </Text>
            </View>
            <Icon name="chevron" color={colors.ink400} size={18} />
          </Pressable>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: 14,
    padding: 14,
  },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
  amount: { fontSize: 16, fontWeight: '700', color: colors.ink900 },
  meta: { fontSize: 13, color: colors.ink500 },
  status: { fontSize: 13, fontWeight: '600', color: colors.warn800 },
})
