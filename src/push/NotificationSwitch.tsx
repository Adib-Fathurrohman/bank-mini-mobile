import { useEffect, useState } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'
import { Muted, Notice } from '@/components/ui'
import { colors } from '@/theme'
import { pushSupported } from './messaging'
import { isPushEnabled, setPushEnabled } from './preference'
import { registerThisDevice, unregisterThisDevice } from './register'

/**
 * "Notifikasi": on registers this phone's FCM token, off removes it on the
 * server (DELETE /customer/push-tokens). Hidden on the web, which has no push.
 */
export function NotificationSwitch() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    void isPushEnabled().then(setEnabled)
  }, [])

  if (!pushSupported || enabled === null) return null

  async function toggle(next: boolean) {
    setPending(true)
    setNotice(null)
    try {
      if (next) {
        await setPushEnabled(true)
        setEnabled(true)
        const result = await registerThisDevice()
        if (result.ok) setNotice({ tone: 'success', text: result.message })
        else if (result.reason === 'denied')
          setNotice({
            tone: 'warning',
            text: 'Izin notifikasi ditolak. Izinkan di pengaturan HP; permintaan tetap muncul di layar Persetujuan.',
          })
        else setNotice({ tone: 'danger', text: result.message ?? 'Notifikasi belum dapat diaktifkan. Coba lagi.' })
      } else {
        const message = await unregisterThisDevice()
        await setPushEnabled(false)
        setEnabled(false)
        if (message) setNotice({ tone: 'success', text: message })
      }
    } catch (error) {
      setNotice({ tone: 'danger', text: error instanceof Error ? error.message : 'Pengaturan tidak tersimpan. Coba lagi.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.label}>Notifikasi</Text>
          <Muted>Beri tahu saat teller meminta persetujuan penarikan.</Muted>
        </View>
        <Switch
          accessibilityLabel="Notifikasi permintaan penarikan"
          value={enabled}
          disabled={pending}
          onValueChange={(value) => void toggle(value)}
          trackColor={{ true: colors.brand600, false: colors.ink300 }}
        />
      </View>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink900 },
})
