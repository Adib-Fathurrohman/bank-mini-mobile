# Deployment and releases

Two outputs from this repository:

| Output | How | Where |
| --- | --- | --- |
| Web build | push to the `production` branch → [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) | https://app.rumput.tech (`/var/www/bank-mini-app` on the VPS) |
| Android APK | push a tag `v*` (e.g. `v1.0.0`) → [.github/workflows/release.yml](.github/workflows/release.yml) | the repository's **Releases** page |

Every push and pull request to `main` and `production` runs the typecheck, lint and web build.

The API is deployed from `bank-mini-laravel`, the staff web app from `ukk_bank_mini`.

## 1. Web build (app.rumput.tech)

GitHub → Settings → Environments → **`production`**, with the same secrets as the other two
repositories:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | `rumput.tech` |
| `DEPLOY_USER` | SSH user, e.g. `root` |
| `DEPLOY_SSH_KEY` | Private deploy key |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan rumput.tech` (recommended) |

Variables (optional): `CUSTOMER_WEB_PATH` (default `/var/www/bank-mini-app`), `DEPLOY_PORT` (`22`).

nginx on the VPS, once ([deploy/nginx/app.rumput.tech.conf](deploy/nginx/app.rumput.tech.conf)
serves the app and sends `/api` to Laravel on the same origin):

```bash
cp deploy/nginx/app.rumput.tech.conf /etc/nginx/sites-available/app.rumput.tech
ln -s /etc/nginx/sites-available/app.rumput.tech /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d app.rumput.tech
```

DNS: `A app → 179.197.249.250`, `AAAA app → 2a02:4780:5e:7723::1`.

## 2. Android releases

The release build embeds the JavaScript and calls `https://bank.rumput.tech/api`. It is signed
with your **release key**, made once and kept safe: every later version must be signed with
the same key, or phones refuse the update.

```bash
keytool -genkeypair -v -storetype JKS -keystore bank-mini-release.jks \
  -alias bank-mini -keyalg RSA -keysize 2048 -validity 10000
base64 -i bank-mini-release.jks | pbcopy      # copies it for the secret below
```

Repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | the base64 of `bank-mini-release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `bank-mini` |
| `ANDROID_KEY_PASSWORD` | key password |

Never commit the `.jks` file.

Then publish a version:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow builds `bank-mini-v1.0.0.apk`, signs it and creates the release with notes from
the commits since the previous tag.

**Push notifications in release builds:** register the release key's SHA-256 (and SHA-1) on
the Android app in Firebase (Project settings → Your apps → Bank Mini Android → Add
fingerprint) if you later add Google sign-in; FCM itself works without it.
`keytool -list -v -keystore bank-mini-release.jks -alias bank-mini` prints them.

## iOS

Not built by CI (needs a Mac with Xcode or EAS, and an Apple developer account). Pushes need
an APNs key uploaded to Firebase.
