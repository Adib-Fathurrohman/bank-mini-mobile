import { GoogleAuthProvider, signInWithPopup, type OAuthCredential } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { GoogleSignInCancelled, GoogleSignInFailed } from './googleSignInErrors'

export { GoogleSignInCancelled, GoogleSignInFailed }

/** Web (local development only): Google's popup. Phones: see googleSignIn.native.ts. */
export const googleSignInAvailable = true

export async function googleCredential(): Promise<OAuthCredential> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  const credential = GoogleAuthProvider.credentialFromResult(result)
  if (!credential) throw new GoogleSignInFailed('Google tidak mengirim token masuk. Coba lagi.')
  return credential
}
