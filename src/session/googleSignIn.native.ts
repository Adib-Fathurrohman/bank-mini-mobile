import type { User } from 'firebase/auth'

// Native Google Sign-In needs a native module (@react-native-google-signin) and a
// development build with the Android/iOS apps registered in Firebase
// (firebase-web-config.md "Google Sign-In"). Until then, phones use email and
// password; the web version offers Google.
export const googleSignInAvailable = false

export async function signInWithGoogle(): Promise<User> {
  throw new Error('Masuk dengan Google belum tersedia di aplikasi ini. Gunakan email dan password.')
}
