# Bank Mini: customer app

The students' app (Expo, React Native and web). Students sign in with the email the
school registered, activate their account with their NIS, create their own PIN, see
their balance, history and digital card, and approve or reject withdrawals the teller
starts at the counter. The staff web app is in `../front-end`; the API is
`bank-mini-laravel` (contract: its `docs/FRONTEND_HANDOFF.md` §15.9–15.11 and
`docs/API.md`).

## Screens

| Stage | Screens |
| --- | --- |
| Signed out | Sign in (email/password; Google on the web), create account, verify email, forgot password, activation with the NIS |
| No PIN yet | Create PIN (after activation, and after an administrator reset) |
| Locked | PIN unlock (on start, and after a minute in the background) |
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

The app talks to `http://localhost:8000/api` in development. A phone on the same
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

- **Web** (`https://app.rumput.tech`): `npm run build:web`, served by nginx with `/api`
  proxied to Laravel on the same origin (a production web build calls `/api` by
  default). Deployed by `.github/workflows/deploy.yml` in this repository.
- **Phones**: production builds call `https://bank.rumput.tech/api`. Build with EAS
  (`npx eas-cli@latest build`). The Android package and iOS bundle ID are
  `tech.rumput.bankmini`.

## Known limits

- **Google sign-in on phones** needs a native module (`@react-native-google-signin`),
  a development build, and the Android/iOS apps registered in Firebase with their
  signing keys. Until then phones use email and password; the web version offers
  Google. A student who created the account with Google can add a password with
  "Lupa password".
- A push can be late or never arrive (permission refused, battery savers, no Google
  Play services); the approvals screen polls as the fallback.
- The web build has no push (the backend accepts only `android` and `ios` tokens).
