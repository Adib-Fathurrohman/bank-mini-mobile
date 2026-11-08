/** The student closed the Google account picker: not an error to show. */
export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Masuk dengan Google dibatalkan.')
  }
}

/** Google Sign-In itself failed (no Play services, misconfiguration, network); the message is shown as is. */
export class GoogleSignInFailed extends Error {}
