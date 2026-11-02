import { StyleSheet, Text, View } from 'react-native'
import { QrCode } from '@/components/QrCode'
import { Body, Button, Loading, Notice, Screen, Title } from '@/components/ui'
import { useCard } from '@/features/queries'
import { colors, mono } from '@/theme'

/** The digital card: the teller scans this QR at the counter instead of the printed card. */
export default function CardScreen() {
  const card = useCard()

  return (
    <Screen edges={[]}>
      <Title>Kartu digital</Title>
      <Body>Tunjukkan kode QR ini ke teller saat setor atau tarik tunai.</Body>
      {card.isPending ? (
        <Loading />
      ) : card.error ? (
        <>
          <Notice>{card.error.message}</Notice>
          <Button variant="secondary" onPress={() => void card.refetch()}>
            Coba lagi
          </Button>
        </>
      ) : (
        <View style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.bank}>BANK MINI</Text>
            <Text style={styles.headMeta}>Tabungan siswa</Text>
          </View>
          <View style={styles.qr}>
            <QrCode value={card.data.qr_payload} size={220} />
          </View>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={styles.name}>{card.data.full_name}</Text>
            <Text style={styles.number}>{card.data.account_number}</Text>
            <Text style={styles.meta}>
              NIS {card.data.nis} · {card.data.class} {card.data.major.code} {card.data.group}
            </Text>
            <Text style={styles.meta}>{card.data.major.major_name}</Text>
          </View>
        </View>
      )}
      {card.data?.account_status === 'suspended' && (
        <Notice tone="warning">Rekening ditangguhkan: teller tidak dapat memproses transaksi.</Notice>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.ink200, overflow: 'hidden', paddingBottom: 20, gap: 16 },
  head: { backgroundColor: colors.brand800, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bank: { color: colors.white, fontWeight: '800', letterSpacing: 1.5, fontSize: 14 },
  headMeta: { color: colors.brand100, fontSize: 12 },
  qr: { alignItems: 'center', paddingTop: 4 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink900 },
  number: { fontSize: 16, fontFamily: mono, color: colors.ink900, letterSpacing: 0.5 },
  meta: { fontSize: 13, color: colors.ink500 },
})
