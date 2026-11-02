import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { Button, Card, Eyebrow, Row, Screen, Title } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { useSession } from '@/session/SessionProvider'

/** The account (`GET /customer/me`) and the security actions. */
export default function ProfileScreen() {
  const { customer, firebaseUser, lock, signOut } = useSession()
  const [leaving, setLeaving] = useState<'here' | 'all' | null>(null)
  const hasPassword = firebaseUser?.providerData.some((p) => p.providerId === 'password') ?? false

  async function leave(allDevices: boolean) {
    setLeaving(allDevices ? 'all' : 'here')
    await signOut({ allDevices })
  }

  return (
    <Screen edges={[]}>
      <Title>Akun</Title>
      {customer && (
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          <Row label="Nama">{customer.full_name}</Row>
          <Row label="No. rekening" monoValue>
            {customer.account_number}
          </Row>
          <Row label="NIS" monoValue>
            {customer.nis}
          </Row>
          <Row label="Kelas">
            {customer.class} {customer.major.code} {customer.group}
          </Row>
          <Row label="Jurusan">{customer.major.major_name}</Row>
          <Row label="Masuk dengan">{firebaseUser?.email ?? customer.email ?? '-'}</Row>
          {customer.activated_at && <Row label="Diaktifkan">{formatDateTime(customer.activated_at)}</Row>}
        </Card>
      )}

      <View style={{ gap: 10 }}>
        <Eyebrow>Keamanan</Eyebrow>
        <Button variant="secondary" onPress={() => router.push('/change-pin')}>
          Ubah PIN
        </Button>
        {hasPassword && (
          <Button variant="secondary" onPress={() => router.push('/change-password')}>
            Ubah password
          </Button>
        )}
        <Button variant="secondary" onPress={() => router.push('/statement')}>
          Unduh mutasi (PDF)
        </Button>
        <Button variant="secondary" onPress={lock}>
          Kunci aplikasi
        </Button>
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow>Keluar</Eyebrow>
        <Button variant="danger" loading={leaving === 'here'} disabled={leaving !== null} onPress={() => void leave(false)}>
          Keluar dari perangkat ini
        </Button>
        <Button variant="ghost" loading={leaving === 'all'} disabled={leaving !== null} onPress={() => void leave(true)}>
          Keluar dari semua perangkat
        </Button>
      </View>
    </Screen>
  )
}
