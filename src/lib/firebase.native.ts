import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApp, getApps, initializeApp } from 'firebase/app'
// `firebase/auth` re-exports `@firebase/auth`, which Metro resolves to its React
// Native build on phones; only that build (and its types) has getReactNativePersistence.
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth, type Auth } from '@firebase/auth'
import { authEmulatorUrl, firebaseConfig } from './firebaseConfig'

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Keep the Firebase sign-in across app restarts: PIN creation needs a fresh ID
// token while the backend session lasts (FRONTEND_HANDOFF.md §15.10).
function createAuth(): Auth {
  try {
    return initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) })
  } catch {
    // Already initialized (fast refresh).
    return getAuth(firebaseApp)
  }
}

export const auth = createAuth()
auth.languageCode = 'id'
if (authEmulatorUrl) connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true })
