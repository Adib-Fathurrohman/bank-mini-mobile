import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type RefreshControlProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, MAX_WIDTH, mono, radius } from '@/theme'

/** A page: safe area, canvas background, scrolls, phone width on the web. */
export function Screen({
  children,
  refreshControl,
  edges = ['top', 'bottom'],
  scroll = true,
}: {
  children: ReactNode
  refreshControl?: React.ReactElement<RefreshControlProps>
  edges?: ('top' | 'bottom')[]
  scroll?: boolean
}) {
  const content = <View style={styles.column}>{children}</View>
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, { flex: 1 }]}>{content}</View>
      )}
    </SafeAreaView>
  )
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text accessibilityRole="header" style={[styles.title, style]}>
      {children}
    </Text>
  )
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>
}

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  children: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const inactive = disabled || loading
  const palette = BUTTON[variant]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && { backgroundColor: palette.pressed },
        inactive && styles.buttonInactive,
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={palette.text} />}
      <Text style={[styles.buttonText, { color: palette.text }]}>{children}</Text>
    </Pressable>
  )
}

const BUTTON: Record<ButtonVariant, { bg: string; border: string; text: string; pressed: string }> = {
  primary: { bg: colors.brand700, border: colors.brand700, text: colors.white, pressed: colors.brand800 },
  secondary: { bg: colors.white, border: colors.ink300, text: colors.ink900, pressed: colors.ink100 },
  danger: { bg: colors.white, border: colors.neg200, text: colors.neg700, pressed: colors.neg50 },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.brand700, pressed: colors.brand50 },
}

export function TextField({
  label,
  error,
  hint,
  style,
  ...input
}: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  return (
    <View style={[{ gap: 6 }, style as StyleProp<ViewStyle>]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.ink400}
        style={[styles.input, error ? { borderColor: colors.neg600 } : null, input.editable === false && styles.inputReadOnly]}
        {...input}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

type Tone = 'info' | 'success' | 'warning' | 'danger'

const TONE: Record<Tone, { bg: string; border: string; text: string }> = {
  info: { bg: colors.brand50, border: colors.brand100, text: colors.brand900 },
  success: { bg: colors.pos50, border: colors.pos200, text: colors.pos700 },
  warning: { bg: colors.warn50, border: colors.warn200, text: colors.warn800 },
  danger: { bg: colors.neg50, border: colors.neg200, text: colors.neg700 },
}

export function Notice({ tone = 'danger', title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  const palette = TONE[tone]
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      style={[styles.notice, { backgroundColor: palette.bg, borderColor: palette.border }]}
    >
      {title ? <Text style={[styles.noticeTitle, { color: palette.text }]}>{title}</Text> : null}
      {children ? <Text style={[styles.noticeBody, { color: palette.text }]}>{children}</Text> : null}
    </View>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

/** Label-value rows separated by hairlines. */
export function Row({ label, children, monoValue = false }: { label: string; children: ReactNode; monoValue?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, monoValue && { fontFamily: mono }]}>{children}</Text>
    </View>
  )
}

export function LinkButton({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 6 }}>
      <Text style={styles.link}>{children}</Text>
    </Pressable>
  )
}

export function Loading({ label = 'Memuat…' }: { label?: string }) {
  return (
    <View style={styles.loading} accessibilityLabel={label}>
      <ActivityIndicator color={colors.brand700} />
      <Muted>{label}</Muted>
    </View>
  )
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 },
  column: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink900, letterSpacing: -0.3 },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink700 },
  muted: { fontSize: 13, lineHeight: 19, color: colors.ink500 },
  eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.ink500 },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonInactive: { opacity: 0.5 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink700 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.ink300,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink900,
    backgroundColor: colors.white,
  },
  inputReadOnly: { backgroundColor: colors.ink100, color: colors.ink600 },
  fieldError: { fontSize: 13, color: colors.neg700 },
  hint: { fontSize: 13, color: colors.ink500 },
  notice: { borderWidth: 1, borderRadius: radius.md, padding: 12, gap: 4 },
  noticeTitle: { fontSize: 14, fontWeight: '700' },
  noticeBody: { fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.ink200, padding: 16, gap: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ink200,
  },
  rowLabel: { fontSize: 14, color: colors.ink500 },
  rowValue: { fontSize: 14, color: colors.ink900, flexShrink: 1, textAlign: 'right' },
  link: { fontSize: 14, fontWeight: '600', color: colors.brand700 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
})
