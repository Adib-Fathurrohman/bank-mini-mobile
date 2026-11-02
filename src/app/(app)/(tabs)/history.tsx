import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { TransactionType } from '@/api/types'
import { TransactionRow } from '@/components/TransactionRow'
import { Button, Loading, Muted, Notice, Title } from '@/components/ui'
import { useHistory } from '@/features/queries'
import { colors, MAX_WIDTH } from '@/theme'

const FILTERS: { value: TransactionType | null; label: string }[] = [
  { value: null, label: 'Semua' },
  { value: 'deposit', label: 'Setor' },
  { value: 'withdrawal', label: 'Tarik' },
]

/** The whole statement, newest first, loading more while scrolling. */
export default function HistoryScreen() {
  const [type, setType] = useState<TransactionType | null>(null)
  const history = useHistory(type)
  const lines = history.data?.pages.flatMap((p) => p.data) ?? []

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      data={lines}
      keyExtractor={(line) => String(line.id)}
      renderItem={({ item }) => <TransactionRow line={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (history.hasNextPage && !history.isFetchingNextPage) void history.fetchNextPage()
      }}
      refreshing={history.isRefetching && !history.isFetchingNextPage}
      onRefresh={() => void history.refetch()}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 8 }}>
          <Title>Riwayat</Title>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {FILTERS.map((f) => {
              const selected = f.value === type
              return (
                <Pressable
                  key={f.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setType(f.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && { color: colors.white }]}>{f.label}</Text>
                </Pressable>
              )
            })}
          </View>
          <Muted>Termasuk koreksi oleh petugas. Ketuk untuk detail.</Muted>
        </View>
      }
      ListEmptyComponent={
        history.isPending ? (
          <Loading />
        ) : history.error ? (
          <View style={{ gap: 8 }}>
            <Notice>{history.error.message}</Notice>
            <Button variant="secondary" onPress={() => void history.refetch()}>
              Coba lagi
            </Button>
          </View>
        ) : (
          <Muted style={{ paddingVertical: 16 }}>Belum ada transaksi{type ? ' jenis ini' : ''}.</Muted>
        )
      }
      ListFooterComponent={history.isFetchingNextPage ? <ActivityIndicator style={{ margin: 16 }} color={colors.brand700} /> : undefined}
    />
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.ink200 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.ink300, backgroundColor: colors.white },
  chipSelected: { backgroundColor: colors.brand700, borderColor: colors.brand700 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.ink700 },
})
