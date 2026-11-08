// Public web config of the Firebase project `bank-mini-rumput`
// (bank-mini-laravel/docs/firebase-web-config.md). Not a secret: the backend
// verifies every ID token. The service account key never goes in the app.
export const firebaseConfig = {
  apiKey: 'AIzaSyDF6DTMnhUQ52aicODJ6c2zNDdOseH_498',
  authDomain: 'bank-mini-rumput.firebaseapp.com',
  // A `demo-` project ID when testing against the Auth emulator (below).
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'bank-mini-rumput',
  storageBucket: 'bank-mini-rumput.firebasestorage.app',
  messagingSenderId: '418347097835',
  appId: '1:418347097835:web:1cd0c891b5d6ca53dfe8ae',
}

/**
 * The OAuth "web client" Firebase created for Google sign-in (client_type 3 in
 * google-services.json). Native Google Sign-In asks Google for an ID token for this
 * client, which Firebase accepts in GoogleAuthProvider.credential(). Public, not a secret.
 */
export const googleWebClientId =
  process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID || '418347097835-04u09164m68atrthg908gl5slg2ppfvs.apps.googleusercontent.com'

/**
 * Local testing only: the Firebase Auth emulator (bank-mini-laravel
 * docs/CUSTOMER_AUTH.md §9), e.g. `http://127.0.0.1:9099`. Never set in a build.
 */
export const authEmulatorUrl = process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR || null
