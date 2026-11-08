import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme'
import { LogoMark } from './LogoMark'

/** The Bank Mini logo and name. */
export function Brand() {
  return (
    <View style={styles.wrap}>
      <LogoMark size={48} />
      <View>
        <Text style={styles.name}>Bank Mini</Text>
        <Text style={styles.sub}>Tabungan siswa</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -4 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink900 },
  sub: { fontSize: 12, color: colors.ink500 },
})
