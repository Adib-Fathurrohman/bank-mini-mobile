import { Tabs } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ApprovalBanner } from '@/components/ApprovalBanner'
import { Icon } from '@/components/Icon'
import { colors } from '@/theme'

export default function TabsLayout() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ApprovalBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand700,
          tabBarInactiveTintColor: colors.ink500,
          tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.ink200 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          sceneStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Beranda', tabBarIcon: ({ color }) => <Icon name="home" color={color} /> }} />
        <Tabs.Screen name="history" options={{ title: 'Riwayat', tabBarIcon: ({ color }) => <Icon name="list" color={color} /> }} />
        <Tabs.Screen name="card" options={{ title: 'Kartu', tabBarIcon: ({ color }) => <Icon name="card" color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Akun', tabBarIcon: ({ color }) => <Icon name="user" color={color} /> }} />
      </Tabs>
    </SafeAreaView>
  )
}
