import AsyncStorage from '@react-native-async-storage/async-storage'

// The "Notifikasi" switch on the account screen. On by default; off means this
// phone's token is removed on the server and not registered again.
const KEY = 'bank-mini.push.enabled'

export async function isPushEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) !== 'false'
  } catch {
    return true
  }
}

export async function setPushEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, enabled ? 'true' : 'false')
  } catch {
    // Not stored: the default (on) applies next time.
  }
}
