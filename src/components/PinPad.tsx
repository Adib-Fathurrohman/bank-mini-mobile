import { useEffect, useRef } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme'

export const PIN_LENGTH = 6

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

/**
 * Six masked dots and a numeric keypad. The PIN only lives in the caller's
 * state until it is sent; callers clear it after every attempt. On the web
 * the number keys and Backspace also work.
 */
export function PinPad({
  value,
  onChange,
  onComplete,
  disabled = false,
  label,
}: {
  value: string
  onChange: (next: string) => void
  /** Called once the sixth digit is entered. */
  onComplete?: (pin: string) => void
  disabled?: boolean
  label: string
}) {
  // Key handlers read the latest props (the web keyboard listener is attached once).
  const latest = useRef({ value, onChange, onComplete, disabled })
  useEffect(() => {
    latest.current = { value, onChange, onComplete, disabled }
  })

  function press(key: (typeof KEYS)[number]) {
    const { value: current, onChange: change, onComplete: complete, disabled: off } = latest.current
    if (off || key === '') return
    // Update the copy at once so fast key presses before the next render see it.
    if (key === 'del') {
      latest.current.value = current.slice(0, -1)
      return change(latest.current.value)
    }
    if (current.length >= PIN_LENGTH) return
    const next = current + key
    latest.current.value = next
    change(next)
    if (next.length === PIN_LENGTH) complete?.(next)
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (/^\d$/.test(event.key)) press(event.key as (typeof KEYS)[number])
      else if (event.key === 'Backspace') press('del')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <View style={styles.wrap}>
      <View
        style={styles.dots}
        accessible
        accessibilityLabel={`${label}: ${value.length} dari ${PIN_LENGTH} digit`}
        accessibilityLiveRegion="polite"
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((key, i) =>
          key === '' ? (
            <View key={i} style={styles.key} />
          ) : (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={key === 'del' ? 'Hapus' : key}
              disabled={disabled}
              onPress={() => press(key)}
              style={({ pressed }) => [styles.key, styles.keyButton, pressed && styles.keyPressed, disabled && { opacity: 0.4 }]}
            >
              <Text style={key === 'del' ? styles.delText : styles.keyText}>{key === 'del' ? 'Hapus' : key}</Text>
            </Pressable>
          ),
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  area: { flex: 1, justifyContent: 'center', gap: 16, paddingBottom: 24 },
  wrap: { alignItems: 'center', gap: 24 },
  dots: { flexDirection: 'row', gap: 14, paddingVertical: 4 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.ink400 },
  dotFilled: { backgroundColor: colors.brand700, borderColor: colors.brand700 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 3 * 84 + 2 * 12, gap: 12 },
  key: { width: 84, height: 60 },
  keyButton: {
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: colors.ink100 },
  keyText: { fontSize: 24, fontWeight: '500', color: colors.ink900 },
  delText: { fontSize: 14, fontWeight: '600', color: colors.ink600 },
})

/**
 * The pad and the links under it, centred in the space left below the title,
 * where a thumb reaches it (inside a `<Screen fill>`).
 */
export function PinPadArea({ children }: { children: React.ReactNode }) {
  return <View style={styles.area}>{children}</View>
}
