import { FirebaseError } from 'firebase/app'
import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type OAuthCredential,
  type User,
} from 'firebase/auth'
import * as customerApi from '@/api/customer'
import { isApiError } from '@/api/errors'
import type { CustomerSession } from '@/api/types'
import { auth } from '@/lib/firebase'
import { googleCredential, GoogleSignInCancelled, GoogleSignInFailed } from './googleSignIn'

export type SignInOutcome = 'signedIn' | 'activate' | 'verifyEmail'

/** Login refusals after which the Firebase sign-in is useless (§15.10). */
const SIGN_OUT_CODES = ['account_inactive', 'firebase_token_invalid', 'provider_not_allowed', 'activation_mismatch']

export type SignInMethod = 'google' | 'password'

/** How this Firebase account signs in. Google wins when both are linked. */
export function signInMethod(user: User | null): SignInMethod | null {
  if (!user) return null
  const ids = user.providerData.map((p) => p.providerId)
  if (ids.includes('google.com')) return 'google'
  if (ids.includes('password')) return 'password'
  return null
}

export function hasPassword(user: User | null): boolean {
  return user?.providerData.some((p) => p.providerId === 'password') ?? false
}

// A Google credential refused because the email already has a password account
// (auth/account-exists-with-different-credential). It is linked only after the
// student proves the existing account by signing in to it; never by matching emails.
let pendingGoogle: OAuthCredential | null = null

export class GoogleNeedsExistingSignIn extends Error {
  constructor() {
    super(
      'Email ini sudah punya akun dengan password. Masuk dulu dengan email dan password-nya; setelah itu akun Google Anda disambungkan dan bisa dipakai untuk masuk.',
    )
  }
}

export function hasPendingGoogleLink(): boolean {
  return pendingGoogle !== null
}

export function forgetPendingGoogleLink() {
  pendingGoogle = null
}

/** Google first: account picker → Firebase sign-in. */
export async function signInWithGoogle(): Promise<User> {
  const credential = await googleCredential()
  try {
    return (await signInWithCredential(auth, credential)).user
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/account-exists-with-different-credential') {
      pendingGoogle = credential
      throw new GoogleNeedsExistingSignIn()
    }
    throw error
  }
}

/** Email and password; links a pending Google credential to this (proven) account. */
export async function signInWithPassword(email: string, password: string): Promise<User> {
  const user = (await signInWithEmailAndPassword(auth, email, password)).user
  const credential = pendingGoogle
  if (credential) {
    pendingGoogle = null
    // A failed link must not block the sign-in itself; Google can be linked another time.
    await linkWithCredential(user, credential).catch(() => undefined)
  }
  return user
}

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
      // activation_mismatch: this Google/email account is not the one the school
      // registered. Sign out so the student can pick the registered one.
      if (error.code && SIGN_OUT_CODES.includes(error.code)) {
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

/**
 * A fresh sign-in proving it is still the student (forgotten-PIN request and
 * completion). Re-authenticates the current Firebase user, or signs in again if
 * the Firebase session is gone; the backend refuses another account
 * (identity_mismatch). Returns a fresh ID token.
 */
export async function confirmWithGoogle(): Promise<string> {
  const credential = await googleCredential()
  const user = auth.currentUser
  const result = user ? await reauthenticateWithCredential(user, credential) : await signInWithCredential(auth, credential)
  return result.user.getIdToken(true)
}

export async function confirmWithPassword(email: string, password: string): Promise<string> {
  const user = auth.currentUser
  const result = user
    ? await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? email, password))
    : await signInWithEmailAndPassword(auth, email, password)
  return result.user.getIdToken(true)
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
  if (error instanceof FirebaseSignInRequired || error instanceof GoogleNeedsExistingSignIn) return error.message
  if (error instanceof GoogleSignInCancelled || error instanceof GoogleSignInFailed) return error.message
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
    case 'auth/user-mismatch':
      return 'Akun yang dipilih bukan akun yang sedang masuk di aplikasi ini.'
    case 'auth/credential-already-in-use':
      return 'Akun Google ini sudah tersambung ke akun lain.'
    case 'auth/requires-recent-login':
      return 'Demi keamanan, masuk lagi lalu ulangi.'
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan. Hubungi petugas bank mini.'
    default:
      return 'Tidak dapat masuk saat ini. Coba lagi.'
  }
}
