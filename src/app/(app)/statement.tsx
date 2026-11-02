import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Body, Button, Notice, Screen } from '@/components/ui'
import { isApiError } from '@/api/errors'
import { downloadPdf } from '@/lib/download'
import { formatYmd, jakartaToday, monthRange } from '@/lib/format'
import { colors } from '@/theme'

type Preset = 'thisMonth' | 'lastMonth' | 'threeMonths'

function rangeFor(preset: Preset, today: string): { from: string; to: string } {
  if (preset === 'thisMonth') return monthRange(today, 0)
  if (preset === 'lastMonth') return monthRange(today, -1)
  return { from: monthRange(today, -2).from, to: today }
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'thisMonth', label: 'Bulan ini' },
  { value: 'lastMonth', label: 'Bulan lalu' },
  { value: 'threeMonths', label: '3 bulan terakhir' },
]

/** Own statement as PDF (`GET /customer/statement/export?from=&to=`). */
export default function StatementScreen() {
  const [preset, setPreset] = useState<Preset>('thisMonth')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const range = rangeFor(preset, jakartaToday())

  async function download() {
    setPending(true)
    setError(null)
    setDone(false)
    try {
      await downloadPdf('/customer/statement/export', range, `mutasi-${range.from}-${range.to}.pdf`)
      setDone(true)
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Mutasi tidak dapat diunduh. Coba lagi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Body>Mutasi rekening dalam PDF: setiap setoran, penarikan dan koreksi beserta saldonya.</Body>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {PRESETS.map((p) => {
          const selected = p.value === preset
          const span = rangeFor(p.value, jakartaToday())
          return (
            <Pressable
              key={p.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                setPreset(p.value)
                setDone(false)
              }}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text style={[styles.optionText, selected && { color: colors.brand800 }]}>{p.label}</Text>
              <Text style={styles.optionMeta}>
                {formatYmd(span.from)} – {formatYmd(span.to)}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {error && <Notice>{error}</Notice>}
      {done && <Notice tone="success">Mutasi diunduh.</Notice>}
      <Button loading={pending} onPress={() => void download()}>
        Unduh PDF
      </Button>
    </Screen>
  )
}

const styles = StyleSheet.create({
  option: { borderWidth: 1, borderColor: colors.ink300, borderRadius: 10, padding: 14, backgroundColor: colors.white, gap: 2 },
  optionSelected: { borderColor: colors.brand700, backgroundColor: colors.brand50 },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.ink900 },
  optionMeta: { fontSize: 13, color: colors.ink500 },
})
