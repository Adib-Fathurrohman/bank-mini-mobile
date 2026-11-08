# Releases

The only distributed output of this repository is the **Android APK**. It is published on
the repository's GitHub **Releases** page, and the APK talks to
**https://api-bank.rumput.tech/api**. No web build of this app is deployed: the API's CORS
allows only the staff site `https://bank.rumput.tech`, so a web build on another origin
would be blocked.

A release goes through four steps:

1. Tag `vX.Y.Z` on `main`.
2. Build the APK of that tag with **EAS Build** (profile `preview`).
3. Verify the APK.
4. Publish it with `gh release create`.

GitHub Actions is not used (see [Legacy](#legacy)).

## Versions

| Field | Where | Rule |
| --- | --- | --- |
| Version name | `app.json` → `expo.version` (and `package.json`) | `0.2.0` for tag `v0.2.0` |
| Version code | `app.json` → `expo.android.versionCode` | +1 for every APK given to anyone, never reused (`eas.json` uses `appVersionSource: local`) |
| Package | `tech.rumput.bankmini` | Never changes |

## Build profiles ([eas.json](eas.json))

| Profile | Output | API |
| --- | --- | --- |
| `development` | Dev client APK (debug, Metro) | `http://10.0.2.2:8000/api` (emulator → local backend) |
| `preview` | Release APK, internal distribution | `https://api-bank.rumput.tech/api` |
| `production` | AAB, for a future Play Store listing | `https://api-bank.rumput.tech/api` |

`EXPO_PUBLIC_API_URL` is set in each profile. A release build without it still uses
`https://api-bank.rumput.tech/api`, the default in [src/lib/config.ts](src/lib/config.ts).

## 1. Build the APK (EAS)

You need an Expo account. Run `npx eas-cli@latest login` once; the project is linked
through `expo.extra.eas.projectId` in `app.json`.

```bash
V=0.1.0
git tag -a v$V -m "v$V" && git push origin main v$V
rm -rf /tmp/mobile-build && git clone --depth 1 --branch v$V https://github.com/Adib-Fathurrohman/bank-mini-mobile /tmp/mobile-build
cd /tmp/mobile-build && npm ci
npx eas-cli@latest build --platform android --profile preview --non-interactive --wait
```

The build ID is printed and shown on expo.dev. Download the APK from the build page, or with
`eas build:view <id>`, and name it `rumput-bank-mini-android-vX.Y.Z.apk`.

### Release key

EAS created and keeps the Android **release key** (upload keystore) for
`tech.rumput.bankmini`. Every later version must be signed with the same key, or
installed phones refuse the update.

- Back up the key with `npx eas-cli@latest credentials` → Android → `preview`/`production`
  → *Download credentials*. Store it outside every repository with mode 600, for example
  `~/.bank-mini/`, and keep a copy offline. The repositories never contain it (`*.jks` is
  git-ignored).
- Read its fingerprints with `eas credentials`, or from the APK:
  `apksigner verify --print-certs app.apk`.

### Firebase fingerprints (Google sign-in)

Email/password sign-in and push (FCM) work without this. **Google sign-in** on Android
works only if the release key's SHA-1 and SHA-256 are registered for the Android app
`tech.rumput.bankmini` in Firebase project `bank-mini-rumput`:

```bash
firebase apps:android:sha:create 1:418347097835:android:9c42c9380716171bdfe8ae <SHA-1> --project bank-mini-rumput
firebase apps:android:sha:create 1:418347097835:android:9c42c9380716171bdfe8ae <SHA-256> --project bank-mini-rumput
firebase apps:sdkconfig ANDROID 1:418347097835:android:9c42c9380716171bdfe8ae --project bank-mini-rumput > google-services.json
```

You can also do this in the console: Project settings → Your apps → Android → Add
fingerprint. Then commit the new `google-services.json`, which now has the OAuth client
entries, and build again. Without this, Google sign-in in a release APK fails with
`DEVELOPER_ERROR` (code 10).

Done for the EAS release key on 2026-11-08 (SHA-1 `b9722262ebca35ddc3d503be5f1ac1544e1f1a15`,
SHA-256 `72169017451d9741d048d7e4c24c6b4e121c83a55b912291725a1e17e2df190b`); the committed
`google-services.json` has the matching Android OAuth client. A local build signed with
another key (debug keystore) needs its own fingerprints registered before Google sign-in works
in it.

### Local build (alternative)

You need JDK 17–25 and `ANDROID_HOME=~/Library/Android/sdk`.

```bash
EXPO_PUBLIC_API_URL=https://api-bank.rumput.tech/api npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease bundleRelease
```

Then sign with `zipalign` + `apksigner sign --ks <backed-up keystore>`, and run
`apksigner verify`. Use the **same key** as the EAS builds.

## 2. Verify the APK

```bash
APK=rumput-bank-mini-android-v0.1.0.apk
shasum -a 256 $APK
$ANDROID_HOME/build-tools/37.0.0/apksigner verify --print-certs $APK   # certificate SHA-256
$ANDROID_HOME/build-tools/37.0.0/aapt2 dump badging $APK | head -1      # package, versionName, versionCode
unzip -p $APK 'assets/*.bundle' | grep -c 'api-bank.rumput.tech'        # > 0
unzip -p $APK 'assets/*.bundle' | grep -E 'localhost|10\.0\.2\.2|192\.168\.|bank\.rumput\.tech/api'   # nothing
```

Install it on a device or a Google Play emulator with `adb install`, and check that the
sign-in screen reaches the API.

## 3. Publish

```bash
shasum -a 256 $APK > $APK.sha256
gh release create v0.1.0 $APK $APK.sha256 --verify-tag --prerelease \
  --title "Android v0.1.0" --notes "..."
```

The notes list the version, package ID, version code, EAS build ID, commit SHA, build time
(UTC), APK SHA-256 and signing certificate SHA-256. The repository is public, so the
assets must contain no secrets. Download the asset again from the release and check
`shasum -a 256 -c`.

## iOS

Not built yet. An iOS build needs an Apple developer account and EAS or Xcode. Pushes
need an APNs key uploaded to Firebase.

## Legacy

These belong to the old layout and are **not used**:

- [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml). It deploys a web build to
  `app.rumput.tech` on a push to `production`, and GitHub Actions is disabled for this
  account.
- [.github/workflows/release.yml](.github/workflows/release.yml). It builds the APK on a
  tag with a keystore from GitHub secrets, which were never set up.
- [deploy/nginx/app.rumput.tech.conf](deploy/nginx/app.rumput.tech.conf). Its web build
  calls `/api` on its own origin.

Do not push a `production` branch.
