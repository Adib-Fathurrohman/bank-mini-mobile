import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

/** Web: Google's popup. Native builds: see googleSignIn.native.ts. */
export const googleSignInAvailable = true

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  return result.user
}
