# Bank Mini: customer app

The students' app (Expo, React Native and web). Students sign in with the email the
school registered, activate their account with their NIS, create their own PIN, see
their balance, history and digital card, and approve or reject withdrawals the teller
starts at the counter. The staff web app is in `../front-end`; the API is
`bank-mini-laravel` (contract: its `docs/FRONTEND_HANDOFF.md` §15.9–15.10 and
`docs/API.md`).

## Screens

| Stage | Screens |
| --- | --- |
| Signed out | Sign in (email/password; Google on the web), create account, verify email, forgot password, activation with the NIS |
| No PIN yet | Create PIN (after activation, and after an administrator reset) |
| Locked | PIN unlock (on start, and after a minute in the background) |
| App | Home (balance, latest lines, approved requests), history, transaction detail, digital card (QR), account (change PIN, change password, statement PDF, lock, sign out), withdrawal approval |

While the app is open it polls for withdrawal requests every 4 seconds and shows a
banner above every tab; the approval screen counts down on the server clock.

The session token is kept in the device keychain (`expo-secure-store`; on the web,
`localStorage`). The PIN is never stored.

## Run locally

```bash
npm install
npm run web        # browser, http://localhost:8081
npm start          # Expo Go on a phone (scan the QR code)
```

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
- No push notifications (backend limitation L19): the student must have the app open
  for a withdrawal request to appear.
