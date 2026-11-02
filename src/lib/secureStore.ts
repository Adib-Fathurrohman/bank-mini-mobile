import * as SecureStore from 'expo-secure-store'

// The backend session token lives in the device keychain / keystore.
// The web build uses secureStore.web.ts.

export function readItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key)
}

export function writeItem(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value)
}

export function removeItem(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key)
}
