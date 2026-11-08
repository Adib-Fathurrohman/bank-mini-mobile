import { useEffect, useState } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import { LogoMark } from './LogoMark'

/**
 * How long the animated splash stays at least, from its first render. The native
 * splash (same logo) covers it for about the first second, until expo-router hides
 * it, so the student sees roughly one full pulse of the logo.
 */
const MIN_VISIBLE_MS = 2600

/**
 * The animated splash (new logo/animation.ts). It takes over from the native
 * splash, which shows the same logo at the animation's first frame (white
 * background, 84 px), and pulses until the app has loaded the session; then it fades out.
 */
export function AnimatedSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  // Created once; useState keeps them across renders (React Compiler: no ref reads in render).
  const [scaleAnim] = useState(() => new Animated.Value(0.7))
  // Starts visible (the native splash shows the logo already); later pulses dip to 0.3.
  const [opacityAnim] = useState(() => new Animated.Value(1))
  const [fadeOut] = useState(() => new Animated.Value(1))
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
        Animated.delay(1400),
        Animated.timing(opacityAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
    )
    loop.start()
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS)
    return () => {
      loop.stop()
      clearTimeout(timer)
    }
  }, [scaleAnim, opacityAnim])

  useEffect(() => {
    if (!ready || !minElapsed) return
    Animated.timing(fadeOut, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => onDone())
  }, [ready, minElapsed, fadeOut, onDone])

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeOut }]}
      accessibilityLabel="Bank Mini sedang dibuka"
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim, alignItems: 'center' }}>
        <LogoMark size={120} />
        <Text style={styles.title}>
          BANK <Text style={styles.gold}>MINI</Text>
        </Text>
        <Text style={styles.subtitle}>SMKN 1 BANTUL</Text>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, elevation: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  title: { marginTop: 16, fontSize: 24, fontWeight: '800', color: '#1E3A8A', letterSpacing: 1 },
  gold: { color: '#F59E0B' },
  subtitle: { marginTop: 4, fontSize: 11, fontWeight: '700', color: '#1E3A8A', letterSpacing: 2.5 },
})
