# AlphaFit AI - mobile app

The AlphaFit iOS and Android app: onboarding, AI food scan (photo and barcode), diet questions, workouts, physique projection questions, and an AI coach chat. It is an Expo (React Native) app written in TypeScript.

It talks to the AlphaFit api (`Alphafit_Backend`) and signs users in with Firebase (Google, Apple on iOS, email). The routes the app calls are listed in `docs/CONTRACTS.md` of the workspace; the plan for the app is in `docs/ROADMAP.md` (work packages `WP-MOB-*`).

## What you need

| Tool | Version |
|---|---|
| Node.js | 24 (LTS). The CI pipeline uses the same version. |
| npm | the one that ships with Node (the lock file is `package-lock.json`) |
| Expo Go (SDK 58) on an Android phone | to try the app quickly (`npm run phone`, see "Test on your phone with Expo Go"); Google sign-in is hidden there |
| A development build | for everything Expo Go lacks (Google sign-in); see "Testing with a development build" |
| EAS CLI | to make development, preview and production builds (`npm i -g eas-cli`, then `eas login`) |

There is no web build of the app for users.

## First run

```bash
npm ci                      # exact versions from package-lock.json
cp .env.example .env        # optional, see "Configuration"
EXPO_PUBLIC_API_URL=http://<this computer's Wi-Fi address>:8180 npm run phone   # Expo Go on an Android phone
```

Or, with a development build: `npm run build:dev:android` once, then `npm run start:dev-client`. Because
`expo-dev-client` is installed, a plain `npx expo start` opens in development-client mode; `npm run phone`
passes `--go` for Expo Go.

## Configuration

All configuration is read in `app.config.ts` (it replaces `app.json`) and reaches the code through `config.ts`.

| Variable | Default | Meaning |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api.alphafit-ai.com` | Address of the api, with or without a trailing slash. Must start with `http://` or `https://`; anything else stops the build with a clear message. |

- For local development copy `.env.example` to `.env` (ignored by git). To use the local stack in `Alphafit-manifests/compose` (api on port 8180): `http://10.0.2.2:8180` from the Android emulator, `http://localhost:8180` from the iOS simulator, `http://<your computer's LAN address>:8180` from a phone.
- For a build on EAS, each profile in `eas.json` sets it under `env` (see "Releasing"); plain `http://` is accepted for the `development` profile only.
- Changing it needs a restart of Metro (`npm run start:dev-client`) or a new build; it is read when the app is configured, not while it runs.
- The Firebase web configuration and the Google OAuth client ids in `app.config.ts` are public identifiers that ship inside every build; they are not secrets. `google-services.json` and `GoogleService-Info.plist` are the Firebase files for Android and iOS. Never put a password, a private key or a service account here.

## Scripts

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (TypeScript, strict) |
| `npm run lint` | ESLint over the whole repository; **any warning fails** |
| `npm test` | Jest with `jest-expo` and Testing Library; includes the translation audit |
| `npm run test:ci` | the same, without watch mode |
| `npm run format:check` | Prettier, on the files this branch changed (see "Formatting") |
| `npm run format` | formats those files |
| `npm run i18n:check` | translation audit on its own (same code the test runs) |
| `npm run check` | typecheck, lint and tests, as the pull request pipeline does |
| `npm run phone` | Metro for Expo Go on a phone on the same Wi-Fi (`expo start --lan --go --port 8081`); needs `EXPO_PUBLIC_API_URL` set to an address the phone can reach |
| `npm run preview:build` / `preview:shots` / `preview:flows` | dev-only web harness against a mock api: screenshots and navigation checks for developers |
| `npm run preview:marketing` | marketing screenshots (Demo User, real food photos) into `.preview/marketing`, after `preview:build` |
| `npm run start:dev-client` | Metro for a development build |
| `npm run build:dev:android` / `build:dev:ios` | development build with EAS |
| `npm run build:preview:android` / `build:preview:ios` | preview (internal) build with EAS |

Before opening a pull request run `npm run check` and `npm run format:check`. To prove the JavaScript bundle builds, run `npx expo export --platform android --output-dir <a folder outside the repository>` and delete the folder afterwards.

## How the code is laid out

```
app/             expo-router routes. Keep route files thin.
  _layout.tsx      root: fonts, saved language and theme, error boundary, the one set of providers
  index.tsx        redirects to the launch screen
  onboarding/      splash (launch check), intro, login, register, and the nine question screens
  (tabs)/          home, workouts, projections, diet, profile
  diet/ projection/ profile/   wizards and settings screens
components/      shared UI: Button, Input, Alert, ErrorState, ErrorBoundary, ProPlanModal ...
constants/       Colors, Fonts, Spacing, SharedStyles
context/         UI state only: Theme, Onboarding, Diet, Projection, and AppProviders
hooks/           useProfilePicture, useApplyServerPreferences, useProjectionPrefill ...
i18n/            i18next setup (config.ts) and the three languages in locales/
services/        api client and everything that talks to the api or to Firebase
scripts/         check-i18n.js, format-changed.js
__tests__/       Jest tests
```

Key modules in `services/`:

| File | Role |
|---|---|
| `apiClient.ts` | axios instance: base URL, `Authorization` header, forgets the token on 401 |
| `apiError.ts` | `normalizeApiError` (offline, timeout, http), and a logger that never prints headers or tokens |
| `session.ts` | the one `signOut()` and the registry the stores use to reset themselves |
| `bootstrap.ts` | the launch check (`bootstrapSession`) and `completeSignIn` |
| `onboardingResume.ts` | where a signed-in user continues; the only place that decides it |
| `preferences.ts` | saved language and theme (device first, server only when the user changes them) |
| `firebaseAuthService.ts` | Firebase and Google sign-in; keeps `error.code` |
| `tokenStore.ts`, `storage.ts` | the api token on the device |

## Design system

Semantic tokens (`src/theme/tokens.ts`: colour, spacing, radius, type scale, elevation) for light and dark come from the
brand palette in `constants/Colors.ts` (dark navy, coral `#FF6B4A`). Every text and background pair that carries text is
checked for WCAG AA (4.5:1) in both themes by `npm test`; text on the coral accent is dark navy, never white. Screens read
`useTheme().tokens`; the older `colors` object stays for screens not moved yet. The theme preference is `system`, `light`
or `dark` (Settings); `system` follows the phone and is never sent to the server.

The primitives are in `src/ui`: `Screen` (safe areas, keyboard handling with `react-native-keyboard-controller`),
`Text`, `Button`, `Input`, `OptionCard`, `ListItem`, `Dialog`, `Sheet`, `Toast`, `WheelPicker` (one virtualised
picker), `Skeleton`, `EmptyState`, `ErrorState`, `WizardStep`, `StepTransition`, `AppImage` (expo-image) and helpers for
haptics and reduced motion. `react-native-keyboard-controller` is a native module; Expo Go SDK 58 ships it, and a
development build made before it was added needs to be rebuilt.

## Feature flags

`constants/Features.ts` holds switches for work that is built but not offered. `projections` (default `false`,
ROADMAP decision D2) hides the Projections tab, the mock physique scores on the intro, and the FAQ and Pro plan
lines about the physique analysis. The code stays (`app/(tabs)/projections.tsx`, `app/projection/*`); set it to
`true` to bring it back.

## Screenshot and flow harness (dev only)

A web export of the app (`react-native-web`) against a small mock api, for developers: screenshots of every
screen in light and dark at phone sizes, and navigation flows through the real route guards. It is not a way
to try the app (use Expo Go or a development build on a phone) and none of it reaches an app build: the CI
bundle check (`scripts/check-bundle.js`) fails if a harness stub is in the Android bundle.

```bash
npm run preview:build           # web export into .preview/dist (git-ignored), against tools/preview/mock-api.js
npm run preview:shots           # 390x844 and 360x740, light and dark -> .preview/shots/*.png
npm run preview:shots -- --states --routes=/home,/profile --themes=dark   # error states; a subset
npm run preview:flows           # navigation, session and scan-edit flows (PATCH 200, 409, 404, alternatives)
npm run preview:marketing       # Home, a scan result, History, Workouts, the coach: light and dark, 2x PNGs
```

`preview:marketing` uses the mock api's marketing data: a made-up "Demo User", meals with real photos from
`../Scan_Food/tests/fixtures/images` (public-domain and CC0 files only; `FOOD_PHOTOS_DIR` changes the folder)
and a short sample chat. It writes the PNGs and `PHOTO-LICENSES.md` (the photos' licence rows) to
`.preview/marketing` (git-ignored; it replaces what is there, so copy the pictures elsewhere before running it
again if they are in use). For store listings, take the final pictures on a device.

How it works: `EXPO_PUBLIC_PREVIEW=1` (set only by `tools/preview/build.js`) makes `metro.config.js` replace
the native-only modules (Google and Apple sign-in, camera, secure-store, haptics, and Firebase auth) with
stubs from `tools/preview/stubs/`, for the web platform only. `tools/preview/mock-api.js` is a small mock of
the api with realistic data and a switch (`POST /__mode {"fail":"offline"|"500"|"401"}`) that makes it fail,
so the error states can be photographed. `playwright-core` uses the Chrome installed on the machine. The web
cannot show native fonts and shadows, the keyboard, safe areas, the camera, haptics or gestures.

## Rules the code follows

- **Server data lives in the query cache** (TanStack Query, saved on the device, paused offline), not in React state. Screens read it with the hooks in `hooks/queries.ts`; the contexts only read and patch the cache and keep wizard steps. `signOut()` empties the cache and its saved copy.
- **The api client types every failure** (`ApiError`: `offline`, `timeout`, `http`, `cancelled`) and, on a 401, renews the token once from the Firebase session (single-flight) and repeats the request; if that fails it signs the user out. A 403 is a wrong role and signs nobody out. The token is in `expo-secure-store`.
- **Routes are guarded by the session** (`services/sessionStore.ts`: loading, signedOut, onboarding, ready) with `Stack.Protected` in `app/_layout.tsx` and `app/onboarding/_layout.tsx`. To go somewhere after a sign-in or sign-out, change the session store and `router.replace('/')`; `app/index.tsx` sends the user to the right screen.
- **A failed request is an error, never "no data".** The launch check, the diet and projection tabs, Home, the profile and the history show a retry (`ErrorState`) when a request fails; they do not start the wizard again or show empty numbers.
- **One sign-out.** Logout, account deletion and an expired session all call `signOut()` from `services/session.ts`. It clears the token, the onboarding, diet, projection and theme stores, the cached profile picture, and the Firebase and Google sessions. Do not sign out anywhere else.
- **Providers are mounted once**, in `context/AppProviders.tsx`, from `app/_layout.tsx`. A second provider in a nested layout would hide the data from screens outside it.
- **Language and theme are read from the phone at start-up** (no request) and sent to the account only when the user changes them. Change the language with `setLanguage()` from `i18n/config.ts`, never with `i18n.changeLanguage`.
- **No literal user-visible text in screens.** Use `t('key')`. English, French and Spanish keep exactly the same keys; `npm test` fails if a key used in the code is missing, or if the three files differ.
- **No `console` patching and no logging of tokens, e-mails or request objects.** Use `logError(context, error)`.
- **Api date-times are UTC without a zone** (`docs/CONTRACTS.md` section 1). Read every one with `parseApiDate` from `services/apiTime.ts`, never `new Date(value)`: the phone would take it for local time. The tests run in a fixed UTC+1 zone (`jest.globalSetup.js`) and the helper is also tested in UTC-5.

## Translations

The three files are `i18n/locales/{en,fr,es}.json`. When you add a key, add it to all three in the same change, with a real translation (English text copied into French or Spanish is flagged by the test). `npm run i18n:check` lists missing keys, parity problems and keys that nothing uses. A key built at run time (`` t(`faq.items.${id}.question`) ``) is recognised by its fixed prefix; keys kept in a lookup table (`titleKey: 'home.title'`) are recognised as strings.

## Formatting

Prettier is configured (`.prettierrc.json`) but is **not** applied to the whole repository at once, so a formatting pass never hides a real change. `npm run format:check` checks only the files that differ from the base branch (`origin/main`, or `FORMAT_BASE`), `npm run format` fixes them. A file is formatted the first time a branch edits it.

## Continuous integration

`Jenkinsfile` runs on every pull request in a pinned Node container: `npm ci`, typecheck, lint, tests, the format check on changed files, and a bundle check (`expo export` to a temporary folder, then `scripts/check-bundle.js`, which fails if a stub of the dev-only web harness reached the bundle). There is no image build and no deployment, because the app is not a service: builds for testers and for the stores are made with EAS.

## Test on your phone with Expo Go

The quickest way to try the app on a phone: no build, the JavaScript comes from this computer.

**Android**

1. Install **Expo Go for SDK 58** (the Play Store version, or https://expo.dev/go). An Expo Go for another SDK
   cannot open this project.
2. Put the phone on the same Wi-Fi as this computer.
3. Start the local stack (`Alphafit-manifests/compose`) in its phone mode, so the api answers on this
   computer's Wi-Fi address.
4. In this folder: `EXPO_PUBLIC_API_URL=http://<this computer's Wi-Fi address>:8180 npm run phone`
   (PowerShell: `$env:EXPO_PUBLIC_API_URL="http://192.168.1.190:8180"; npm run phone`). It refuses
   `localhost` and an unset address: a phone cannot reach this computer's localhost.
5. Scan the QR code with Expo Go, or open the `exp://<address>:8081` link it prints.

In Expo Go, **Google sign-in is hidden** (its native module is not in Expo Go); e-mail sign-in and
registration work. Everything else the app uses natively is in Expo Go SDK 58 (camera and barcode, image
picker and resizing, secure storage, haptics, keyboard handling, reanimated).

**iPhone:** the App Store has only the newest Expo Go. It opens this project while that is the SDK 58 one
(not tried from here); when Expo Go moves to a newer SDK, use a development build (below) or upgrade the app.

**If the phone cannot connect**

- "Could not connect to the development server": the phone and the computer must be on the same Wi-Fi
  (not a guest network that isolates devices), and Windows Firewall must allow Node.js on private networks
  (port 8081). The address in the `exp://` link must be this computer's Wi-Fi address; when the api address is
  a LAN address, `npm run phone` makes Metro advertise that same one (`REACT_NATIVE_PACKAGER_HOSTNAME`).
- The app opens but says it cannot reach AlphaFit: open `http://<address>:8180/health` in the phone's browser.
  If that fails, the api is not published on the Wi-Fi address (the stack's phone mode) or port 8180 is
  blocked by the firewall.
- "Project is incompatible with this version of Expo Go": the phone's Expo Go is for another SDK; install the
  one for SDK 58 (Play Store, or expo.dev/go).
- Sign-in fails with a server error: the api needs the owner's Firebase service-account file
  (`FIREBASE_SERVICE_ACCOUNT_FILE`) to check Firebase sign-ins; without it `POST /auth/firebase` answers 503.

## Testing with a development build

A development build is this app with its own native code: it has Google sign-in and runs on an iPhone. It
has to be built once (and again when a native dependency changes). Nothing here has been built from the
development computer (it has no Android SDK); the steps below are what the owner runs.

### 1. Development build with EAS (recommended)

What the owner needs: an Expo account that is a member of the project's owner account (`owner` and
`extra.eas.projectId` in `app.config.ts`), and `npm i -g eas-cli` then `eas login`.

- **Android:** `npm run build:dev:android`. EAS builds an APK in its cloud (on the first build it offers to
  create and keep the Android signing key: accept) and prints a link and QR code; open it on the phone and
  allow installing apps from that source.
- **iOS:** needs a paid Apple Developer account. Register the phone with `eas device:create`, then
  `npm run build:dev:ios`.
- **Then:** `npm run start:dev-client` on the computer and open AlphaFit on the phone. It loads the
  JavaScript from Metro on port 8081 (same Wi-Fi, or `adb reverse tcp:8081 tcp:8081` over USB). The api
  address comes from `.env` when Metro starts, so changing it needs a Metro restart, not a new build.
- **Google sign-in** checks the signing key: copy the SHA-1 that `eas credentials -p android` shows for the
  build's key into the Firebase console (Project settings, Android app `com.app.alphafit`, "Add
  fingerprint"), then download `google-services.json` again and replace the one in this folder. Without it
  Google sign-in fails with `DEVELOPER_ERROR`; e-mail sign-in still works. Every key needs its own entry
  (development, a local debug key, the Play Store key).

### 2. Local Android build in Docker (no Expo cloud)

Possible but not set up: an image with the JDK, the Android SDK (platform and build tools of SDK 58's
`compileSdkVersion`), the NDK version React Native 0.88 asks for, and Node 24; about 15 GB of disk and 8 GB
of memory for Gradle. Inside it: `npm ci`, `npx expo prebuild --platform android`, then
`cd android && ./gradlew assembleDebug`. Install the APK from the host with `adb install` (USB debugging on
the phone; USB pass-through into Docker does not work on Windows). A debug build is signed with the debug
key, whose SHA-1 must be registered in Firebase for Google sign-in, as above.

### 3. How the phone reaches an api

| Api | How | Notes |
|---|---|---|
| Local stack, phone on the same Wi-Fi | the stack's phone mode, and `EXPO_PUBLIC_API_URL=http://<computer's Wi-Fi address>:8180` (environment or `.env`), restart Metro | What `npm run phone` uses. |
| Local stack on this computer, phone on USB (Android) | `adb reverse tcp:8180 tcp:8180`; the `development` profile and `.env` use `http://localhost:8180` | A development build only (`npm run phone` refuses localhost). |
| The future VPS | the `preview` or `production` profile (`https://...`) | `api.alphafit-ai.com` is the production name; the preview host is not chosen yet (placeholder in `eas.json`). |

Whatever the api, signing in with Firebase on a phone needs the api to verify Firebase ID tokens: it reads
the owner's Firebase service-account file (`FIREBASE_SERVICE_ACCOUNT_FILE`, `docs/CONTRACTS.md` section 5).
The local stack runs without it and then answers `POST /auth/firebase` with 503, so a phone cannot sign in
against it until the owner supplies that file (from the Firebase console: Project settings, Service accounts,
"Generate new private key"; never commit it).

## Releasing

Builds are made with EAS from the profiles in `eas.json`. Run builds only when the owner asks for one.

| Profile | For | Api (`EXPO_PUBLIC_API_URL`) | Channel | Notes |
|---|---|---|---|---|
| `development` | the owner's and developers' phones | `http://localhost:8180` (USB with `adb reverse`; `.env` overrides it when Metro starts) | `development` | debug build with the development client; the only profile that may use plain http |
| `preview` | testers (internal distribution, APK) | `https://REPLACE-WITH-PREVIEW-API-HOST`: **placeholder**, set it when the owner chooses a host | `preview` | build number increases by itself |
| `production` | the stores (Android app bundle, iOS archive) | `https://api.alphafit-ai.com` | `production` | build number increases by itself |

`app.config.ts` enforces this when EAS builds (`EAS_BUILD_PROFILE` is set): a preview or production build
with an `http://` address, or with the placeholder host, stops with a message instead of producing an app
that cannot reach the api. On Android the main manifest allows cleartext (http) traffic only for the
development profile (`android:usesCleartextTraffic`); iOS release builds keep App Transport Security on.
Version numbers come from EAS (`appVersionSource: remote`, `autoIncrement`).

**Decisions for the owner** (not made here):

1. **Expo account:** which Expo account owns the project (today `owner: alpha_fit` and its project id) and who
   is a member; the builds, signing keys and update channels live there.
2. **Crash reporting:** none is installed. Options are Sentry (`@sentry/react-native`, works with EAS), Firebase
   Crashlytics (the app already uses Firebase; needs `@react-native-firebase/crashlytics`) or Bugsnag. Each
   needs a native module (a new build) and, for readable stack traces, source maps uploaded at build time.
3. **Over-the-air updates:** `expo-updates` is not installed, so the `channel` names in `eas.json` have no
   effect yet. Adding it lets JavaScript-only fixes reach installed apps without a store release; it needs a
   `runtimeVersion` policy and a rule for what may ship over the air.
4. **The preview api host** (replaces the placeholder above) and whether testers use the Play Store internal
   track or the APK link.

## Troubleshooting

- *The app sits on the launch screen, then shows "We can't reach AlphaFit".* The app could not reach the api. Check `EXPO_PUBLIC_API_URL` and that the phone can open that address in its browser.
- *Google sign-in does nothing or fails with a developer error.* Use a development build (not Expo Go) built from this repository, and check that the SHA-1 of the signing key is registered in the Firebase console.
- *`npm run lint` fails on a warning.* Warnings are errors here. Fix them; do not add `eslint-disable` without a reason in a comment.
- *A test fails with a missing translation key.* Run `npm run i18n:check`; it names the key and the file that uses it.
