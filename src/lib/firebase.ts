import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { authEmulatorUrl, firebaseConfig } from './firebaseConfig'

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

/** Web: the default browser persistence (IndexedDB). Native: see firebase.native.ts. */
export const auth: Auth = getAuth(firebaseApp)
auth.languageCode = 'id'
if (authEmulatorUrl) connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true })
