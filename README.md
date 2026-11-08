# Bank Mini: customer app

The students' app (Expo, React Native and web). Students sign in with the email the
school registered, activate their account with their NIS, create their own PIN, see
their balance, history and digital card, and approve or reject withdrawals the teller
starts at the counter. The staff web app is the `bank-mini-web` repository; the API is
`bank-mini-laravel` (contract: its `docs/FRONTEND_HANDOFF.md` §15.9–15.11 and
`docs/API.md`).

## Screens

| Stage | Screens |
| --- | --- |
| Signed out | Sign in: **"Lanjutkan dengan Google" first**, then "Lanjutkan dengan Email" (sign in, create account, forgot password); verify email; activation with the NIS |
| No PIN yet | Create PIN (after activation, and after an administrator reset) |
| Locked | PIN unlock (on start, and after a minute in the background), "Lupa PIN?" |
| Forgotten PIN | Self-service request (fresh sign-in, admin approval, 24-hour wait), status with countdown, cancel, new PIN; or a reset at the counter |
| App | Home (balance, latest lines, approved requests), approvals (Persetujuan), history, transaction detail, digital card (QR), account (Notifikasi switch, change PIN, change password, statement PDF, lock, sign out), withdrawal approval |

**New withdrawal requests arrive as push notifications** (Firebase Cloud Messaging,
§15.11). In the foreground the app shows its own banner; tapping a notification opens
the request after the usual checks (session, PIN unlock). The approvals screen also
polls every 4 seconds while it is open, in case a push was missed. The app never
approves from a notification: the PIN is always entered in the app. The web build has
no push and polls instead. The approval screen counts down on the server clock.

The session token is kept in the device keychain (`expo-secure-store`; on the web,
`localStorage`). The PIN is never stored.

## Run locally

```bash
npm install
npm run web        # browser, http://localhost:8081
```

Phones need a **development build**: push uses React Native Firebase, which does not
run in Expo Go.

```bash
npx expo prebuild          # generates android/ and ios/ (git-ignored)
npm run android            # expo run:android: builds, installs on a device/emulator, starts Metro
npm run ios                # expo run:ios: needs Xcode
```

Or build in the cloud with EAS (`npx eas-cli@latest build --profile development`) and
start Metro with `npx expo start --dev-client`. Android emulators need a **Google Play**
system image for FCM.

The app talks to `http://localhost:8000/api` in development (the Android emulator reaches the computer at `http://10.0.2.2:8000/api`). A phone on the same
Wi-Fi cannot reach `localhost`: create `.env.local` with the computer's address:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api
```

and start Laravel with `php artisan serve --host=0.0.0.0 --port=8000`.

### Testing without the real Firebase project

The Firebase Auth emulator needs no credentials and sends no email
(bank-mini-laravel `docs/CUSTOMER_AUTH.md` §9):

```bash
# firebase.json: {"emulators": {"auth": {"port": 9099}}}
firebase emulators:start --only auth --project demo-bank-mini
```

Start Laravel with `FIREBASE_PROJECT_ID=demo-bank-mini`,
`FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` and any well-formed service account JSON
in `FIREBASE_CREDENTIALS`, and the app with:

```dotenv
EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR=http://127.0.0.1:9099
EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-bank-mini
```

Verification links appear at
`http://127.0.0.1:9099/emulator/v1/projects/demo-bank-mini/oobCodes`.

## Push notifications (FCM)

- Firebase apps in project `bank-mini-rumput`: Android `1:418347097835:android:9c42c9380716171bdfe8ae`
  and iOS `1:418347097835:ios:52011a94debd30a7dfe8ae`, both `tech.rumput.bankmini`.
  `google-services.json` and `GoogleService-Info.plist` are committed; they identify the
  app and are not secret. The backend's service account key is never in the app.
- The app registers this phone's FCM token (`POST /customer/push-tokens`) after sign-in
  once the PIN exists, on every start while signed in, and when FCM rotates the token.
  The "Notifikasi" switch on the account screen removes it (`DELETE
  /customer/push-tokens`). Logout removes it on the server.
- Permission: Android 13+ asks for `POST_NOTIFICATIONS`, iOS asks through FCM. If the
  student refuses, the approvals screen still finds requests by polling.
- Code: `src/push/` (`messaging.native.ts` on phones, `messaging.ts` a no-op on the web),
  background handler registered in `index.js`.
- **iOS:** pushes need an APNs authentication key uploaded in the Firebase console
  (Project settings → Cloud Messaging → Apple app configuration). Until then iOS gets
  no pushes; polling still works.

## Checks

```bash
npm run typecheck
npm run lint
npm run build:web   # production web build in dist/
```

## Production

- **Android** (the only distributed build): an APK on the Releases page, built with EAS
  (`eas.json`, profile `preview`) from a version tag. It calls
  `https://api-bank.rumput.tech/api`. The Android package and the iOS bundle ID are
  `tech.rumput.bankmini`.
- **Web**: not deployed. The API's CORS allows only the staff site, so `npm run web` is for
  local development only.

Build, release key, Firebase fingerprints and publishing are covered in [DEPLOY.md](DEPLOY.md).

## Sign-in and forgotten PIN

- **Google first.** Every email/password sign-up sends a verification email from Firebase's
  small daily quota; Google sign-in sends none. Phones use native Google Sign-In
  (`@react-native-google-signin/google-signin`, `src/session/googleSignIn.native.ts`) with
  the Firebase web client ID, then `signInWithCredential`. There is no email-link
  (passwordless) sign-in anywhere.
- Same email already registered with a password (`auth/account-exists-with-different-credential`):
  the student signs in with the password first, then the Google credential is linked to that
  account. Accounts are never chosen by email.
- Login refusals: `account_not_linked` → NIS activation; `email_not_verified` → verify email;
  `activation_mismatch` and `firebase_token_invalid` → sign out, with the backend's message.
- Forgot password: Google accounts are sent to Google account recovery; password accounts get
  `sendPasswordResetEmail` with one message whatever happens, and a 60-second cooldown.
- Forgotten PIN (backend v0.1.1, `src/app/pin-reset.tsx`): reset at the counter, or a
  self-service request that needs a fresh sign-in, an administrator's approval (staff web) and
  a 24-hour wait. Withdrawals pause while a request is open; the unlock and home screens show
  it so the real owner can cancel. A `pin_reset` push refreshes the status.
- Release APKs need the signing key's SHA-1/SHA-256 in Firebase or Google answers
  `DEVELOPER_ERROR` (see [DEPLOY.md](DEPLOY.md)).

## Logo, icon and splash

From `new logo/` (navy `#1E3A8A`, gold `#F59E0B`): `assets/images/icon.png` (full-bleed),
the adaptive icon (`android-icon-foreground/background/monochrome.png`, mark inside the
safe zone), `splash-icon.png` and `favicon.png`, rendered from the SVG with `rsvg-convert`.
The native splash shows the logo on white; `src/components/AnimatedSplash.tsx` (from
`animation.ts`) takes over and pulses until the session is loaded. `src/components/LogoMark.tsx`
is the logo in the app header.

## Known limits

- An iOS build needs an iOS OAuth client in `GoogleService-Info.plist` (`REVERSED_CLIENT_ID`)
  for Google sign-in, and an APNs key for pushes.
- A push can be late or never arrive (permission refused, battery savers, no Google
  Play services); the approvals screen polls as the fallback.
- The web build has no push (the backend accepts only `android` and `ios` tokens).
