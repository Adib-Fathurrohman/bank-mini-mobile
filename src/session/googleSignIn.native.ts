import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin'
import { GoogleAuthProvider, type OAuthCredential } from 'firebase/auth'
import { googleWebClientId } from '@/lib/firebaseConfig'
import { GoogleSignInCancelled, GoogleSignInFailed } from './googleSignInErrors'

export { GoogleSignInCancelled, GoogleSignInFailed }

// Native Google Sign-In (Android account picker) → Google ID token for the
// Firebase web client → Firebase credential. Google accounts arrive verified,
// so there is no email verification step. Release APKs need the signing key's
// SHA-1/SHA-256 registered in Firebase, or Google answers DEVELOPER_ERROR (10).

export const googleSignInAvailable = true

GoogleSignin.configure({ webClientId: googleWebClientId })

/** Opens the account picker and returns a Firebase credential for the chosen Google account. */
export async function googleCredential(): Promise<OAuthCredential> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
    // Forget the last choice so the picker always shows: a shared phone must not
    // continue silently with someone else's Google account.
    await GoogleSignin.signOut().catch(() => undefined)
    const response = await GoogleSignin.signIn()
    if (response.type !== 'success') throw new GoogleSignInCancelled()
    const idToken = response.data.idToken
    if (!idToken) throw new GoogleSignInFailed('Google tidak mengirim token masuk. Coba lagi.')
    return GoogleAuthProvider.credential(idToken)
  } catch (error) {
    if (error instanceof GoogleSignInCancelled || error instanceof GoogleSignInFailed) throw error
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          throw new GoogleSignInCancelled()
        case statusCodes.IN_PROGRESS:
          throw new GoogleSignInFailed('Masuk dengan Google sedang berjalan.')
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new GoogleSignInFailed('Google Play Services tidak tersedia atau perlu diperbarui di ponsel ini.')
        case '10':
        case 'DEVELOPER_ERROR':
          throw new GoogleSignInFailed('Masuk dengan Google belum dikonfigurasi untuk aplikasi ini (kode 10). Hubungi petugas bank mini.')
      }
    }
    throw new GoogleSignInFailed('Tidak dapat masuk dengan Google. Periksa koneksi lalu coba lagi.')
  }
}
