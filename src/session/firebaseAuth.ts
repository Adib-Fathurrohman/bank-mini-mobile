import { FirebaseError } from 'firebase/app'
import { signOut, type User } from 'firebase/auth'
import * as customerApi from '@/api/customer'
import { isApiError } from '@/api/errors'
import type { CustomerSession } from '@/api/types'
import { auth } from '@/lib/firebase'

export type SignInOutcome = 'signedIn' | 'activate' | 'verifyEmail'

/** Email/password accounts must verify the address before the backend accepts them. */
export function needsVerification(user: User): boolean {
  return !user.emailVerified && user.providerData.some((p) => p.providerId === 'password')
}

/**
 * After a Firebase sign-in: get a backend session (§15.10 "Sign-in screen").
 * `activate` means the account is not linked yet (first sign-in): ask for the NIS.
 */
export async function exchangeForSession(
  user: User,
  startSession: (session: CustomerSession) => Promise<void>,
): Promise<SignInOutcome> {
  if (needsVerification(user)) return 'verifyEmail'
  // Force a refresh so the token carries the current email_verified claim.
  const idToken = await user.getIdToken(true)
  try {
    const result = await customerApi.login(idToken)
    await startSession(result.data)
    return 'signedIn'
  } catch (error) {
    if (isApiError(error)) {
      if (error.code === 'account_not_linked') return 'activate'
      if (error.code === 'email_not_verified') return 'verifyEmail'
      if (error.code === 'account_inactive' || error.code === 'firebase_token_invalid' || error.code === 'provider_not_allowed') {
        await signOut(auth).catch(() => undefined)
      }
    }
    throw error
  }
}

export class FirebaseSignInRequired extends Error {
  constructor() {
    super('Masuk lagi dengan akun Google atau email Anda untuk melanjutkan.')
  }
}

/** A fresh ID token of the signed-in Firebase user (PIN creation needs one). */
export async function freshIdToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new FirebaseSignInRequired()
  try {
    return await user.getIdToken(true)
  } catch {
    throw new FirebaseSignInRequired()
  }
}

/**
 * Indonesian text for Firebase Auth errors. With email enumeration
 * protection on, wrong email and wrong password are one message.
 */
export function firebaseMessage(error: unknown): string {
  if (isApiError(error)) return error.message
  if (error instanceof FirebaseSignInRequired) return error.message
  const code = error instanceof FirebaseError ? error.code : ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Email atau password salah.'
    case 'auth/invalid-email':
      return 'Format email tidak valid.'
    case 'auth/email-already-in-use':
      return 'Email ini sudah punya akun. Masuk dengan password-nya, atau dengan Google jika akun dibuat lewat Google.'
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Password terlalu lemah. Gunakan minimal 8 karakter dengan huruf dan angka.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.'
    case 'auth/network-request-failed':
      return 'Tidak dapat terhubung. Periksa koneksi internet lalu coba lagi.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Masuk dengan Google dibatalkan.'
    case 'auth/popup-blocked':
      return 'Jendela Google diblokir browser. Izinkan pop-up lalu coba lagi.'
    case 'auth/account-exists-with-different-credential':
      return 'Email ini terdaftar dengan cara masuk lain. Masuk dengan email dan password-nya.'
    case 'auth/requires-recent-login':
      return 'Demi keamanan, masuk lagi lalu ulangi.'
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan. Hubungi petugas bank mini.'
    default:
      return 'Tidak dapat masuk saat ini. Coba lagi.'
  }
}
