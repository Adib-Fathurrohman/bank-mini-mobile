import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme'

/** The "BM" mark and name, as on the staff web app. */
export function Brand() {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Text style={styles.markText}>BM</Text>
      </View>
      <View>
        <Text style={styles.name}>Bank Mini</Text>
        <Text style={styles.sub}>Tabungan siswa</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.brand700, alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink900 },
  sub: { fontSize: 12, color: colors.ink500 },
})
